require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./database');
const { authenticateToken, requireAdmin, requirePayment, generateToken } = require('./middleware/auth');
const { enviarEmailRecuperacao, enviarEmailRecuperacaoMultiplos, enviarEmailValidacao } = require('./services/email');
const stripeService = require('./services/stripe');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Rotas da API (ANTES do express.static para evitar conflitos)

// ========== WEBHOOK DO STRIPE (DEVE VIR ANTES DO bodyParser.json) ==========
// O webhook precisa processar raw body, então deve vir antes do bodyParser.json
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        if (!stripeService.stripe) {
            console.error('Stripe não está configurado');
            return res.status(500).json({ error: 'Stripe não está configurado' });
        }
        event = stripeService.stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error('Erro na verificação do webhook:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        console.log('📥 Webhook recebido:', event.type);
        const resultado = await stripeService.processarWebhook(event);

        if (!resultado) {
            console.log('⚠️  Evento não processado:', event.type);
            return res.json({ received: true });
        }

        console.log('✅ Evento processado:', resultado.tipo);

        // Processar pagamento único
        if (resultado.tipo === 'pagamento_unico' || resultado.tipo === 'pagamento_unico_sucesso') {
            const userId = resultado.userId || (resultado.metadata?.user_id ? parseInt(resultado.metadata.user_id) : null);
            const paymentIntentId = resultado.paymentIntentId || resultado.sessionId;

            console.log('💳 Processando pagamento único - UserId:', userId, 'PaymentIntentId:', paymentIntentId);

            if (userId && paymentIntentId && stripeService.stripe) {
                let valor = 199.00; // Valor padrão
                let customerId = null;

                // Se for checkout.session.completed, buscar dados da sessão
                if (resultado.tipo === 'pagamento_unico' && resultado.sessionId) {
                    try {
                        const session = await stripeService.stripe.checkout.sessions.retrieve(resultado.sessionId);
                        valor = session.amount_total ? session.amount_total / 100 : valor;
                        customerId = session.customer || null;
                    } catch (err) {
                        console.error('Erro ao buscar sessão:', err);
                    }
                } else if (resultado.tipo === 'pagamento_unico_sucesso') {
                    // Se for payment_intent.succeeded (checkout transparente), usar dados do payment intent
                    valor = resultado.amount || valor;
                    customerId = resultado.customerId || null;
                }

                const planoId = resultado.metadata?.plano_id ? parseInt(resultado.metadata.plano_id) : null;

                console.log('💰 Valor do pagamento:', valor);
                console.log('📋 Plano ID:', planoId);

                // Verificar se o pagamento já foi salvo (idempotência)
                const pagamentoExistente = await db.obterPagamentoUnicoPorStripeId(paymentIntentId);
                if (pagamentoExistente) {
                    console.log('ℹ️  Pagamento já foi processado anteriormente (via confirmação direta ou webhook anterior)');
                } else {
                    await db.criarPagamentoUnico(userId, {
                        stripe_payment_intent_id: paymentIntentId,
                        stripe_customer_id: customerId,
                        valor: valor,
                        status: 'succeeded',
                        plano_id: planoId,
                    });

                    console.log('✅ Pagamento único salvo no banco de dados via webhook para usuário:', userId, 'PlanoId:', planoId);
                }
            } else if (resultado.tipo === 'pagamento_unico_sucesso' && !userId) {
                // payment_intent.succeeded sem userId no metadata (pode ser de checkout session já processado)
                // Verificar se já foi processado por checkout.session.completed
                console.log('ℹ️  payment_intent.succeeded recebido sem userId - verificando se já foi processado');
            } else {
                console.error('❌ Dados insuficientes para processar pagamento único:', { userId, paymentIntentId });
            }
        }

        // Processar assinatura
        if (resultado.tipo === 'assinatura') {
            const userId = resultado.metadata?.user_id ? parseInt(resultado.metadata.user_id) : null;
            const planoId = resultado.metadata?.plano_id ? parseInt(resultado.metadata.plano_id) : null;

            console.log('📋 Processando assinatura - UserId:', userId, 'PlanoId:', planoId, 'SubscriptionId:', resultado.subscriptionId);

            if (userId) {
                await db.criarOuAtualizarAssinatura(userId, {
                    stripe_subscription_id: resultado.subscriptionId,
                    stripe_customer_id: resultado.customerId,
                    plano_tipo: 'anual',
                    plano_id: planoId,
                    status: resultado.status,
                    current_period_start: resultado.currentPeriodStart,
                    current_period_end: resultado.currentPeriodEnd,
                    cancel_at_period_end: resultado.cancelAtPeriodEnd || false,
                });

                console.log('✅ Assinatura salva no banco de dados para usuário:', userId, 'PlanoId:', planoId, 'Status:', resultado.status);
            } else {
                console.error('❌ UserId não encontrado no metadata da assinatura');
            }
        }

        // Processar cancelamento de assinatura
        if (resultado.tipo === 'assinatura_cancelada') {
            console.log('🚫 Processando cancelamento de assinatura:', resultado.subscriptionId);
            const assinatura = await db.obterAssinaturaPorStripeId(resultado.subscriptionId);
            if (assinatura) {
                await db.criarOuAtualizarAssinatura(assinatura.usuario_id, {
                    stripe_subscription_id: resultado.subscriptionId,
                    stripe_customer_id: resultado.customerId,
                    plano_tipo: 'anual',
                    plano_id: assinatura.plano_id,
                    status: 'canceled',
                    current_period_start: assinatura.current_period_start,
                    current_period_end: assinatura.current_period_end,
                    cancel_at_period_end: false,
                });
                console.log('✅ Assinatura cancelada no banco de dados para usuário:', assinatura.usuario_id);
            }
        }

        // Processar falha no pagamento
        if (resultado.tipo === 'pagamento_falhou') {
            console.log('❌ Processando falha no pagamento:', resultado.subscriptionId);
            const assinatura = await db.obterAssinaturaPorStripeId(resultado.subscriptionId);
            if (assinatura) {
                await db.criarOuAtualizarAssinatura(assinatura.usuario_id, {
                    stripe_subscription_id: resultado.subscriptionId,
                    stripe_customer_id: resultado.customerId,
                    plano_tipo: 'anual',
                    plano_id: assinatura.plano_id,
                    status: 'past_due',
                    current_period_start: assinatura.current_period_start,
                    current_period_end: assinatura.current_period_end,
                    cancel_at_period_end: assinatura.cancel_at_period_end,
                });
                console.log('⚠️  Status da assinatura atualizado para past_due para usuário:', assinatura.usuario_id);
            }
        }

        console.log('✅ Webhook processado com sucesso');
        res.json({ received: true });
    } catch (error) {
        console.error('Erro ao processar webhook:', error);
        res.status(500).json({ error: 'Erro ao processar webhook' });
    }
});

// Agora aplicar bodyParser.json para todas as outras rotas
// Aumentar limite para 50MB para permitir upload de imagens em base64
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// ========== ROTAS DE AUTENTICAÇÃO (SEM MIDDLEWARE) ==========

// Login (aceita username ou email)
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, senha } = req.body;
        
        if (!username || !senha) {
            return res.status(400).json({ error: 'Username/Email e senha são obrigatórios' });
        }
        
        const usuario = await db.verificarCredenciais(username, senha);
        
        if (!usuario) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const token = generateToken(usuario.id);
        
        res.json({
            token,
            user: {
                id: usuario.id,
                username: usuario.username,
                email: usuario.email,
                is_admin: usuario.is_admin || false
            }
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Registrar novo usuário
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, senha } = req.body;
        
        if (!username || !email || !senha) {
            return res.status(400).json({ error: 'Username, email e senha são obrigatórios' });
        }

        const usuario = await db.criarUsuario(username, email, senha);
        
        // Enviar email de validação
        try {
            await enviarEmailValidacao(usuario.email, usuario.tokenValidacao, usuario.username);
        } catch (emailError) {
            console.error('Erro ao enviar email de validação:', emailError);
            // Não falhar o registro se o email não for enviado
        }
        
        const token = generateToken(usuario.id);
        
        res.json({
            token,
            user: {
                id: usuario.id,
                username: usuario.username,
                email: usuario.email,
                is_admin: false
            }
        });
    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ error: error.message || 'Erro interno do servidor' });
    }
});

// Verificar token (para verificar se o usuário está autenticado)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        // Verificar se email está validado
        const emailValidado = await db.verificarEmailValidado(req.user.id);
        
        // Retornar o status real do email_validado
        // Não verificar token pendente aqui, pois o email_validado é a fonte da verdade
        
        res.json({
            user: {
                id: req.user.id,
                username: req.user.username,
                email: req.user.email,
                is_admin: req.user.is_admin || false,
                email_validado: emailValidado
            }
        });
    } catch (error) {
        console.error('Erro ao verificar token:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Registrar atividade (heartbeat) - para rastreamento de tempo de uso
app.post('/api/auth/activity', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        await db.registrarAtividade(userId);
        res.json({ message: 'Atividade registrada' });
    } catch (error) {
        console.error('Erro ao registrar atividade:', error);
        res.status(500).json({ error: 'Erro ao registrar atividade' });
    }
});

// Obter estatísticas do próprio usuário
app.get('/api/auth/stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const stats = await db.obterEstatisticasUsuario(userId);
        if (!stats) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        res.json(stats);
    } catch (error) {
        console.error('Erro ao obter estatísticas:', error);
        res.status(500).json({ error: 'Erro ao obter estatísticas' });
    }
});

// Obter estatísticas de todos os usuários (apenas admin)
app.get('/api/admin/user-stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const stats = await db.obterEstatisticasTodosUsuarios();
        res.json(stats);
    } catch (error) {
        console.error('Erro ao obter estatísticas de usuários:', error);
        res.status(500).json({ error: 'Erro ao obter estatísticas de usuários' });
    }
});

// Obter estatísticas de um usuário específico (apenas admin)
app.get('/api/admin/user-stats/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const usuarioId = parseInt(req.params.id);
        if (isNaN(usuarioId)) {
            return res.status(400).json({ error: 'ID de usuário inválido' });
        }
        const stats = await db.obterEstatisticasUsuario(usuarioId);
        if (!stats) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        res.json(stats);
    } catch (error) {
        console.error('Erro ao obter estatísticas do usuário:', error);
        res.status(500).json({ error: 'Erro ao obter estatísticas do usuário' });
    }
});

// Obter estatísticas gerais do sistema (apenas admin)
app.get('/api/admin/stats-gerais', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const stats = await db.obterEstatisticasGerais();
        res.json(stats);
    } catch (error) {
        console.error('Erro ao obter estatísticas gerais:', error);
        res.status(500).json({ error: 'Erro ao obter estatísticas gerais' });
    }
});

// Logout - finalizar sessão
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        await db.finalizarSessao(userId);
        res.json({ message: 'Sessão finalizada' });
    } catch (error) {
        console.error('Erro ao finalizar sessão:', error);
        // Não retornar erro para não impedir o logout
        res.json({ message: 'Sessão finalizada' });
    }
});

// Validar email via token
app.get('/api/auth/validar-email/:token', async (req, res) => {
    try {
        const { token } = req.params;
        console.log('Recebida requisição de validação de email com token:', token ? `${token.substring(0, 10)}...` : 'null');
        
        if (!token || token.trim() === '') {
            return res.status(400).json({ error: 'Token não fornecido' });
        }
        
        const resultado = await db.validarTokenEmail(token);
        
        if (!resultado.valido) {
            console.log('Token inválido:', resultado.erro);
            
            // IMPORTANTE: Garantir que o email NÃO seja validado se o token não for válido
            // Retornar erro explicitamente sem validar o email
            // NUNCA validar o email aqui se o token não for válido
            // Nota: Se o token não foi encontrado, pode ser que já foi usado e o email já está validado
            // Mas não vamos verificar aqui para evitar problemas de segurança
            return res.status(400).json({ 
                error: resultado.erro || 'Token inválido ou expirado',
                tokenNaoEncontrado: resultado.tokenNaoEncontrado || false,
                mensagemEspecial: resultado.tokenNaoEncontrado ? 
                    'Este token já foi usado. Se seu email já foi validado, você pode fazer login normalmente.' : 
                    null
            });
        }
        
        // Só chegará aqui se o token for válido e o email foi validado com sucesso
        console.log('Email validado com sucesso para usuário:', resultado.usuarioId);
        res.json({ 
            message: 'Email validado com sucesso!',
            usuarioId: resultado.usuarioId
        });
    } catch (error) {
        console.error('Erro ao validar email:', error);
        // IMPORTANTE: Em caso de erro, NÃO validar o email
        res.status(500).json({ error: 'Erro ao validar email' });
    }
});

