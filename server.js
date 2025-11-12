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
app.use(express.static(__dirname));

// Rotas da API

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
        const { nome, valor, valorNovo } = req.body;
        
        // Se valorNovo foi enviado, atualizar apenas ele
        if (valorNovo !== undefined && nome === undefined && valor === undefined) {
            const sucesso = await db.atualizarValorNovo(id, valorNovo);
            if (!sucesso) {
                return res.status(404).json({ error: 'Item não encontrado' });
            }
            const item = await db.obterItemPorId(id);
            return res.json(item);
        }
        
        // Caso contrário, atualizar nome e/ou valor
        const item = await db.atualizarItem(id, nome, valor);
        if (!item) {
            return res.status(404).json({ error: 'Item não encontrado' });
        }
        
        res.json(item);
    } catch (error) {
        console.error('Erro ao atualizar item:', error);
        res.status(500).json({ error: 'Erro ao atualizar item' });
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

// Servir o arquivo HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
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

