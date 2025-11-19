require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./database');
const { authenticateToken, requireAdmin, generateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rotas da API (ANTES do express.static para evitar conflitos)

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
app.get('/api/itens', authenticateToken, async (req, res) => {
    try {
        const itens = await db.obterTodosItens(req.userId);
        res.json(itens);
    } catch (error) {
        console.error('Erro ao obter itens:', error);
        res.status(500).json({ error: 'Erro ao obter itens' });
    }
});

// Obter itens por categoria
app.get('/api/itens/categoria/:categoria', authenticateToken, async (req, res) => {
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
app.post('/api/itens', authenticateToken, async (req, res) => {
    try {
        const { categoria, nome, valor } = req.body;
        
        if (!categoria || !nome || valor === undefined) {
            return res.status(400).json({ error: 'Categoria, nome e valor são obrigatórios' });
        }
        
        const item = await db.criarItem(categoria, nome, valor, req.userId);
        res.status(201).json(item);
    } catch (error) {
        console.error('Erro ao criar item:', error);
        res.status(500).json({ error: 'Erro ao criar item' });
    }
});

// Atualizar item
app.put('/api/itens/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, valor, valorNovo, categoria } = req.body;
        
        console.log(`[SERVER] PUT /api/itens/${id}`, { nome, valor, valorNovo, categoria });
        
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
app.post('/api/itens/:id/backup', authenticateToken, async (req, res) => {
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
app.delete('/api/itens/:id', authenticateToken, async (req, res) => {
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
app.get('/api/categorias', authenticateToken, async (req, res) => {
    try {
        const categorias = await db.obterCategorias(req.userId);
        res.json(categorias);
    } catch (error) {
        console.error('Erro ao obter categorias:', error);
        res.status(500).json({ error: 'Erro ao obter categorias' });
    }
});

// Resetar valores (restaurar a partir do backup)
app.post('/api/resetar-valores', authenticateToken, async (req, res) => {
    try {
        const itensAtualizados = await db.resetarValores(req.userId);
        res.json({ message: 'Valores resetados com sucesso', itensAtualizados });
    } catch (error) {
        console.error('Erro ao resetar valores:', error);
        res.status(500).json({ error: 'Erro ao resetar valores' });
    }
});

// Atualizar ordem das categorias
app.put('/api/categorias/ordem', authenticateToken, async (req, res) => {
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
app.put('/api/itens/categoria/:categoria/ordem', authenticateToken, async (req, res) => {
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
app.post('/api/categorias', authenticateToken, async (req, res) => {
    try {
        const { nome, icone } = req.body;
        
        if (!nome || nome.trim() === '') {
            return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
        }
        
        const categoria = await db.criarCategoria(nome.trim(), icone || null, req.userId);
        res.status(201).json(categoria);
    } catch (error) {
        console.error('Erro ao criar categoria:', error);
        res.status(500).json({ error: error.message || 'Erro ao criar categoria' });
    }
});

// Renomear categoria
app.put('/api/categorias/:nomeAntigo', authenticateToken, async (req, res) => {
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
app.put('/api/categorias/:nome/icone', authenticateToken, async (req, res) => {
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
app.get('/api/categorias/:nome/icone', authenticateToken, async (req, res) => {
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
app.delete('/api/categorias/:nome', authenticateToken, async (req, res) => {
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