// Reenviar email de validação
app.post('/api/auth/reenviar-email-validacao', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const usuario = await db.obterUsuarioPorId(userId);
        
        if (!usuario) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        
        // Verificar se já está validado
        const emailValidado = await db.verificarEmailValidado(userId);
        if (emailValidado) {
            return res.status(400).json({ error: 'Email já foi validado' });
        }
        
        // Criar novo token
        const token = await db.criarTokenValidacaoEmail(userId);
        
        // Enviar email
        await enviarEmailValidacao(usuario.email, token, usuario.username);
        
        res.json({ message: 'Email de validação reenviado com sucesso!' });
    } catch (error) {
        console.error('Erro ao reenviar email de validação:', error);
        res.status(500).json({ error: 'Erro ao reenviar email de validação' });
    }
});

// Alterar login (username)
app.put('/api/auth/alterar-login', authenticateToken, async (req, res) => {
    try {
        const { novoLogin, senha } = req.body;
        
        if (!novoLogin || !senha) {
            return res.status(400).json({ error: 'Novo login e senha são obrigatórios' });
        }

        if (novoLogin.trim().length < 3) {
            return res.status(400).json({ error: 'O login deve ter pelo menos 3 caracteres' });
        }

        // Validar que não tenha espaços ou acentos
        const usernameRegex = /^[a-zA-Z0-9_-]+$/;
        if (!usernameRegex.test(novoLogin.trim())) {
            return res.status(400).json({ error: 'O login não pode conter espaços ou acentos. Use apenas letras, números, underscore (_) ou hífen (-)' });
        }

        const usuario = await db.alterarLogin(req.userId, novoLogin, senha);
        
        // Gerar novo token com o novo username
        const token = generateToken(usuario.id);
        
        res.json({
            token,
            user: {
                id: usuario.id,
                username: usuario.username
            }
        });
    } catch (error) {
        console.error('Erro ao alterar login:', error);
        res.status(500).json({ error: error.message || 'Erro ao alterar login' });
    }
});

// Alterar senha
app.put('/api/auth/alterar-senha', authenticateToken, async (req, res) => {
    try {
        const { senhaAtual, novaSenha } = req.body;
        
        if (!senhaAtual || !novaSenha) {
            return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
        }

        if (novaSenha.length < 6) {
            return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres' });
        }

        await db.alterarSenha(req.userId, senhaAtual, novaSenha);
        
        res.json({ message: 'Senha alterada com sucesso' });
    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        res.status(500).json({ error: error.message || 'Erro ao alterar senha' });
    }
});

// Alterar email
app.put('/api/auth/alterar-email', authenticateToken, async (req, res) => {
    try {
        const { novoEmail, senha } = req.body;
        
        if (!novoEmail || !senha) {
            return res.status(400).json({ error: 'Novo email e senha são obrigatórios' });
        }

        const usuario = await db.alterarEmail(req.userId, novoEmail, senha);
        
        res.json({
            message: 'Email alterado com sucesso',
            user: {
                id: usuario.id,
                email: usuario.email
            }
        });
    } catch (error) {
        console.error('Erro ao alterar email:', error);
        res.status(500).json({ error: error.message || 'Erro ao alterar email' });
    }
});

// Obter dados do usuário
app.get('/api/auth/dados', authenticateToken, async (req, res) => {
    try {
        const usuario = await db.obterUsuarioPorId(req.userId);
        
        if (!usuario) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        
        // Garantir que email_validado está incluído
        res.json({ 
            user: {
                ...usuario,
                email_validado: usuario.email_validado !== undefined ? usuario.email_validado : false
            }
        });
    } catch (error) {
        console.error('Erro ao obter dados do usuário:', error);
        res.status(500).json({ error: error.message || 'Erro ao obter dados do usuário' });
    }
});

// Atualizar dados do usuário
app.put('/api/auth/alterar-dados', authenticateToken, async (req, res) => {
    try {
        const dados = req.body;
        
        const usuario = await db.atualizarDadosUsuario(req.userId, dados);
        
        res.json({
            message: 'Dados atualizados com sucesso',
            user: usuario
        });
    } catch (error) {
        console.error('Erro ao atualizar dados:', error);
        console.error('Stack trace:', error.stack);
        // Se for um erro de validação (contém "obrigatório" ou "obrigatória"), retornar 400
        if (error.message && (error.message.includes('obrigatório') || error.message.includes('obrigatória'))) {
            return res.status(400).json({ error: error.message });
        }
        // Para outros erros, retornar 500
        res.status(500).json({ error: error.message || 'Erro ao atualizar dados' });
    }
});

// Obter cardápio público por username (rota pública, sem autenticação)
app.get('/api/cardapio/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const cardapio = await db.obterCardapioPublico(username);
        
        if (!cardapio) {
            return res.status(404).json({ error: 'Cardápio não encontrado ou não está público' });
        }
        
        res.json(cardapio);
    } catch (error) {
        console.error('Erro ao obter cardápio público:', error);
        res.status(500).json({ error: 'Erro ao obter cardápio público' });
    }
});

// Atualizar visibilidade do cardápio
app.put('/api/auth/cardapio-publico', authenticateToken, async (req, res) => {
    try {
        const { cardapio_publico } = req.body;
        
        if (typeof cardapio_publico !== 'boolean') {
            return res.status(400).json({ error: 'cardapio_publico deve ser um booleano' });
        }
        
        await db.atualizarCardapioPublico(req.userId, cardapio_publico);
        res.json({ message: 'Visibilidade do cardápio atualizada com sucesso', cardapio_publico });
    } catch (error) {
        console.error('Erro ao atualizar visibilidade do cardápio:', error);
        res.status(500).json({ error: 'Erro ao atualizar visibilidade do cardápio' });
    }
});

// Verificar se deve mostrar modal de feedback
app.get('/api/auth/feedback-beta/verificar', authenticateToken, async (req, res) => {
    try {
        const feedbackEnviado = await db.verificarFeedbackEnviado(req.userId);
        const temFuncoesBeta = await db.verificarFuncoesBetaAtivas(req.userId);
        
        res.json({
            deveMostrar: !feedbackEnviado && temFuncoesBeta,
            feedbackEnviado,
            temFuncoesBeta
        });
    } catch (error) {
        console.error('Erro ao verificar feedback beta:', error);
        res.status(500).json({ error: 'Erro ao verificar feedback beta' });
    }
});

// Criar feedback beta
app.post('/api/auth/feedback-beta', authenticateToken, async (req, res) => {
    try {
        const { funcao_id, funcao_titulo, avaliacao, comentario, sugestoes } = req.body;
        
        if (!avaliacao || avaliacao < 1 || avaliacao > 5) {
            return res.status(400).json({ error: 'Avaliação deve ser entre 1 e 5' });
        }
        
        await db.criarFeedbackBeta(req.userId, {
            funcao_id: funcao_id || null,
            funcao_titulo: funcao_titulo || null,
            avaliacao,
            comentario: comentario || null,
            sugestoes: sugestoes || null
        });
        
        res.json({ message: 'Feedback enviado com sucesso!' });
    } catch (error) {
        console.error('Erro ao criar feedback beta:', error);
        res.status(500).json({ error: 'Erro ao enviar feedback' });
    }
});

// ========== MODO ESTÚDIO ==========

// Processar foto com IA
app.post('/api/auth/estudio/processar', authenticateToken, requirePayment, async (req, res) => {
    try {
        const { foto } = req.body;
        
        if (!foto) {
            return res.status(400).json({ error: 'Foto não fornecida' });
        }
        
        // Verificar se é base64 válido
        if (!foto.startsWith('data:image/')) {
            return res.status(400).json({ error: 'Formato de imagem inválido' });
        }
        
        // Verificar tamanho (máximo 10MB em base64)
        const base64Size = (foto.length * 3) / 4;
        if (base64Size > 10 * 1024 * 1024) {
            return res.status(400).json({ error: 'Imagem muito grande. Máximo 10MB.' });
        }
        
        // Verificar acesso à função especial "Modo Estúdio"
        const temAcesso = await db.verificarAcessoFuncaoEspecial(req.userId, 'modo_estudio');
        if (!temAcesso) {
            return res.status(403).json({ error: 'Acesso negado. Você não tem permissão para usar o Modo Estúdio.' });
        }
        
        // Processar foto
        const resultado = await db.processarFotoEstudio(req.userId, foto);
        
        res.json(resultado);
    } catch (error) {
        console.error('Erro ao processar foto estúdio:', error);
        res.status(500).json({ error: 'Erro ao processar foto' });
    }
});

// Obter histórico de fotos processadas
app.get('/api/auth/estudio/historico', authenticateToken, async (req, res) => {
    try {
        const historico = await db.obterHistoricoEstudio(req.userId);
        res.json(historico);
    } catch (error) {
        console.error('Erro ao obter histórico estúdio:', error);
        res.status(500).json({ error: 'Erro ao obter histórico' });
    }
});

// Obter todos os feedbacks beta (apenas admin)
app.get('/api/admin/feedbacks-beta', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const feedbacks = await db.obterTodosFeedbacksBeta();
        res.json(feedbacks);
    } catch (error) {
        console.error('Erro ao obter feedbacks beta:', error);
        res.status(500).json({ error: 'Erro ao obter feedbacks beta' });
    }
});

// Obter permissões de funções especiais
app.get('/api/admin/funcoes-especiais/permissoes', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const permissoes = await db.obterPermissoesFuncoesEspeciais();
        res.json(permissoes);
    } catch (error) {
        console.error('Erro ao obter permissões de funções especiais:', error);
        res.status(500).json({ error: 'Erro ao obter permissões de funções especiais' });
    }
});

// Atualizar permissões de funções especiais
app.put('/api/admin/funcoes-especiais/permissoes', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { permissoes } = req.body;
        if (!Array.isArray(permissoes)) {
            return res.status(400).json({ error: 'Permissões devem ser um array' });
        }
        await db.atualizarPermissoesFuncoesEspeciais(permissoes);
        res.json({ success: true, message: 'Permissões atualizadas com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar permissões de funções especiais:', error);
        res.status(500).json({ error: 'Erro ao atualizar permissões de funções especiais' });
    }
});

// Verificar acesso a função especial
app.get('/api/auth/funcao-especial/:funcao/acesso', authenticateToken, async (req, res) => {
    try {
        const { funcao } = req.params;
        const temAcesso = await db.verificarAcessoFuncaoEspecial(req.userId, funcao);
        res.json({ temAcesso });
    } catch (error) {
        console.error('Erro ao verificar acesso a função especial:', error);
        res.status(500).json({ error: 'Erro ao verificar acesso a função especial' });
    }
});

// Atualizar modo compartilhar cardápio
app.put('/api/auth/cardapio-compartilhar', authenticateToken, async (req, res) => {
    try {
        const { cardapio_compartilhar } = req.body;
        
        if (typeof cardapio_compartilhar !== 'boolean') {
            return res.status(400).json({ error: 'cardapio_compartilhar deve ser um booleano' });
        }
        
        await db.atualizarCardapioCompartilhar(req.userId, cardapio_compartilhar);
        res.json({ message: 'Modo compartilhar cardápio atualizado com sucesso', cardapio_compartilhar });
    } catch (error) {
        console.error('Erro ao atualizar modo compartilhar cardápio:', error);
        res.status(500).json({ error: 'Erro ao atualizar modo compartilhar cardápio' });
    }
});

