require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rotas da API (ANTES do express.static para evitar conflitos)

// Obter todos os itens
app.get('/api/itens', async (req, res) => {
    try {
        const itens = await db.obterTodosItens();
        res.json(itens);
    } catch (error) {
        console.error('Erro ao obter itens:', error);
        res.status(500).json({ error: 'Erro ao obter itens' });
    }
});

// Obter itens por categoria
app.get('/api/itens/categoria/:categoria', async (req, res) => {
    try {
        const { categoria } = req.params;
        const itens = await db.obterItensPorCategoria(categoria);
        res.json(itens);
    } catch (error) {
        console.error('Erro ao obter itens por categoria:', error);
        res.status(500).json({ error: 'Erro ao obter itens por categoria' });
    }
});

// Criar novo item
app.post('/api/itens', async (req, res) => {
    try {
        const { categoria, nome, valor } = req.body;
        
        if (!categoria || !nome || valor === undefined) {
            return res.status(400).json({ error: 'Categoria, nome e valor são obrigatórios' });
        }
        
        const item = await db.criarItem(categoria, nome, valor);
        res.status(201).json(item);
    } catch (error) {
        console.error('Erro ao criar item:', error);
        res.status(500).json({ error: 'Erro ao criar item' });
    }
});

// Atualizar item
app.put('/api/itens/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, valor, valorNovo, categoria } = req.body;
        
        console.log(`[SERVER] PUT /api/itens/${id}`, { nome, valor, valorNovo, categoria });
        
        // Se valorNovo foi enviado, atualizar apenas ele
        if (valorNovo !== undefined && nome === undefined && valor === undefined && categoria === undefined) {
            const sucesso = await db.atualizarValorNovo(id, valorNovo);
            if (!sucesso) {
                return res.status(404).json({ error: 'Item não encontrado' });
            }
            const item = await db.obterItemPorId(id);
            return res.json(item);
        }
        
        // Caso contrário, atualizar nome, valor e/ou categoria
        console.log(`[SERVER] Chamando db.atualizarItem(${id}, "${nome}", ${valor}, "${categoria}")`);
        const item = await db.atualizarItem(id, nome, valor, categoria);
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
app.post('/api/itens/:id/backup', async (req, res) => {
    try {
        const { id } = req.params;
        const { valorBackup } = req.body;
        
        if (valorBackup === undefined) {
            return res.status(400).json({ error: 'valorBackup é obrigatório' });
        }
        
        const sucesso = await db.salvarBackupValor(id, valorBackup);
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
app.delete('/api/itens/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const sucesso = await db.deletarItem(id);
        
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
app.get('/api/categorias', async (req, res) => {
    try {
        const categorias = await db.obterCategorias();
        res.json(categorias);
    } catch (error) {
        console.error('Erro ao obter categorias:', error);
        res.status(500).json({ error: 'Erro ao obter categorias' });
    }
});

// Resetar valores (restaurar a partir do backup)
app.post('/api/resetar-valores', async (req, res) => {
    try {
        const itensAtualizados = await db.resetarValores();
        res.json({ message: 'Valores resetados com sucesso', itensAtualizados });
    } catch (error) {
        console.error('Erro ao resetar valores:', error);
        res.status(500).json({ error: 'Erro ao resetar valores' });
    }
});

// Atualizar ordem das categorias
app.put('/api/categorias/ordem', async (req, res) => {
    try {
        const { categorias } = req.body;
        
        if (!Array.isArray(categorias)) {
            return res.status(400).json({ error: 'categorias deve ser um array' });
        }
        
        await db.atualizarOrdemCategorias(categorias);
        res.json({ message: 'Ordem das categorias atualizada com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar ordem das categorias:', error);
        res.status(500).json({ error: 'Erro ao atualizar ordem das categorias' });
    }
});

// Atualizar ordem dos itens dentro de uma categoria
app.put('/api/itens/categoria/:categoria/ordem', async (req, res) => {
    try {
        const { categoria } = req.params;
        const { itensIds } = req.body;
        
        if (!Array.isArray(itensIds)) {
            return res.status(400).json({ error: 'itensIds deve ser um array' });
        }
        
        await db.atualizarOrdemItens(categoria, itensIds);
        res.json({ message: 'Ordem dos itens atualizada com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar ordem dos itens:', error);
        res.status(500).json({ error: 'Erro ao atualizar ordem dos itens' });
    }
});

// Criar nova categoria
app.post('/api/categorias', async (req, res) => {
    try {
        const { nome } = req.body;
        
        if (!nome || nome.trim() === '') {
            return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
        }
        
        const categoria = await db.criarCategoria(nome.trim());
        res.status(201).json(categoria);
    } catch (error) {
        console.error('Erro ao criar categoria:', error);
        res.status(500).json({ error: 'Erro ao criar categoria' });
    }
});

// Deletar categoria
app.delete('/api/categorias/:nome', async (req, res) => {
    try {
        const { nome } = req.params;
        const categoriaNome = decodeURIComponent(nome);
        
        console.log(`Tentando deletar categoria: "${categoriaNome}"`);
        
        await db.deletarCategoria(categoriaNome);
        
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

