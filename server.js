require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./database');
const { authenticateToken, requireAdmin, requirePayment, generateToken } = require('./middleware/auth');
const { enviarEmailRecuperacao, enviarEmailRecuperacaoMultiplos } = require('./services/email');
const stripeService = require('./services/stripe');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

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
                // Buscar sessão para obter valor
                const session = await stripeService.stripe.checkout.sessions.retrieve(resultado.sessionId || event.data.object.id);
                const valor = session.amount_total ? session.amount_total / 100 : 199.00; // Converter de centavos

                console.log('💰 Valor do pagamento:', valor);

                await db.criarPagamentoUnico(userId, {
                    stripe_payment_intent_id: paymentIntentId,
                    stripe_customer_id: session.customer || null,
                    valor: valor,
                    status: 'succeeded',
                });

                console.log('✅ Pagamento único salvo no banco de dados para usuário:', userId);
            } else if (resultado.tipo === 'pagamento_unico_sucesso' && !userId) {
                // payment_intent.succeeded não tem userId, mas checkout.session.completed já processou
                // Então apenas ignoramos silenciosamente
                console.log('ℹ️  payment_intent.succeeded recebido (já processado por checkout.session.completed)');
            } else {
                console.error('❌ Dados insuficientes para processar pagamento único:', { userId, paymentIntentId });
            }
        }

        // Processar assinatura
        if (resultado.tipo === 'assinatura') {
            const userId = resultado.metadata?.user_id ? parseInt(resultado.metadata.user_id) : null;

            console.log('📋 Processando assinatura - UserId:', userId, 'SubscriptionId:', resultado.subscriptionId);

            if (userId) {
                await db.criarOuAtualizarAssinatura(userId, {
                    stripe_subscription_id: resultado.subscriptionId,
                    stripe_customer_id: resultado.customerId,
                    plano_tipo: 'anual',
                    status: resultado.status,
                    current_period_start: resultado.currentPeriodStart,
                    current_period_end: resultado.currentPeriodEnd,
                    cancel_at_period_end: resultado.cancelAtPeriodEnd || false,
                });

                console.log('✅ Assinatura salva no banco de dados para usuário:', userId, 'Status:', resultado.status);
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
app.use(bodyParser.json());

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
        res.json({
            user: {
                id: req.user.id,
                username: req.user.username,
                email: req.user.email,
                is_admin: req.user.is_admin || false
            }
        });
    } catch (error) {
        console.error('Erro ao verificar token:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
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
        const baseUrl = process.env.FRONTEND_URL || `http://localhost:${PORT}`;
        
        const session = await stripeService.criarCheckoutAnual(
            usuario.email,
            usuario.id,
            `${baseUrl}/pagamento/sucesso?session_id={CHECKOUT_SESSION_ID}`,
            `${baseUrl}/pagamento/cancelado`
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
        const baseUrl = process.env.FRONTEND_URL || `http://localhost:${PORT}`;
        
        const session = await stripeService.criarCheckoutUnico(
            usuario.email,
            usuario.id,
            `${baseUrl}/pagamento/sucesso?session_id={CHECKOUT_SESSION_ID}`,
            `${baseUrl}/pagamento/cancelado`
        );

        res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
        console.error('Erro ao criar checkout único:', error);
        res.status(500).json({ error: error.message || 'Erro ao criar sessão de checkout' });
    }
});

// Verificar status de pagamento do usuário
app.get('/api/stripe/status', authenticateToken, async (req, res) => {
    try {
        const acesso = await db.verificarAcessoAtivo(req.userId);
        const assinatura = await db.obterAssinatura(req.userId);

        res.json({
            temAcesso: acesso.temAcesso,
            tipo: acesso.tipo === 'vitalicio' ? 'anual' : acesso.tipo, // Retornar 'anual' para compatibilidade com frontend
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

// Listar todos os usuários (apenas admin)
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
        const { username, email, senha, is_admin } = req.body;
        
        const usuario = await db.atualizarUsuario(parseInt(id), username, email, senha, is_admin);
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
        const { titulo, descricao, icone, icone_upload, ativa, eh_ia, ordem } = req.body;
        
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
        const { titulo, descricao, icone, icone_upload, ativa, eh_ia, ordem } = req.body;
        
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

// Obter plano por ID (apenas admin)
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
        const { texto, eh_aviso } = req.body;
        
        if (!texto || texto.trim() === '') {
            return res.status(400).json({ error: 'Texto do benefício é obrigatório' });
        }
        
        const beneficio = await db.atualizarBeneficio(parseInt(id), texto.trim(), eh_aviso !== undefined ? eh_aviso : null);
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