// Upload de foto de perfil
app.post('/api/auth/upload-foto', authenticateToken, async (req, res) => {
    try {
        const { fotoBase64 } = req.body;
        
        if (!fotoBase64) {
            return res.status(400).json({ error: 'Foto é obrigatória' });
        }
        
        // Salvar como base64 no banco (ou você pode salvar em arquivo e guardar o caminho)
        const usuario = await db.atualizarDadosUsuario(req.userId, { foto_perfil: fotoBase64 });
        
        res.json({
            message: 'Foto atualizada com sucesso',
            foto_perfil: usuario.foto_perfil
        });
    } catch (error) {
        console.error('Erro ao fazer upload da foto:', error);
        res.status(500).json({ error: error.message || 'Erro ao fazer upload da foto' });
    }
});

// Reiniciar sistema (deletar todos os dados do usuário)
app.post('/api/auth/reiniciar-sistema', authenticateToken, async (req, res) => {
    try {
        await db.reiniciarSistema(req.userId);
        
        res.json({ message: 'Sistema reiniciado com sucesso. Todos os dados foram apagados.' });
    } catch (error) {
        console.error('Erro ao reiniciar sistema:', error);
        res.status(500).json({ error: error.message || 'Erro ao reiniciar sistema' });
    }
});

// Solicitar recuperação de senha
app.post('/api/auth/recuperar-senha', async (req, res) => {
    try {
        const { email, username } = req.body;
        
        // Validar que pelo menos um campo foi fornecido
        if ((!email || !email.trim()) && (!username || !username.trim())) {
            return res.status(400).json({ error: 'Email ou nome de usuário é obrigatório' });
        }

        let usuario = null;
        let usuarios = [];

        // Se ambos email e username foram fornecidos, validar que o username pertence ao email
        if (email && email.trim() && username && username.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.trim())) {
                return res.status(400).json({ error: 'Email inválido' });
            }

            // Buscar usuário por username
            usuario = await db.obterUsuarioPorUsername(username.trim());
            
            if (!usuario) {
                // Por segurança, não revelar se o username existe ou não
                return res.json({ 
                    message: 'Se o email/nome de usuário estiver cadastrado, você receberá um link de recuperação.' 
                });
            }

            // Validar que o email do usuário corresponde ao email fornecido
            if (usuario.email.toLowerCase() !== email.trim().toLowerCase()) {
                return res.status(400).json({ 
                    error: 'O nome de usuário informado não está associado a este email.' 
                });
            }
        }
        // Se apenas username foi fornecido, buscar por username (único)
        else if (username && username.trim()) {
            usuario = await db.obterUsuarioPorUsername(username.trim());
            
            if (!usuario) {
                // Por segurança, não revelar se o username existe ou não
                return res.json({ 
                    message: 'Se o email/nome de usuário estiver cadastrado, você receberá um link de recuperação.' 
                });
            }
        } 
        // Se apenas email foi fornecido
        else if (email && email.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.trim())) {
                return res.status(400).json({ error: 'Email inválido' });
            }

            // Buscar usuários com este email
            usuarios = await db.obterUsuariosPorEmail(email.trim().toLowerCase());
            
            if (usuarios.length === 0) {
                // Por segurança, não revelar se o email existe ou não
                return res.json({ 
                    message: 'Se o email/nome de usuário estiver cadastrado, você receberá um link de recuperação.' 
                });
            }

            // Se houver múltiplos usuários com o mesmo email, pedir o username
            if (usuarios.length > 1) {
                return res.status(400).json({ 
                    error: 'MULTIPLE_USERS',
                    message: 'Este email está associado a múltiplas contas. Por favor, informe também o nome de usuário.'
                });
            }

            // Se houver apenas 1 usuário, usar ele
            usuario = usuarios[0];
        }

        // Se chegou aqui, temos um usuário específico
        if (!usuario) {
            return res.status(400).json({ error: 'Usuário não encontrado' });
        }

        // Criar token de recuperação para o usuário específico
        try {
            const tokenData = await db.criarTokenRecuperacao(usuario.id);
            await enviarEmailRecuperacao(
                usuario.email,
                tokenData.token,
                usuario.username
            );
            console.log(`✅ Email de recuperação enviado para: ${usuario.username} (${usuario.email})`);
        } catch (error) {
            console.error(`❌ Erro ao enviar email para ${usuario.username}:`, error.message);
            throw error;
        }

        // Por segurança, sempre retornar a mesma mensagem
        return res.json({ 
            message: 'Se o email/nome de usuário estiver cadastrado, você receberá um link de recuperação.' 
        });
    } catch (error) {
        console.error('Erro ao solicitar recuperação de senha:', error);
        res.status(500).json({ error: 'Erro ao processar solicitação de recuperação de senha' });
    }
});

// Validar token de recuperação
app.get('/api/auth/validar-token/:token', async (req, res) => {
    try {
        const { token } = req.params;
        
        if (!token) {
            return res.status(400).json({ error: 'Token é obrigatório' });
        }

        const tokenValido = await db.validarTokenRecuperacao(token);
        
        if (!tokenValido) {
            return res.status(400).json({ error: 'Token inválido ou expirado' });
        }

        res.json({ 
            valid: true,
            username: tokenValido.username 
        });
    } catch (error) {
        console.error('Erro ao validar token:', error);
        res.status(500).json({ error: 'Erro ao validar token' });
    }
});

// Resetar senha com token
app.post('/api/auth/resetar-senha', async (req, res) => {
    try {
        const { token, novaSenha } = req.body;
        
        if (!token || !novaSenha) {
            return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
        }

        if (novaSenha.length < 6) {
            return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
        }

        const usuario = await db.resetarSenhaComToken(token, novaSenha);
        
        res.json({ 
            message: 'Senha redefinida com sucesso!',
            user: {
                id: usuario.id,
                username: usuario.username
            }
        });
    } catch (error) {
        console.error('Erro ao resetar senha:', error);
        res.status(500).json({ error: error.message || 'Erro ao resetar senha' });
    }
});

// ========== ROTAS DO STRIPE ==========

// Criar sessão de checkout para plano anual
app.post('/api/stripe/checkout/anual', authenticateToken, async (req, res) => {
    try {
        const usuario = req.user;
        const { priceId } = req.body; // Receber priceId do plano
        const baseUrl = process.env.FRONTEND_URL || `http://localhost:${PORT}`;
        
        // Buscar plano_id a partir do stripe_price_id
        const planoId = await db.obterPlanoPorStripePriceId(priceId);
        
        const session = await stripeService.criarCheckoutAnual(
            usuario.email,
            usuario.id,
            `${baseUrl}/pagamento/sucesso?session_id={CHECKOUT_SESSION_ID}`,
            `${baseUrl}/pagamento/cancelado`,
            priceId, // Passar priceId dinâmico
            planoId // Passar plano_id
        );

        res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
        console.error('Erro ao criar checkout anual:', error);
        res.status(500).json({ error: error.message || 'Erro ao criar sessão de checkout' });
    }
});

// Criar sessão de checkout para pagamento único
app.post('/api/stripe/checkout/unico', authenticateToken, async (req, res) => {
    try {
        const usuario = req.user;
        const { priceId } = req.body; // Receber priceId do plano
        const baseUrl = process.env.FRONTEND_URL || `http://localhost:${PORT}`;
        
        // Buscar plano_id a partir do stripe_price_id
        const planoId = await db.obterPlanoPorStripePriceId(priceId);
        
        const session = await stripeService.criarCheckoutUnico(
            usuario.email,
            usuario.id,
            `${baseUrl}/pagamento/sucesso?session_id={CHECKOUT_SESSION_ID}`,
            `${baseUrl}/pagamento/cancelado`,
            priceId, // Passar priceId dinâmico
            planoId // Passar plano_id
        );

        res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
        console.error('Erro ao criar checkout único:', error);
        res.status(500).json({ error: error.message || 'Erro ao criar sessão de checkout' });
    }
});

// Validar cupom de desconto
app.post('/api/stripe/validar-cupom', authenticateToken, async (req, res) => {
    try {
        const { codigo, priceId } = req.body;
        
        if (!codigo || !priceId) {
            return res.status(400).json({ error: 'Código e priceId são obrigatórios' });
        }

        // Verificar se o Stripe está configurado
        if (!stripeService.stripe) {
            return res.status(500).json({ error: 'Stripe não está configurado' });
        }

        // Buscar promotion code no Stripe
        const promotionCodes = await stripeService.stripe.promotionCodes.list({
            code: codigo.toUpperCase().trim(),
            active: true,
            limit: 1,
        });

        if (promotionCodes.data.length === 0) {
            return res.status(404).json({ 
                error: 'Código promocional inválido',
                valido: false 
            });
        }

        const promotionCode = promotionCodes.data[0];
        const coupon = promotionCode.coupon;

        // Verificar se o cupom ainda é válido
        if (!coupon.valid) {
            return res.status(400).json({ 
                error: 'Código promocional expirado ou inválido',
                valido: false 
            });
        }

        // Buscar preço para calcular desconto
        const price = await stripeService.stripe.prices.retrieve(priceId);
        const valorOriginal = price.unit_amount; // em centavos
        
        let valorComDesconto = valorOriginal;
        let descontoAplicado = 0;

        if (coupon.percent_off) {
            // Desconto percentual
            descontoAplicado = Math.round(valorOriginal * (coupon.percent_off / 100));
            valorComDesconto = valorOriginal - descontoAplicado;
        } else if (coupon.amount_off) {
            // Desconto em valor fixo
            descontoAplicado = coupon.amount_off;
            valorComDesconto = Math.max(0, valorOriginal - descontoAplicado);
        }

        res.json({
            valido: true,
            codigo: promotionCode.code,
            couponId: coupon.id,
            promotionCodeId: promotionCode.id,
            tipo: coupon.percent_off ? 'percentual' : 'fixo',
            desconto: coupon.percent_off || coupon.amount_off,
            valorOriginal: valorOriginal,
            valorComDesconto: valorComDesconto,
            descontoAplicado: descontoAplicado,
        });
    } catch (error) {
        console.error('Erro ao validar cupom:', error);
        res.status(500).json({ error: 'Erro ao validar código promocional' });
    }
});

