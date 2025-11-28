const jwt = require('jsonwebtoken');
const db = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_super_segura_aqui_mude_em_producao';

// Middleware de autenticação
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ error: 'Token de acesso requerido' });
        }

        jwt.verify(token, JWT_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ error: 'Token inválido ou expirado' });
            }

            // Verificar se o usuário ainda existe
            const usuario = await db.obterUsuarioPorId(decoded.userId);
            if (!usuario) {
                return res.status(403).json({ error: 'Usuário não encontrado' });
            }

            req.user = usuario;
            req.userId = usuario.id;
            req.isAdmin = usuario.is_admin || false;
            next();
        });
    } catch (error) {
        console.error('Erro na autenticação:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Middleware para verificar se é admin
const requireAdmin = (req, res, next) => {
    if (!req.isAdmin) {
        return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem acessar esta rota.' });
    }
    next();
};

// Middleware para verificar se o usuário tem acesso pago
// Permite acesso a rotas de pagamento e autenticação mesmo sem pagamento
const requirePayment = async (req, res, next) => {
    try {
        // Rotas que não precisam de pagamento
        const rotasPublicas = [
            '/api/auth/login',
            '/api/auth/register',
            '/api/auth/me',
            '/api/stripe/checkout',
            '/api/stripe/status',
        ];

        // Rotas que permitem modo trial (leitura e escrita para testar o sistema)
        // Mas excluir rotas de reajuste que precisam de pagamento
        const rotasTrial = [
            '/api/itens',
            '/api/categorias',
        ];

        // Rotas de reajuste que NÃO devem ser permitidas em modo trial
        const rotasReajusteBloqueadas = [
            '/api/itens/',
            '/api/resetar-valores',
        ];

        const rotaAtual = req.path;
        const isRotaPublica = rotasPublicas.some(rota => rotaAtual.startsWith(rota));
        
        // Verificar se é rota de reajuste bloqueada (precisa pagamento)
        // Bloquear: backup, valorNovo (reajuste automático), e valor (edição manual de preço)
        const isRotaReajusteBloqueada = 
            rotaAtual.includes('/api/itens/') && (
                rotaAtual.includes('/backup') || 
                (req.method === 'PUT' && req.body && (
                    'valorNovo' in req.body || 
                    'valor' in req.body
                ))
            ) ||
            rotaAtual.startsWith('/api/resetar-valores');
        
        const isRotaTrial = !isRotaReajusteBloqueada && rotasTrial.some(rota => rotaAtual.startsWith(rota));

        if (isRotaPublica) {
            return next();
        }

        // Verificar se o usuário está autenticado
        if (!req.userId) {
            return res.status(401).json({ error: 'Token de acesso requerido' });
        }

        // Admins sempre têm acesso completo, independente de pagamento
        if (req.isAdmin) {
            return next();
        }
        
        // Verificar se é o usuário viralatas (acesso vitalício)
        const usuario = await db.obterUsuarioPorId(req.userId);
        if (usuario && usuario.username === 'viralatas') {
            return next();
        }

        // Rotas de trial permitem uso completo do sistema (modo trial)
        // Usuários podem criar, editar e ver itens/categorias mesmo sem pagamento
        if (isRotaTrial) {
            // Verificar acesso, mas não bloquear se não tiver
            const acesso = await db.verificarAcessoAtivo(req.userId);
            if (acesso.temAcesso && acesso.tipo === 'unico') {
                req.acessoUnico = true;
                req.pagamentoUnicoId = acesso.pagamento.id;
            }
            // Permitir acesso mesmo sem pagamento (modo trial)
            return next();
        }

        // Para outras rotas, verificar se o usuário tem acesso ativo
        const acesso = await db.verificarAcessoAtivo(req.userId);

        if (!acesso.temAcesso) {
            return res.status(403).json({ 
                error: 'Acesso negado. É necessário ter uma assinatura ativa ou pagamento único para usar o sistema.',
                codigo: 'PAGAMENTO_REQUERIDO'
            });
        }

        // Se for acesso único, marcar como usado quando salvar dados
        if (acesso.tipo === 'unico') {
            req.acessoUnico = true;
            req.pagamentoUnicoId = acesso.pagamento.id;
        }

        next();
    } catch (error) {
        console.error('Erro ao verificar pagamento:', error);
        return res.status(500).json({ error: 'Erro ao verificar acesso' });
    }
};

// Gerar token JWT
const generateToken = (userId) => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

module.exports = {
    authenticateToken,
    requireAdmin,
    requirePayment,
    generateToken,
    JWT_SECRET
};

