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
            next();
        });
    } catch (error) {
        console.error('Erro na autenticação:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Gerar token JWT
const generateToken = (userId) => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

module.exports = {
    authenticateToken,
    generateToken,
    JWT_SECRET
};