// Criar Payment Intent para checkout transparente
app.post('/api/stripe/create-payment-intent', authenticateToken, async (req, res) => {
    try {
        const { amount, userId, planoId, couponId } = req.body;
        
        if (!amount || !userId) {
            return res.status(400).json({ error: 'Amount e userId são obrigatórios' });
        }

        // Buscar plano para obter price_id
        const plano = await db.obterPlanoPorId(planoId);
        if (!plano || !plano.stripe_price_id) {
            return res.status(400).json({ error: 'Plano não encontrado ou sem price_id configurado' });
        }

        // Verificar se o Stripe está configurado
        if (!stripeService.stripe) {
            return res.status(500).json({ error: 'Stripe não está configurado' });
        }

        // Criar Payment Intent no Stripe
        const paymentIntentData = {
            amount: amount, // Já vem com desconto aplicado do frontend
            currency: 'brl',
            metadata: {
                user_id: userId.toString(),
                plano_id: planoId ? planoId.toString() : '',
                plano_tipo: 'unico', // ou 'anual' dependendo do plano
            },
        };

        // Se houver couponId, adicionar aos metadados para rastreamento
        if (couponId) {
            paymentIntentData.metadata.coupon_id = couponId;
        }

        const paymentIntent = await stripeService.stripe.paymentIntents.create(paymentIntentData);

        res.json({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        console.error('Erro ao criar payment intent:', error);
        res.status(500).json({ error: error.message || 'Erro ao criar intenção de pagamento' });
    }
});

// Confirmar e salvar pagamento único (para checkout transparente)
app.post('/api/stripe/confirmar-pagamento', authenticateToken, async (req, res) => {
    try {
        const { paymentIntentId, dadosCheckout } = req.body;
        const userId = req.userId;
        
        if (!paymentIntentId) {
            return res.status(400).json({ error: 'Payment Intent ID é obrigatório' });
        }

        if (!stripeService.stripe) {
            return res.status(500).json({ error: 'Stripe não está configurado' });
        }

        // Buscar Payment Intent no Stripe para verificar status e obter dados
        const paymentIntent = await stripeService.stripe.paymentIntents.retrieve(paymentIntentId);
        
        // Verificar se o pagamento foi bem-sucedido
        if (paymentIntent.status !== 'succeeded') {
            return res.status(400).json({ error: `Pagamento não foi bem-sucedido. Status: ${paymentIntent.status}` });
        }

        // Verificar se o userId do metadata corresponde ao usuário autenticado
        const metadataUserId = paymentIntent.metadata?.user_id ? parseInt(paymentIntent.metadata.user_id) : null;
        if (metadataUserId !== userId) {
            return res.status(403).json({ error: 'Este pagamento não pertence ao usuário autenticado' });
        }

        // Verificar se o pagamento já foi salvo
        const pagamentoExistente = await db.obterPagamentoUnicoPorStripeId(paymentIntentId);
        if (pagamentoExistente) {
            return res.json({ 
                message: 'Pagamento já foi processado',
                pagamento: pagamentoExistente
            });
        }

        // Obter dados do pagamento
        const valor = paymentIntent.amount / 100; // Converter de centavos para reais
        const planoId = paymentIntent.metadata?.plano_id ? parseInt(paymentIntent.metadata.plano_id) : null;
        const customerId = paymentIntent.customer || null;

        // Salvar pagamento no banco de dados
        const pagamento = await db.criarPagamentoUnico(userId, {
            stripe_payment_intent_id: paymentIntentId,
            stripe_customer_id: customerId,
            valor: valor,
            status: 'succeeded',
            plano_id: planoId,
        });

        console.log('✅ Pagamento único salvo diretamente no banco de dados para usuário:', userId, 'PlanoId:', planoId);

        // Se houver dados do checkout, atualizar cadastro do usuário
        if (dadosCheckout) {
            try {
                const dadosParaAtualizar = {};
                
                // Função para validar CPF
                const validarCPF = (cpf) => {
                    if (!cpf) return false;
                    const cpfLimpo = cpf.replace(/\D/g, '');
                    if (cpfLimpo.length !== 11) return false;
                    if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;
                    
                    let soma = 0;
                    for (let i = 0; i < 9; i++) {
                        soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
                    }
                    let resto = (soma * 10) % 11;
                    if (resto === 10 || resto === 11) resto = 0;
                    if (resto !== parseInt(cpfLimpo.charAt(9))) return false;
                    
                    soma = 0;
                    for (let i = 0; i < 10; i++) {
                        soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
                    }
                    resto = (soma * 10) % 11;
                    if (resto === 10 || resto === 11) resto = 0;
                    if (resto !== parseInt(cpfLimpo.charAt(10))) return false;
                    
                    return true;
                };
                
                // CPF - validar antes de salvar (apenas se fornecido)
                if (dadosCheckout.cpf) {
                    if (!validarCPF(dadosCheckout.cpf)) {
                        throw new Error('CPF inválido. Verifique os dígitos.');
                    }
                    dadosParaAtualizar.cpf = dadosCheckout.cpf.replace(/\D/g, ''); // Remover formatação
                }
                // Se não há CPF, não atualizar (usuário estrangeiro)
                
                // Nome completo - separar em nome e sobrenome
                if (dadosCheckout.nomeCompleto) {
                    const nomeCompleto = dadosCheckout.nomeCompleto.trim();
                    const partesNome = nomeCompleto.split(' ');
                    if (partesNome.length > 0) {
                        dadosParaAtualizar.nome = partesNome[0];
                        if (partesNome.length > 1) {
                            dadosParaAtualizar.sobrenome = partesNome.slice(1).join(' ');
                        }
                    }
                }
                
                // Endereço residencial
                if (dadosCheckout.pais && dadosCheckout.pais !== 'Brasil') {
                    // Estrangeiro - apenas país
                    dadosParaAtualizar.pais_residencial = dadosCheckout.pais;
                    // Limpar campos de endereço brasileiro
                    dadosParaAtualizar.cep_residencial = null;
                    dadosParaAtualizar.endereco_residencial = null;
                    dadosParaAtualizar.numero_residencial = null;
                    dadosParaAtualizar.complemento_residencial = null;
                    dadosParaAtualizar.cidade_residencial = null;
                    dadosParaAtualizar.estado_residencial = null;
                } else {
                    // Brasileiro - endereço completo
                    if (dadosCheckout.cep) {
                        dadosParaAtualizar.cep_residencial = dadosCheckout.cep.replace(/\D/g, '');
                    }
                    if (dadosCheckout.logradouro) {
                        dadosParaAtualizar.endereco_residencial = dadosCheckout.logradouro;
                    }
                    if (dadosCheckout.numero) {
                        dadosParaAtualizar.numero_residencial = dadosCheckout.numero;
                    }
                    if (dadosCheckout.complemento) {
                        dadosParaAtualizar.complemento_residencial = dadosCheckout.complemento;
                    }
                    if (dadosCheckout.cidade) {
                        dadosParaAtualizar.cidade_residencial = dadosCheckout.cidade;
                    }
                    if (dadosCheckout.uf) {
                        dadosParaAtualizar.estado_residencial = dadosCheckout.uf.toUpperCase();
                    }
                    dadosParaAtualizar.pais_residencial = dadosCheckout.pais || 'Brasil';
                }
                
                // Atualizar dados do usuário apenas se houver algo para atualizar
                if (Object.keys(dadosParaAtualizar).length > 0) {
                    await db.atualizarDadosUsuario(userId, dadosParaAtualizar);
                    console.log('✅ Dados do checkout salvos no cadastro do usuário:', userId);
                }
            } catch (dadosError) {
                // Não falhar o pagamento se houver erro ao salvar dados
                console.error('⚠️  Erro ao salvar dados do checkout (pagamento já foi processado):', dadosError);
            }
        }

        res.json({
            message: 'Pagamento confirmado e salvo com sucesso',
            pagamento: pagamento
        });
    } catch (error) {
        console.error('Erro ao confirmar pagamento:', error);
        res.status(500).json({ error: error.message || 'Erro ao confirmar pagamento' });
    }
});

// Verificar status de pagamento do usuário
app.get('/api/stripe/status', authenticateToken, async (req, res) => {
    try {
        const acesso = await db.verificarAcessoAtivo(req.userId);
        const assinatura = await db.obterAssinatura(req.userId);

        res.json({
            temAcesso: acesso.temAcesso,
            tipo: acesso.tipo === 'vitalicio' ? 'vitalicio' : acesso.tipo, // Manter 'vitalicio' para permitir feedback beta
            emailNaoValidado: acesso.emailNaoValidado || false,
            assinatura: acesso.tipo === 'vitalicio' ? {
                status: 'active',
                plano_tipo: 'vitalicio',
                current_period_end: null, // Vitalício não expira
                cancel_at_period_end: false,
            } : (assinatura ? {
                status: assinatura.status,
                plano_tipo: assinatura.plano_tipo,
                current_period_end: assinatura.current_period_end,
                cancel_at_period_end: assinatura.cancel_at_period_end,
            } : null),
        });
    } catch (error) {
        console.error('Erro ao verificar status:', error);
        res.status(500).json({ error: 'Erro ao verificar status de pagamento' });
    }
});

// Cancelar assinatura
app.post('/api/stripe/cancelar-assinatura', authenticateToken, async (req, res) => {
    try {
        const assinatura = await db.obterAssinatura(req.userId);

        if (!assinatura || !assinatura.stripe_subscription_id) {
            return res.status(404).json({ error: 'Assinatura não encontrada' });
        }

        const { cancelarImediatamente } = req.body;
        await stripeService.cancelarAssinatura(assinatura.stripe_subscription_id, cancelarImediatamente);

        res.json({ message: 'Assinatura cancelada com sucesso' });
    } catch (error) {
        console.error('Erro ao cancelar assinatura:', error);
        res.status(500).json({ error: error.message || 'Erro ao cancelar assinatura' });
    }
});

// Criar sessão do Customer Portal do Stripe
app.post('/api/stripe/customer-portal', authenticateToken, async (req, res) => {
    try {
        const assinatura = await db.obterAssinatura(req.userId);

        if (!assinatura || !assinatura.stripe_customer_id) {
            return res.status(404).json({ error: 'Assinatura não encontrada ou cliente não identificado' });
        }

        if (!stripeService.stripe) {
            return res.status(500).json({ error: 'Stripe não está configurado' });
        }

        const baseUrl = process.env.FRONTEND_URL || `http://localhost:${PORT}`;
        const returnUrl = `${baseUrl}/`;

        const session = await stripeService.criarSessaoCustomerPortal(
            assinatura.stripe_customer_id,
            returnUrl
        );

        res.json({ url: session.url });
    } catch (error) {
        console.error('Erro ao criar sessão do Customer Portal:', error);
        res.status(500).json({ error: error.message || 'Erro ao criar sessão do Customer Portal' });
    }
});

// ========== ROTAS DE ADMINISTRAÇÃO ==========

// Obter ordem dos botões de gerenciamento
app.get('/api/admin/ordem-gerenciamentos', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const ordem = await db.obterOrdemGerenciamentos();
        res.json({ ordem });
    } catch (error) {
        console.error('Erro ao obter ordem dos gerenciamentos:', error);
        res.status(500).json({ error: 'Erro ao obter ordem dos gerenciamentos' });
    }
});

// Atualizar ordem dos botões de gerenciamento
app.put('/api/admin/ordem-gerenciamentos', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { ordem } = req.body;
        
        if (!Array.isArray(ordem)) {
            return res.status(400).json({ error: 'Ordem deve ser um array' });
        }
        
        await db.atualizarOrdemGerenciamentos(ordem);
        res.json({ success: true, ordem });
    } catch (error) {
        console.error('Erro ao atualizar ordem dos gerenciamentos:', error);
        res.status(500).json({ error: 'Erro ao atualizar ordem dos gerenciamentos' });
    }
});

// Listar todos os usuários (apenas admin)
// Obter ordem dos botões de gerenciamento
app.get('/api/admin/ordem-gerenciamentos', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const ordem = await db.obterOrdemGerenciamentos();
        res.json({ ordem });
    } catch (error) {
        console.error('Erro ao obter ordem dos gerenciamentos:', error);
        res.status(500).json({ error: 'Erro ao obter ordem dos gerenciamentos' });
    }
});

// Atualizar ordem dos botões de gerenciamento
app.put('/api/admin/ordem-gerenciamentos', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { ordem } = req.body;
        
        if (!Array.isArray(ordem)) {
            return res.status(400).json({ error: 'Ordem deve ser um array' });
        }
        
        await db.atualizarOrdemGerenciamentos(ordem);
        res.json({ success: true, ordem });
    } catch (error) {
        console.error('Erro ao atualizar ordem dos gerenciamentos:', error);
        res.status(500).json({ error: 'Erro ao atualizar ordem dos gerenciamentos' });
    }
});

app.get('/api/admin/usuarios', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const usuarios = await db.listarUsuarios();
        res.json(usuarios);
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.status(500).json({ error: error.message || 'Erro ao listar usuários' });
    }
});

// Obter dados de um usuário específico (apenas admin)
app.get('/api/admin/usuarios/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = await db.obterUsuarioPorId(parseInt(id));
        
        if (!usuario) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Obter dados do usuário
        const itensPorCategoria = await db.obterTodosItens(parseInt(id));
        const categorias = await db.obterCategorias(parseInt(id));
        
        // obterTodosItens já retorna um objeto organizado por categoria
        // Garantir que todas as categorias estejam no objeto de itens
        const itensCompletos = {};
        if (Array.isArray(categorias)) {
            categorias.forEach(cat => {
                itensCompletos[cat] = itensPorCategoria[cat] || [];
            });
        } else {
            // Se não houver categorias, usar as chaves do objeto de itens
            Object.keys(itensPorCategoria || {}).forEach(cat => {
                itensCompletos[cat] = itensPorCategoria[cat] || [];
            });
        }
        
        res.json({
            usuario,
            itens: itensCompletos,
            categorias: Array.isArray(categorias) ? categorias : Object.keys(itensCompletos)
        });
    } catch (error) {
        console.error('Erro ao obter dados do usuário:', error);
        res.status(500).json({ error: error.message || 'Erro ao obter dados do usuário' });
    }
});

// Atualizar usuário (apenas admin)
app.put('/api/admin/usuarios/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, senha, is_admin, acesso_especial, acesso_temporario_duracao, acesso_temporario_nivel } = req.body;
        
        const usuario = await db.atualizarUsuario(parseInt(id), username, email, senha, is_admin);
        
        // Atualizar acesso especial se fornecido
        if (acesso_especial !== undefined) {
            await db.atualizarAcessoEspecial(parseInt(id), acesso_especial, acesso_temporario_duracao, acesso_temporario_nivel);
        }
        
        res.json(usuario);
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({ error: error.message || 'Erro ao atualizar usuário' });
    }
});

// Deletar usuário (apenas admin)
app.delete('/api/admin/usuarios/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        if (parseInt(id) === req.userId) {
            return res.status(400).json({ error: 'Você não pode deletar sua própria conta' });
        }
        
        const usuario = await db.deletarUsuario(parseInt(id));
        res.json({ message: `Usuário "${usuario.username}" deletado com sucesso`, usuario });
    } catch (error) {
        console.error('Erro ao deletar usuário:', error);
        res.status(500).json({ error: error.message || 'Erro ao deletar usuário' });
    }
});

// Editar item de outro usuário (apenas admin)
app.put('/api/admin/usuarios/:usuarioId/itens/:itemId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { usuarioId, itemId } = req.params;
        const { nome, valor, categoria } = req.body;
        
        await db.atualizarItem(parseInt(itemId), nome, valor, categoria, parseInt(usuarioId));
        res.json({ message: 'Item atualizado com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar item:', error);
        res.status(500).json({ error: error.message || 'Erro ao atualizar item' });
    }
});

// Criar item para outro usuário (apenas admin)
app.post('/api/admin/usuarios/:usuarioId/itens', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const { categoria, nome, valor } = req.body;
        
        const item = await db.criarItem(categoria, nome, valor, parseInt(usuarioId));
        res.json(item);
    } catch (error) {
        console.error('Erro ao criar item:', error);
        res.status(500).json({ error: error.message || 'Erro ao criar item' });
    }
});

// Deletar item de outro usuário (apenas admin)
app.delete('/api/admin/usuarios/:usuarioId/itens/:itemId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { usuarioId, itemId } = req.params;
        
        await db.deletarItem(parseInt(itemId), parseInt(usuarioId));
        res.json({ message: 'Item deletado com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar item:', error);
        res.status(500).json({ error: error.message || 'Erro ao deletar item' });
    }
});

// Criar categoria para outro usuário (apenas admin)
app.post('/api/admin/usuarios/:usuarioId/categorias', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const { nome, icone } = req.body;
        
        const categoria = await db.criarCategoria(nome, icone || null, parseInt(usuarioId));
        res.json(categoria);
    } catch (error) {
        console.error('Erro ao criar categoria:', error);
        res.status(500).json({ error: error.message || 'Erro ao criar categoria' });
    }
});

// Atualizar categoria de outro usuário (apenas admin)
app.put('/api/admin/usuarios/:usuarioId/categorias/:nome', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { usuarioId, nome } = req.params;
        const { novoNome, icone } = req.body;
        const categoriaNome = decodeURIComponent(nome);
        
        if (novoNome && novoNome !== categoriaNome) {
            await db.renomearCategoria(categoriaNome, novoNome, parseInt(usuarioId));
        }
        
        if (icone !== undefined) {
            await db.atualizarIconeCategoria(novoNome || categoriaNome, icone, parseInt(usuarioId));
        }
        
        res.json({ message: 'Categoria atualizada com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar categoria:', error);
        res.status(500).json({ error: error.message || 'Erro ao atualizar categoria' });
    }
});

// Deletar categoria de outro usuário (apenas admin)
app.delete('/api/admin/usuarios/:usuarioId/categorias/:nome', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { usuarioId, nome } = req.params;
        const categoriaNome = decodeURIComponent(nome);
        
        await db.deletarCategoria(categoriaNome, parseInt(usuarioId));
        res.json({ message: 'Categoria deletada com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar categoria:', error);
        res.status(500).json({ error: error.message || 'Erro ao deletar categoria' });
    }
});

// ========== ROTAS PROTEGIDAS (COM MIDDLEWARE) ==========

// Obter todos os itens
app.get('/api/itens', authenticateToken, requirePayment, async (req, res) => {
    try {
        const itens = await db.obterTodosItens(req.userId);
        res.json(itens);
    } catch (error) {
        console.error('Erro ao obter itens:', error);
        res.status(500).json({ error: 'Erro ao obter itens' });
    }
});

// Obter itens por categoria
app.get('/api/itens/categoria/:categoria', authenticateToken, requirePayment, async (req, res) => {
    try {
        const { categoria } = req.params;
        const itens = await db.obterItensPorCategoria(categoria, req.userId);
        res.json(itens);
    } catch (error) {
        console.error('Erro ao obter itens por categoria:', error);
        res.status(500).json({ error: 'Erro ao obter itens por categoria' });
    }
});

// Criar novo item
app.post('/api/itens', authenticateToken, requirePayment, async (req, res) => {
    try {
        const { categoria, nome, valor } = req.body;
        
        console.log('[API] Criar item - Dados recebidos:', { categoria, nome, valor, userId: req.userId });
        
        if (!categoria || !nome || valor === undefined) {
            console.log('[API] Erro de validação - campos faltando:', { categoria, nome, valor });
            return res.status(400).json({ error: 'Categoria, nome e valor são obrigatórios' });
        }
        
        // Validar tipos
        if (typeof categoria !== 'string' || typeof nome !== 'string') {
            console.log('[API] Erro de validação - tipos inválidos:', { categoria: typeof categoria, nome: typeof nome });
            return res.status(400).json({ error: 'Categoria e nome devem ser strings' });
        }
        
        const valorNumerico = parseFloat(valor);
        if (isNaN(valorNumerico) || valorNumerico < 0) {
            console.log('[API] Erro de validação - valor inválido:', { valor, valorNumerico });
            return res.status(400).json({ error: 'Valor deve ser um número maior ou igual a zero' });
        }
        
        // Verificar se o usuário realmente tem acesso pago (não apenas trial mode)
        const acesso = await db.verificarAcessoAtivo(req.userId);
        
        // Se for acesso único E o usuário realmente tem acesso pago, bloquear
        // Mas permitir para usuários em trial mode (sem acesso pago)
        // O req.acessoUnico pode estar definido pelo middleware mesmo para trial, então verificamos acesso.temAcesso
        if (req.acessoUnico && acesso.temAcesso && acesso.tipo === 'unico') {
            await db.marcarPagamentoUnicoComoUsado(req.userId);
            // Retornar erro informando que dados não são salvos
            return res.status(403).json({ 
                error: 'Acesso único não permite salvar dados permanentemente. Os dados não serão salvos.',
                codigo: 'ACESSO_UNICO_NAO_SALVA'
            });
        }
        
        // Se o usuário não tem acesso pago (trial mode), permitir criar itens
        // Isso permite que usuários testem o sistema durante o tutorial
        
        // Permitir criação de itens para usuários em trial mode (sem acesso pago)
        // O middleware requirePayment já permite isso para rotas trial
        console.log('[API] Chamando db.criarItem com:', { categoria, nome, valor, userId: req.userId });
        const item = await db.criarItem(categoria, nome, valor, req.userId);
        console.log('[API] Item criado com sucesso:', item);
        res.status(201).json(item);
    } catch (error) {
        console.error('========== ERRO AO CRIAR ITEM ==========');
        console.error('Erro completo:', error);
        console.error('Stack:', error.stack);
        console.error('Detalhes do erro no servidor:', {
            code: error.code,
            message: error.message,
            constraint: error.constraint,
            detail: error.detail,
            table: error.table,
            categoria: categoria || 'não definido',
            nome: nome || 'não definido',
            valor: valor || 'não definido',
            userId: req.userId,
            tipoUserId: typeof req.userId
        });
        console.error('==========================================');
        
        // Se for erro de constraint incorreta
        if (error.code === 'CONSTRAINT_INCORRETA') {
            return res.status(500).json({ 
                error: 'Erro na configuração do banco de dados. A constraint UNIQUE não inclui usuario_id.',
                codigo: 'CONSTRAINT_INCORRETA',
                detail: error.detail
            });
        }
        
        // Se for erro de item duplicado, retornar mensagem específica
        if (error.code === 'ITEM_DUPLICADO' || error.message?.includes('já existe')) {
            return res.status(409).json({ 
                error: error.message || `Já existe um item com o nome "${nome}" na categoria "${categoria}".`,
                codigo: 'ITEM_DUPLICADO'
            });
        }
        
        // Se for erro de constraint UNIQUE do PostgreSQL
        if (error.code === '23505') {
            // Verificar se a constraint é realmente de itens duplicados
            if (error.constraint && error.constraint.includes('itens')) {
                // Se a constraint antiga (sem usuario_id), informar problema
                if (error.constraint === 'itens_categoria_nome_key') {
                    return res.status(500).json({ 
                        error: 'Erro na configuração do banco de dados. A constraint UNIQUE não inclui usuario_id.',
                        codigo: 'CONSTRAINT_INCORRETA',
                        detail: 'Por favor, contate o administrador para corrigir a constraint do banco de dados.'
                    });
                }
                
                return res.status(409).json({ 
                    error: `Já existe um item com o nome "${nome}" na categoria "${categoria}".`,
                    codigo: 'ITEM_DUPLICADO',
                    detail: error.detail
                });
            }
        }
        
        res.status(500).json({ 
            error: error.message || 'Erro ao criar item',
            codigo: error.code || 'ERRO_DESCONHECIDO',
            detail: error.detail || error.stack
        });
    }
});

// Atualizar item
app.put('/api/itens/:id', authenticateToken, requirePayment, async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, valor, valorNovo, categoria } = req.body;
        
        console.log(`[SERVER] PUT /api/itens/${id}`, { nome, valor, valorNovo, categoria });
        
        // Se for acesso único e tentar atualizar (não apenas valorNovo), não permitir
        if (req.acessoUnico && (nome !== undefined || valor !== undefined || categoria !== undefined)) {
            await db.marcarPagamentoUnicoComoUsado(req.userId);
            return res.status(403).json({ 
                error: 'Acesso único não permite salvar alterações permanentemente. Os dados não serão salvos.',
                codigo: 'ACESSO_UNICO_NAO_SALVA'
            });
        }
        
        // Se valorNovo foi enviado, atualizar apenas ele
        if (valorNovo !== undefined && nome === undefined && valor === undefined && categoria === undefined) {
            const sucesso = await db.atualizarValorNovo(id, valorNovo, req.userId);
            if (!sucesso) {
                return res.status(404).json({ error: 'Item não encontrado' });
            }
            const item = await db.obterItemPorId(id, req.userId);
            return res.json(item);
        }
        
        // Caso contrário, atualizar nome, valor e/ou categoria
        console.log(`[SERVER] Chamando db.atualizarItem(${id}, "${nome}", ${valor}, "${categoria}")`);
        const item = await db.atualizarItem(id, nome, valor, categoria, req.userId);
        if (!item) {
            console.log(`[SERVER] Item não encontrado: ${id}`);
            return res.status(404).json({ error: 'Item não encontrado' });
        }
        
        console.log(`[SERVER] Item atualizado com sucesso:`, item);
        res.json(item);
    } catch (error) {
        console.error('[SERVER] Erro ao atualizar item:', error);
        res.status(500).json({ error: 'Erro ao atualizar item' });
    }
});

// Salvar backup do valor antes de aplicar reajuste fixo
app.post('/api/itens/:id/backup', authenticateToken, requirePayment, async (req, res) => {
    try {
        const { id } = req.params;
        const { valorBackup } = req.body;
        
        if (valorBackup === undefined) {
            return res.status(400).json({ error: 'valorBackup é obrigatório' });
        }
        
        const sucesso = await db.salvarBackupValor(id, valorBackup, req.userId);
        if (!sucesso) {
            return res.status(404).json({ error: 'Item não encontrado' });
        }
        
        res.json({ message: 'Backup salvo com sucesso' });
    } catch (error) {
        console.error('Erro ao salvar backup:', error);
        res.status(500).json({ error: 'Erro ao salvar backup' });
    }
});

// Deletar item
app.delete('/api/itens/:id', authenticateToken, requirePayment, async (req, res) => {
    try {
        const { id } = req.params;
        const sucesso = await db.deletarItem(id, req.userId);
        
        if (!sucesso) {
            return res.status(404).json({ error: 'Item não encontrado' });
        }
        
        res.json({ message: 'Item deletado com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar item:', error);
        res.status(500).json({ error: 'Erro ao deletar item' });
    }
});

// Obter todas as categorias
app.get('/api/categorias', authenticateToken, requirePayment, async (req, res) => {
    try {
        const categorias = await db.obterCategorias(req.userId);
        res.json(categorias);
    } catch (error) {
        console.error('Erro ao obter categorias:', error);
        res.status(500).json({ error: 'Erro ao obter categorias' });
    }
});

// Resetar valores (restaurar a partir do backup)
app.post('/api/resetar-valores', authenticateToken, requirePayment, async (req, res) => {
    try {
        const itensAtualizados = await db.resetarValores(req.userId);
        res.json({ message: 'Valores resetados com sucesso', itensAtualizados });
    } catch (error) {
        console.error('Erro ao resetar valores:', error);
        res.status(500).json({ error: 'Erro ao resetar valores' });
    }
});

// Atualizar ordem das categorias
app.put('/api/categorias/ordem', authenticateToken, requirePayment, async (req, res) => {
    try {
        const { categorias } = req.body;
        
        if (!Array.isArray(categorias)) {
            return res.status(400).json({ error: 'categorias deve ser um array' });
        }
        
        await db.atualizarOrdemCategorias(categorias, req.userId);
        res.json({ message: 'Ordem das categorias atualizada com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar ordem das categorias:', error);
        res.status(500).json({ error: 'Erro ao atualizar ordem das categorias' });
    }
});

// Atualizar ordem dos itens dentro de uma categoria
app.put('/api/itens/categoria/:categoria/ordem', authenticateToken, requirePayment, async (req, res) => {
    try {
        const { categoria } = req.params;
        const { itensIds } = req.body;
        
        if (!Array.isArray(itensIds)) {
            return res.status(400).json({ error: 'itensIds deve ser um array' });
        }
        
        await db.atualizarOrdemItens(categoria, itensIds, req.userId);
        res.json({ message: 'Ordem dos itens atualizada com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar ordem dos itens:', error);
        res.status(500).json({ error: 'Erro ao atualizar ordem dos itens' });
    }
});

// Criar nova categoria
app.post('/api/categorias', authenticateToken, requirePayment, async (req, res) => {
    try {
        const { nome, icone } = req.body;
        
        if (!nome || nome.trim() === '') {
            return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
        }
        
        // Se for acesso único, não permitir criar categoria
        // Mas em modo trial (sem acesso), permitir criar para testar
        if (req.acessoUnico) {
            await db.marcarPagamentoUnicoComoUsado(req.userId);
            return res.status(403).json({ 
                error: 'Acesso único não permite criar categorias. Os dados não serão salvos.',
                codigo: 'ACESSO_UNICO_NAO_SALVA'
            });
        }
        
        const categoria = await db.criarCategoria(nome.trim(), icone || null, req.userId);
        res.status(201).json(categoria);
    } catch (error) {
        console.error('Erro ao criar categoria:', error);
        res.status(500).json({ error: error.message || 'Erro ao criar categoria' });
    }
});

// Renomear categoria
app.put('/api/categorias/:nomeAntigo', authenticateToken, requirePayment, async (req, res) => {
    try {
        const { nomeAntigo } = req.params;
        const { nomeNovo } = req.body;
        const categoriaNomeAntigo = decodeURIComponent(nomeAntigo);
        
        if (!nomeNovo || nomeNovo.trim() === '') {
            return res.status(400).json({ error: 'Novo nome da categoria é obrigatório' });
        }
        
        const sucesso = await db.renomearCategoria(categoriaNomeAntigo, nomeNovo.trim(), req.userId);
        if (!sucesso) {
            return res.status(404).json({ error: 'Categoria não encontrada' });
        }
        
        res.json({ message: 'Categoria renomeada com sucesso' });
    } catch (error) {
        console.error('Erro ao renomear categoria:', error);
        res.status(500).json({ error: error.message || 'Erro ao renomear categoria' });
    }
});

// Atualizar ícone da categoria
app.put('/api/categorias/:nome/icone', authenticateToken, requirePayment, async (req, res) => {
    try {
        const { nome } = req.params;
        const { icone } = req.body;
        const categoriaNome = decodeURIComponent(nome);
        
        if (!icone || icone.trim() === '') {
            return res.status(400).json({ error: 'Nome do ícone é obrigatório' });
        }
        
        const sucesso = await db.atualizarIconeCategoria(categoriaNome, icone.trim(), req.userId);
        if (!sucesso) {
            return res.status(404).json({ error: 'Erro ao atualizar ícone da categoria' });
        }
        
        res.json({ message: 'Ícone da categoria atualizado com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar ícone da categoria:', error);
        res.status(500).json({ error: error.message || 'Erro ao atualizar ícone da categoria' });
    }
});

// Obter ícone da categoria
app.get('/api/categorias/:nome/icone', authenticateToken, requirePayment, async (req, res) => {
    try {
        const { nome } = req.params;
        const categoriaNome = decodeURIComponent(nome);
        
        const icone = await db.obterIconeCategoria(categoriaNome, req.userId);
        res.json({ icone });
    } catch (error) {
        console.error('Erro ao obter ícone da categoria:', error);
        res.status(500).json({ error: error.message || 'Erro ao obter ícone da categoria' });
    }
});

// Deletar categoria
app.delete('/api/categorias/:nome', authenticateToken, requirePayment, async (req, res) => {
    try {
        const { nome } = req.params;
        const categoriaNome = decodeURIComponent(nome);
        
        console.log(`Tentando deletar categoria: "${categoriaNome}"`);
        
        await db.deletarCategoria(categoriaNome, req.userId);
        
        res.json({ message: 'Categoria e seus itens deletados com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar categoria:', error);
        res.status(500).json({ error: error.message || 'Erro ao deletar categoria' });
    }
});

// ========== ENDPOINTS DE PLATAFORMAS ==========

// Obter todas as plataformas do usuário
app.get('/api/plataformas', authenticateToken, async (req, res) => {
    try {
        const plataformas = await db.obterPlataformas(req.userId);
        res.json(plataformas);
    } catch (error) {
        console.error('Erro ao obter plataformas:', error);
        res.status(500).json({ error: 'Erro ao obter plataformas' });
    }
});

// Criar nova plataforma
app.post('/api/plataformas', authenticateToken, async (req, res) => {
    try {
        const { nome, taxa } = req.body;
        
        if (!nome || nome.trim() === '') {
            return res.status(400).json({ error: 'Nome da plataforma é obrigatório' });
        }
        
        if (taxa === undefined || taxa === null) {
            return res.status(400).json({ error: 'Taxa da plataforma é obrigatória' });
        }
        
        const taxaNumerica = parseFloat(taxa);
        if (isNaN(taxaNumerica) || taxaNumerica < 0 || taxaNumerica > 100) {
            return res.status(400).json({ error: 'Taxa deve ser um número entre 0 e 100' });
        }
        
        const plataforma = await db.criarPlataforma(req.userId, nome.trim(), taxaNumerica);
        res.status(201).json(plataforma);
    } catch (error) {
        console.error('Erro ao criar plataforma:', error);
        res.status(500).json({ error: error.message || 'Erro ao criar plataforma' });
    }
});

// Atualizar plataforma
app.put('/api/plataformas/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, taxa } = req.body;
        
        if (!nome || nome.trim() === '') {
            return res.status(400).json({ error: 'Nome da plataforma é obrigatório' });
        }
        
        if (taxa === undefined || taxa === null) {
            return res.status(400).json({ error: 'Taxa da plataforma é obrigatória' });
        }
        
        const taxaNumerica = parseFloat(taxa);
        if (isNaN(taxaNumerica) || taxaNumerica < 0 || taxaNumerica > 100) {
            return res.status(400).json({ error: 'Taxa deve ser um número entre 0 e 100' });
        }
        
        const plataforma = await db.atualizarPlataforma(req.userId, id, nome.trim(), taxaNumerica);
        if (!plataforma) {
            return res.status(404).json({ error: 'Plataforma não encontrada' });
        }
        res.json(plataforma);
    } catch (error) {
        console.error('Erro ao atualizar plataforma:', error);
        res.status(500).json({ error: error.message || 'Erro ao atualizar plataforma' });
    }
});

// Deletar plataforma
app.delete('/api/plataformas/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const sucesso = await db.deletarPlataforma(req.userId, id);
        if (!sucesso) {
            return res.status(404).json({ error: 'Plataforma não encontrada' });
        }
        res.json({ message: 'Plataforma deletada com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar plataforma:', error);
        res.status(500).json({ error: 'Erro ao deletar plataforma' });
    }
});

// Atualizar ordem das plataformas
app.put('/api/plataformas/ordem', authenticateToken, async (req, res) => {
    try {
        const { plataformasIds } = req.body;
        
        if (!Array.isArray(plataformasIds)) {
            return res.status(400).json({ error: 'plataformasIds deve ser um array' });
        }
        
        await db.atualizarOrdemPlataformas(req.userId, plataformasIds);
        res.json({ message: 'Ordem das plataformas atualizada com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar ordem das plataformas:', error);
        res.status(500).json({ error: 'Erro ao atualizar ordem das plataformas' });
    }
});

// ========== ENDPOINTS DE TUTORIAL ==========

// Verificar se tutorial foi completado
app.get('/api/tutorial/status', authenticateToken, async (req, res) => {
    try {
        const completed = await db.verificarTutorialCompleto(req.userId);
        res.json({ completed });
    } catch (error) {
        console.error('Erro ao verificar status do tutorial:', error);
        res.status(500).json({ error: 'Erro ao verificar status do tutorial' });
    }
});

// Marcar tutorial como completo
app.post('/api/tutorial/complete', authenticateToken, async (req, res) => {
    try {
        await db.marcarTutorialCompleto(req.userId);
        res.json({ message: 'Tutorial marcado como completo' });
    } catch (error) {
        console.error('Erro ao marcar tutorial como completo:', error);
        res.status(500).json({ error: 'Erro ao marcar tutorial como completo' });
    }
});

// Limpar flag de tutorial completo (para re-exibir)
app.post('/api/tutorial/reset', authenticateToken, async (req, res) => {
    try {
        await db.limparTutorialCompleto(req.userId);
        res.json({ message: 'Flag de tutorial limpa com sucesso' });
    } catch (error) {
        console.error('Erro ao limpar tutorial completo:', error);
        res.status(500).json({ error: 'Erro ao limpar tutorial completo' });
    }
});

// ========== ROTAS DE FUNÇÕES DA LANDING PAGE ==========

// Obter todas as funções (público para landing page)
app.get('/api/funcoes', async (req, res) => {
    try {
        const funcoes = await db.obterFuncoes();
        res.json(funcoes);
    } catch (error) {
        console.error('Erro ao obter funções:', error);
        res.status(500).json({ error: 'Erro ao obter funções' });
    }
});

// Criar função (apenas admin)
app.post('/api/funcoes', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { titulo, descricao, icone, icone_upload, ativa, eh_ia, em_beta, ordem } = req.body;
        
        if (!titulo || !descricao) {
            return res.status(400).json({ error: 'Título e descrição são obrigatórios' });
        }

        const funcao = await db.criarFuncao(
            titulo.trim(),
            descricao.trim(),
            icone || null,
            icone_upload || null,
            ativa !== undefined ? ativa : true,
            eh_ia !== undefined ? eh_ia : false,
            em_beta !== undefined ? em_beta : false,
            ordem || 0
        );
        res.json(funcao);
    } catch (error) {
        console.error('Erro ao criar função:', error);
        res.status(500).json({ error: 'Erro ao criar função' });
    }
});

// Atualizar função (apenas admin)
app.put('/api/funcoes/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, descricao, icone, icone_upload, ativa, eh_ia, em_beta, ordem } = req.body;
        
        if (!titulo || !descricao) {
            return res.status(400).json({ error: 'Título e descrição são obrigatórios' });
        }

        const funcao = await db.atualizarFuncao(
            parseInt(id),
            titulo.trim(),
            descricao.trim(),
            icone || null,
            icone_upload || null,
            ativa !== undefined ? ativa : true,
            eh_ia !== undefined ? eh_ia : false,
            em_beta !== undefined ? em_beta : false,
            ordem || 0
        );
        
        if (!funcao) {
            return res.status(404).json({ error: 'Função não encontrada' });
        }
        
        res.json(funcao);
    } catch (error) {
        console.error('Erro ao atualizar função:', error);
        res.status(500).json({ error: 'Erro ao atualizar função' });
    }
});

// Deletar função (apenas admin)
app.delete('/api/funcoes/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const deletado = await db.deletarFuncao(parseInt(id));
        
        if (!deletado) {
            return res.status(404).json({ error: 'Função não encontrada' });
        }
        
        res.json({ message: 'Função deletada com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar função:', error);
        res.status(500).json({ error: 'Erro ao deletar função' });
    }
});

// ========== CONFIGURAÇÕES DO MENU ==========

// Obter configurações do menu (público - usado na landing page)
app.get('/api/configuracoes-menu', async (req, res) => {
    try {
        const configuracoes = await db.obterConfiguracoesMenu();
        res.json(configuracoes);
    } catch (error) {
        console.error('Erro ao obter configurações do menu:', error);
        res.status(500).json({ error: 'Erro ao obter configurações do menu' });
    }
});

// Atualizar configurações do menu (apenas admin)
app.put('/api/configuracoes-menu', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { configuracoes } = req.body;
        
        if (!Array.isArray(configuracoes)) {
            return res.status(400).json({ error: 'Configurações devem ser um array' });
        }

        await db.atualizarConfiguracoesMenu(configuracoes);
        const configuracoesAtualizadas = await db.obterConfiguracoesMenu();
        res.json(configuracoesAtualizadas);
    } catch (error) {
        console.error('Erro ao atualizar configurações do menu:', error);
        res.status(500).json({ error: 'Erro ao atualizar configurações do menu' });
    }
});

// Atualizar ordem das seções do menu (apenas admin)
app.put('/api/configuracoes-menu/ordem', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { secaoIds } = req.body;
        
        if (!Array.isArray(secaoIds)) {
            return res.status(400).json({ error: 'secaoIds deve ser um array' });
        }

        await db.atualizarOrdemMenu(secaoIds);
        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao atualizar ordem do menu:', error);
        res.status(500).json({ error: 'Erro ao atualizar ordem do menu' });
    }
});

// ========== CONFIGURAÇÕES DE SESSÕES DA LANDING PAGE ==========

// Obter todas as configurações de sessões (público - usado na landing page)
app.get('/api/configuracoes-sessoes', async (req, res) => {
    try {
        const configuracoes = await db.obterConfiguracoesSessoes();
        res.json(configuracoes);
    } catch (error) {
        console.error('Erro ao obter configurações de sessões:', error);
        res.status(500).json({ error: 'Erro ao obter configurações de sessões' });
    }
});

// Atualizar configurações de sessões (apenas admin)
app.put('/api/configuracoes-sessoes', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { configuracoes } = req.body;
        
        if (!Array.isArray(configuracoes)) {
            return res.status(400).json({ error: 'Configurações devem ser um array' });
        }

        await db.atualizarConfiguracoesSessoes(configuracoes);
        const configuracoesAtualizadas = await db.obterConfiguracoesSessoes();
        res.json(configuracoesAtualizadas);
    } catch (error) {
        console.error('Erro ao atualizar configurações de sessões:', error);
        res.status(500).json({ error: 'Erro ao atualizar configurações de sessões' });
    }
});

// Atualizar ordem das sessões (apenas admin)
app.put('/api/configuracoes-sessoes/ordem', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { sessaoIds } = req.body;
        
        if (!Array.isArray(sessaoIds)) {
            return res.status(400).json({ error: 'sessaoIds deve ser um array' });
        }

        await db.atualizarOrdemSessoes(sessaoIds);
        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao atualizar ordem das sessões:', error);
        res.status(500).json({ error: 'Erro ao atualizar ordem das sessões' });
    }
});

// ========== PLANOS ==========

// Obter todos os planos (público - usado na landing page)
app.get('/api/planos', async (req, res) => {
    try {
        const planos = await db.obterPlanos();
        // Retornar apenas planos ativos para a landing page
        const planosAtivos = planos.filter(p => p.ativo);
        res.json(planosAtivos);
    } catch (error) {
        console.error('Erro ao obter planos:', error);
        res.status(500).json({ error: 'Erro ao obter planos' });
    }
});

// Obter todos os planos (incluindo inativos - apenas admin)
app.get('/api/admin/planos', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const planos = await db.obterPlanos();
        res.json(planos);
    } catch (error) {
        console.error('Erro ao obter planos:', error);
        res.status(500).json({ error: 'Erro ao obter planos' });
    }
});

// Obter plano por ID (público - para validação de cupom)
app.get('/api/planos/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const plano = await db.obterPlanoPorId(parseInt(id));
        
        if (!plano) {
            return res.status(404).json({ error: 'Plano não encontrado' });
        }
        
        // Retornar apenas informações necessárias (sem dados sensíveis)
        res.json({
            id: plano.id,
            nome: plano.nome,
            valor: plano.valor,
            stripe_price_id: plano.stripe_price_id,
            tipo: plano.tipo,
            periodo: plano.periodo
        });
    } catch (error) {
        console.error('Erro ao obter plano:', error);
        res.status(500).json({ error: 'Erro ao obter plano' });
    }
});

// Obter plano por ID (apenas admin - rota completa)
app.get('/api/admin/planos/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const plano = await db.obterPlanoPorId(parseInt(id));
        
        if (!plano) {
            return res.status(404).json({ error: 'Plano não encontrado' });
        }
        
        res.json(plano);
    } catch (error) {
        console.error('Erro ao obter plano:', error);
        res.status(500).json({ error: 'Erro ao obter plano' });
    }
});

// Criar plano (apenas admin)
app.post('/api/admin/planos', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const plano = req.body;
        
        if (!plano.nome || !plano.tipo || plano.valor === undefined) {
            return res.status(400).json({ error: 'Nome, tipo e valor são obrigatórios' });
        }

        const novoPlano = await db.criarPlano(plano);
        res.json(novoPlano);
    } catch (error) {
        console.error('Erro ao criar plano:', error);
        res.status(500).json({ error: 'Erro ao criar plano' });
    }
});

// Atualizar ordem dos planos (DEVE VIR ANTES DA ROTA /:id)
app.put('/api/admin/planos/ordem', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { planosIds } = req.body;
        
        console.log('Recebido para atualizar ordem:', planosIds);
        
        if (!Array.isArray(planosIds)) {
            console.error('planosIds não é um array:', typeof planosIds, planosIds);
            return res.status(400).json({ error: 'planosIds deve ser um array' });
        }
        
        if (planosIds.length === 0) {
            console.error('planosIds está vazio');
            return res.status(400).json({ error: 'planosIds não pode estar vazio' });
        }
        
        await db.atualizarOrdemPlanos(planosIds);
        res.json({ message: 'Ordem dos planos atualizada com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar ordem dos planos:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ error: 'Erro ao atualizar ordem dos planos', details: error.message });
    }
});

// Atualizar plano (apenas admin)
app.put('/api/admin/planos/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const plano = req.body;
        
        const planoAtualizado = await db.atualizarPlano(parseInt(id), plano);
        
        if (!planoAtualizado) {
            return res.status(404).json({ error: 'Plano não encontrado' });
        }
        
        res.json(planoAtualizado);
    } catch (error) {
        console.error('Erro ao atualizar plano:', error);
        res.status(500).json({ error: 'Erro ao atualizar plano' });
    }
});

// Deletar plano (apenas admin)
app.delete('/api/admin/planos/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const deletado = await db.deletarPlano(parseInt(id));
        
        if (!deletado) {
            return res.status(404).json({ error: 'Plano não encontrado' });
        }
        
        res.json({ message: 'Plano deletado com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar plano:', error);
        res.status(500).json({ error: 'Erro ao deletar plano' });
    }
});

// ========== ENDPOINTS DE BENEFÍCIOS ==========

// Atualizar benefício
app.put('/api/admin/beneficios/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { texto, eh_aviso, em_beta } = req.body;
        
        if (!texto || texto.trim() === '') {
            return res.status(400).json({ error: 'Texto do benefício é obrigatório' });
        }
        
        const beneficio = await db.atualizarBeneficio(
            parseInt(id), 
            texto.trim(), 
            eh_aviso !== undefined ? eh_aviso : null,
            em_beta !== undefined ? em_beta : null
        );
        if (!beneficio) {
            return res.status(404).json({ error: 'Benefício não encontrado' });
        }
        res.json(beneficio);
    } catch (error) {
        console.error('Erro ao atualizar benefício:', error);
        res.status(500).json({ error: 'Erro ao atualizar benefício' });
    }
});

// Deletar benefício
app.delete('/api/admin/beneficios/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const deletado = await db.deletarBeneficio(parseInt(id));
        if (!deletado) {
            return res.status(404).json({ error: 'Benefício não encontrado' });
        }
        res.json({ message: 'Benefício deletado com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar benefício:', error);
        res.status(500).json({ error: 'Erro ao deletar benefício' });
    }
});

// Obter todos os benefícios disponíveis
app.get('/api/admin/beneficios', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const beneficios = await db.obterTodosBeneficios();
        res.json(beneficios);
    } catch (error) {
        console.error('Erro ao obter benefícios:', error);
        res.status(500).json({ error: 'Erro ao obter benefícios' });
    }
});

// Remover benefício de um plano específico (sem deletar o benefício)
app.delete('/api/admin/planos/:planoId/beneficios/:beneficioId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { planoId, beneficioId } = req.params;
        const removido = await db.removerBeneficioDoPlano(parseInt(planoId), parseInt(beneficioId));
        if (!removido) {
            return res.status(404).json({ error: 'Relacionamento não encontrado' });
        }
        res.json({ message: 'Benefício removido do plano com sucesso' });
    } catch (error) {
        console.error('Erro ao remover benefício do plano:', error);
        res.status(500).json({ error: 'Erro ao remover benefício do plano' });
    }
});

// Atualizar ordem dos benefícios de um plano
app.put('/api/admin/planos/:planoId/beneficios/ordem', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { planoId } = req.params;
        const { beneficiosIds } = req.body;
        
        console.log(`Recebido para atualizar ordem dos benefícios do plano ${planoId}:`, beneficiosIds);
        
        if (!Array.isArray(beneficiosIds)) {
            console.error('beneficiosIds não é um array:', typeof beneficiosIds, beneficiosIds);
            return res.status(400).json({ error: 'beneficiosIds deve ser um array' });
        }
        
        if (beneficiosIds.length === 0) {
            console.error('beneficiosIds está vazio');
            return res.status(400).json({ error: 'beneficiosIds não pode estar vazio' });
        }
        
        await db.atualizarOrdemBeneficios(parseInt(planoId), beneficiosIds);
        res.json({ message: 'Ordem dos benefícios atualizada com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar ordem dos benefícios:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ error: 'Erro ao atualizar ordem dos benefícios', details: error.message });
    }
});

// ========== ENDPOINTS DE FAQ ==========

// Obter todas as perguntas FAQ (público)
app.get('/api/faq', async (req, res) => {
    try {
        const faq = await db.obterFAQ();
        res.json(faq);
    } catch (error) {
        console.error('Erro ao obter FAQ:', error);
        res.status(500).json({ error: 'Erro ao obter FAQ' });
    }
});

// Obter todas as perguntas FAQ (admin)
app.get('/api/admin/faq', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const faq = await db.obterFAQ();
        res.json(faq);
    } catch (error) {
        console.error('Erro ao obter FAQ:', error);
        res.status(500).json({ error: 'Erro ao obter FAQ' });
    }
});

// Obter pergunta FAQ por ID (admin)
app.get('/api/admin/faq/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const pergunta = await db.obterFAQPorId(parseInt(id));
        if (!pergunta) {
            return res.status(404).json({ error: 'Pergunta não encontrada' });
        }
        res.json(pergunta);
    } catch (error) {
        console.error('Erro ao obter FAQ por ID:', error);
        res.status(500).json({ error: 'Erro ao obter FAQ' });
    }
});

// Criar pergunta FAQ (admin)
app.post('/api/admin/faq', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { pergunta, resposta, ordem } = req.body;
        
        if (!pergunta || !pergunta.trim()) {
            return res.status(400).json({ error: 'A pergunta é obrigatória' });
        }
        
        if (!resposta || !resposta.trim()) {
            return res.status(400).json({ error: 'A resposta é obrigatória' });
        }
        
        const novaPergunta = await db.criarFAQ(pergunta, resposta, ordem);
        res.json(novaPergunta);
    } catch (error) {
        console.error('Erro ao criar FAQ:', error);
        res.status(500).json({ error: 'Erro ao criar FAQ' });
    }
});

// Atualizar ordem das perguntas FAQ (DEVE VIR ANTES DA ROTA /:id)
app.put('/api/admin/faq/ordem', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { faqIds } = req.body;
        
        console.log('Recebido para atualizar ordem das perguntas FAQ:', faqIds);
        
        if (!Array.isArray(faqIds)) {
            console.error('faqIds não é um array:', typeof faqIds, faqIds);
            return res.status(400).json({ error: 'faqIds deve ser um array' });
        }
        
        if (faqIds.length === 0) {
            console.error('faqIds está vazio');
            return res.status(400).json({ error: 'faqIds não pode estar vazio' });
        }
        
        await db.atualizarOrdemFAQ(faqIds);
        res.json({ message: 'Ordem das perguntas FAQ atualizada com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar ordem das perguntas FAQ:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ error: 'Erro ao atualizar ordem das perguntas FAQ', details: error.message });
    }
});

// ========== ROTAS DE RODAPÉ ==========

// Obter links do rodapé (público)
app.get('/api/rodape', async (req, res) => {
    try {
        const links = await db.obterRodapeLinks();
        res.json(links);
    } catch (error) {
        console.error('Erro ao obter links do rodapé:', error);
        res.status(500).json({ error: 'Erro ao obter links do rodapé' });
    }
});

// Obter links do rodapé (admin)
app.get('/api/admin/rodape', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const links = await db.obterRodapeLinks();
        res.json(links);
    } catch (error) {
        console.error('Erro ao obter links do rodapé:', error);
        res.status(500).json({ error: 'Erro ao obter links do rodapé' });
    }
});

// Obter colunas do rodapé (admin)
app.get('/api/admin/rodape/colunas', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const colunas = await db.obterColunasRodape();
        res.json(colunas);
    } catch (error) {
        console.error('Erro ao obter colunas do rodapé:', error);
        res.status(500).json({ error: 'Erro ao obter colunas do rodapé' });
    }
});

// Atualizar ordem das colunas do rodapé
app.put('/api/admin/rodape/colunas/ordem', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { nomesColunas } = req.body;

        if (!Array.isArray(nomesColunas)) {
            return res.status(400).json({ error: 'nomesColunas deve ser um array' });
        }

        if (nomesColunas.length === 0) {
            return res.status(400).json({ error: 'nomesColunas não pode estar vazio' });
        }

        await db.atualizarOrdemColunasRodape(nomesColunas);
        res.json({ message: 'Ordem das colunas atualizada com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar ordem das colunas do rodapé:', error);
        res.status(500).json({ error: 'Erro ao atualizar ordem das colunas do rodapé' });
    }
});

// Obter link do rodapé por ID (admin)
app.get('/api/admin/rodape/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const link = await db.obterRodapeLinkPorId(parseInt(id));
        if (!link) {
            return res.status(404).json({ error: 'Link não encontrado' });
        }
        res.json(link);
    } catch (error) {
        console.error('Erro ao obter link do rodapé:', error);
        res.status(500).json({ error: 'Erro ao obter link do rodapé' });
    }
});

// Atualizar ordem dos links do rodapé (DEVE VIR ANTES DA ROTA /:id)
app.put('/api/admin/rodape/ordem', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { linkIds } = req.body;
        
        
        if (!Array.isArray(linkIds)) {
            console.error('linkIds não é um array:', typeof linkIds, linkIds);
            return res.status(400).json({ error: 'linkIds deve ser um array' });
        }
        
        if (linkIds.length === 0) {
            console.error('linkIds está vazio');
            return res.status(400).json({ error: 'linkIds não pode estar vazio' });
        }
        
        await db.atualizarOrdemRodapeLinks(linkIds);
        res.json({ message: 'Ordem dos links do rodapé atualizada com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar ordem dos links do rodapé:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ error: 'Erro ao atualizar ordem dos links do rodapé', details: error.message });
    }
});

// Criar link do rodapé (admin)
app.post('/api/admin/rodape', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { texto, link, coluna, ordem, eh_link } = req.body;
        
        if (!texto || !texto.trim()) {
            return res.status(400).json({ error: 'O texto do link é obrigatório' });
        }
        
        if (!coluna || !coluna.trim()) {
            return res.status(400).json({ error: 'A coluna é obrigatória' });
        }
        
        // Link só é obrigatório se eh_link for true
        const ehLinkValue = eh_link !== undefined ? eh_link : true;
        if (ehLinkValue && (!link || !link.trim())) {
            return res.status(400).json({ error: 'O link é obrigatório quando o item é um link' });
        }
        
        const novoLink = await db.criarRodapeLink(texto.trim(), link ? link.trim() : '', coluna.trim(), ordem, ehLinkValue);
        res.json(novoLink);
    } catch (error) {
        console.error('Erro ao criar link do rodapé:', error);
        res.status(500).json({ error: 'Erro ao criar link do rodapé' });
    }
});

// Atualizar link do rodapé (admin)
app.put('/api/admin/rodape/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { texto, link, coluna, eh_link } = req.body;
        
        if (!texto || !texto.trim()) {
            return res.status(400).json({ error: 'O texto do link é obrigatório' });
        }
        
        if (!coluna || !coluna.trim()) {
            return res.status(400).json({ error: 'A coluna é obrigatória' });
        }
        
        // Link só é obrigatório se eh_link for true
        // Garantir que eh_link seja um booleano
        let ehLinkValue;
        if (eh_link === undefined || eh_link === null) {
            ehLinkValue = true; // Padrão: é um link
        } else if (typeof eh_link === 'string') {
            ehLinkValue = eh_link === 'true' || eh_link === '1';
        } else if (typeof eh_link === 'boolean') {
            ehLinkValue = eh_link; // Usar diretamente se já for booleano
        } else {
            ehLinkValue = Boolean(eh_link);
        }
        
        // Se eh_link é true, o link é obrigatório
        if (ehLinkValue === true) {
            const linkTrimmed = link ? String(link).trim() : '';
            if (linkTrimmed === '') {
                return res.status(400).json({ error: 'O link é obrigatório quando o item é um link' });
            }
        }
        
        // Se eh_link é false, o link deve ser uma string vazia
        const linkValue = ehLinkValue ? (link ? String(link).trim() : '') : '';
        
        const linkAtualizado = await db.atualizarRodapeLink(parseInt(id), texto.trim(), linkValue, coluna.trim(), ehLinkValue);
        if (!linkAtualizado) {
            return res.status(404).json({ error: 'Link não encontrado' });
        }
        res.json(linkAtualizado);
    } catch (error) {
        console.error('Erro ao atualizar link do rodapé:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ error: 'Erro ao atualizar link do rodapé', details: error.message });
    }
});

// Deletar link do rodapé (admin)
app.delete('/api/admin/rodape/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const deletado = await db.deletarRodapeLink(parseInt(id));
        if (!deletado) {
            return res.status(404).json({ error: 'Link não encontrado' });
        }
        res.json({ message: 'Link deletado com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar link do rodapé:', error);
        res.status(500).json({ error: 'Erro ao deletar link do rodapé' });
    }
});

// Atualizar pergunta FAQ (admin)
app.put('/api/admin/faq/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { pergunta, resposta } = req.body;
        
        if (!pergunta || !pergunta.trim()) {
            return res.status(400).json({ error: 'A pergunta é obrigatória' });
        }
        
        if (!resposta || !resposta.trim()) {
            return res.status(400).json({ error: 'A resposta é obrigatória' });
        }
        
        const perguntaAtualizada = await db.atualizarFAQ(parseInt(id), pergunta, resposta);
        if (!perguntaAtualizada) {
            return res.status(404).json({ error: 'Pergunta não encontrada' });
        }
        res.json(perguntaAtualizada);
    } catch (error) {
        console.error('Erro ao atualizar FAQ:', error);
        res.status(500).json({ error: 'Erro ao atualizar FAQ' });
    }
});

// Deletar pergunta FAQ (admin)
app.delete('/api/admin/faq/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const deletado = await db.deletarFAQ(parseInt(id));
        if (!deletado) {
            return res.status(404).json({ error: 'Pergunta não encontrada' });
        }
        res.json({ message: 'Pergunta deletada com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar FAQ:', error);
        res.status(500).json({ error: 'Erro ao deletar FAQ' });
    }
});

// Servir arquivos estáticos do frontend React (DEPOIS das rotas da API)
const frontendPath = path.join(__dirname, 'frontend', 'dist');
app.use(express.static(frontendPath));

// Servir o arquivo HTML do React para todas as rotas não-API
app.get('*', (req, res) => {
    // Não servir index.html para rotas de API
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'Rota não encontrada' });
    }
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Inicializar banco de dados e iniciar servidor
db.inicializar().then(() => {
    app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
        console.log(`Acesse: http://localhost:${PORT}`);
    });
}).catch(error => {
    console.error('Erro ao inicializar banco de dados:', error);
    process.exit(1);
});

