require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Configuração do banco de dados PostgreSQL
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'calculadora_reajuste',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Dados padrão
const dadosPadrao = {
    'HotDogs': [
        { nome: 'Simples', valor: 14.00 },
        { nome: 'Simples picles', valor: 16.00 },
        { nome: 'Calabresa', valor: 20.00 },
        { nome: 'Frango', valor: 20.00 },
        { nome: 'Misto', valor: 22.00 },
        { nome: 'Calabresa acebolada', valor: 22.00 },
        { nome: 'Bacon', valor: 22.00 },
        { nome: 'Queijos', valor: 22.00 },
        { nome: 'Da casa', valor: 23.00 },
        { nome: 'Calabresa com bacon', valor: 23.00 },
        { nome: 'Frango com bacon', valor: 23.00 },
        { nome: 'Brutus', valor: 25.00 },
        { nome: 'Brutus com catupiry', valor: 27.00 },
        { nome: 'Super Brutus', valor: 30.00 }
    ],
    'Lanches': [
        { nome: 'Misto quente', valor: 19.00 },
        { nome: 'X-Burger', valor: 21.00 },
        { nome: 'X-Salada', valor: 22.00 },
        { nome: 'X-Frango', valor: 22.00 },
        { nome: 'X-Calabresa', valor: 24.00 },
        { nome: 'X-Burger duplo', valor: 26.00 },
        { nome: 'X-Egg', valor: 24.00 },
        { nome: 'X-Bacon', valor: 26.00 },
        { nome: 'X-Frango com Bacon', valor: 25.00 },
        { nome: 'X-Tudo', valor: 35.00 }
    ],
    'Bebidas': [
        { nome: 'Água', valor: 3.00 },
        { nome: 'Água com gás', valor: 3.50 },
        { nome: 'Refrigerante lata', valor: 5.00 },
        { nome: 'H20', valor: 6.00 },
        { nome: 'Refrigerante 600Ml', valor: 8.00 },
        { nome: 'Refrigerante 1L vidro', valor: 9.00 },
        { nome: 'Refrigerante 1L descartável', valor: 10.00 },
        { nome: 'Refrigerante 2L descartável', valor: 13.00 },
        { nome: 'Cerveja lata', valor: 5.00 }
    ],
    'Sucos': [
        { nome: 'Laranja', valor: 12.00 },
        { nome: 'Maracujá', valor: 8.00 },
        { nome: 'Acerola', valor: 8.00 },
        { nome: 'Caju', valor: 8.00 },
        { nome: 'Abacaxi', valor: 8.00 },
        { nome: 'Abacaxi com Hortelã', valor: 8.00 },
        { nome: 'Morango', valor: 8.00 }
    ],
    'Complementos': [
        { nome: 'Cebola / Ovo / Salsicha / Picles', valor: 2.00 },
        { nome: 'Purê de Batata / Presunto / Mussarela', valor: 4.00 },
        { nome: 'Catupiry / Cheddar / Calabresa / Frango', valor: 6.00 },
        { nome: 'Bacon / Blend de Queijos', valor: 8.00 },
        { nome: 'Hambúrguer Artesanal', valor: 10.00 }
    ],
    'Personalize seu suco': [
        { nome: 'Adicionar um segundo sabor', valor: 2.00 },
        { nome: 'Substituir a água por leite', valor: 1.50 }
    ]
};

// Função auxiliar para verificar se uma coluna existe
async function colunaExiste(tabela, coluna) {
    const result = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = $2
    `, [tabela, coluna]);
    return result.rows.length > 0;
}

// Inicializar banco de dados
async function inicializar() {
    try {
        // Testar conexão
        await pool.query('SELECT NOW()');
        console.log('Conectado ao banco de dados PostgreSQL');
        
        // Criar tabela de usuários
        await pool.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                senha_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
            
        // Criar tabela itens se não existir
        await pool.query(`
                CREATE TABLE IF NOT EXISTS itens (
                id SERIAL PRIMARY KEY,
                usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
                categoria VARCHAR(255) NOT NULL,
                nome VARCHAR(255) NOT NULL,
                valor NUMERIC(10, 2) NOT NULL,
                valor_novo NUMERIC(10, 2),
                valor_backup NUMERIC(10, 2),
                ordem INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(usuario_id, categoria, nome)
                )
        `);
                
        // Adicionar coluna usuario_id se não existir
        if (!(await colunaExiste('itens', 'usuario_id'))) {
            await pool.query('ALTER TABLE itens ADD COLUMN usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE');
        }
                
        // Adicionar coluna valor_backup se não existir
        if (!(await colunaExiste('itens', 'valor_backup'))) {
            await pool.query('ALTER TABLE itens ADD COLUMN valor_backup NUMERIC(10, 2)');
        }
                
        // Adicionar coluna ordem se não existir
        if (!(await colunaExiste('itens', 'ordem'))) {
            await pool.query('ALTER TABLE itens ADD COLUMN ordem INTEGER');
        }
                
        // Criar tabela de categorias para gerenciar ordem
        await pool.query(`
                    CREATE TABLE IF NOT EXISTS categorias (
                usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
                nome VARCHAR(255) NOT NULL,
                        ordem INTEGER NOT NULL,
                icone VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (usuario_id, nome)
                    )
        `);
        
        // Adicionar coluna usuario_id se não existir
        if (!(await colunaExiste('categorias', 'usuario_id'))) {
            // Primeiro, criar uma tabela temporária com a nova estrutura
            await pool.query(`
                CREATE TABLE IF NOT EXISTS categorias_temp (
                    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
                    nome VARCHAR(255) NOT NULL,
                    ordem INTEGER NOT NULL,
                    icone VARCHAR(100),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (usuario_id, nome)
                )
            `);
            
            // Copiar dados existentes (se houver)
            const categoriasExistentes = await pool.query('SELECT * FROM categorias');
            if (categoriasExistentes.rows.length > 0) {
                // Criar usuário padrão primeiro se não existir
                let usuarioPadrao = await pool.query('SELECT id FROM usuarios WHERE username = $1', ['viralatas']);
                if (usuarioPadrao.rows.length === 0) {
                    const senhaHash = await bcrypt.hash('edulili123', 10);
                    const result = await pool.query(
                        'INSERT INTO usuarios (username, senha_hash) VALUES ($1, $2) RETURNING id',
                        ['viralatas', senhaHash]
                    );
                    usuarioPadrao = result;
                }
                const usuarioId = usuarioPadrao.rows[0].id;
                
                // Copiar categorias para a nova estrutura
                for (const cat of categoriasExistentes.rows) {
                    await pool.query(
                        'INSERT INTO categorias_temp (usuario_id, nome, ordem, icone, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)',
                        [usuarioId, cat.nome, cat.ordem, cat.icone, cat.created_at, cat.updated_at]
                    );
                }
            }
            
            // Remover tabela antiga e renomear
            await pool.query('DROP TABLE IF EXISTS categorias');
            await pool.query('ALTER TABLE categorias_temp RENAME TO categorias');
        }
                
        // Adicionar coluna icone se não existir
        if (!(await colunaExiste('categorias', 'icone'))) {
            await pool.query('ALTER TABLE categorias ADD COLUMN icone VARCHAR(100)');
        }
        
        // Criar usuário padrão viralatas se não existir
        let usuarioPadrao = await pool.query('SELECT id FROM usuarios WHERE username = $1', ['viralatas']);
        if (usuarioPadrao.rows.length === 0) {
            const senhaHash = await bcrypt.hash('edulili123', 10);
            const result = await pool.query(
                'INSERT INTO usuarios (username, senha_hash) VALUES ($1, $2) RETURNING id',
                ['viralatas', senhaHash]
            );
            usuarioPadrao = result;
            console.log('Usuário padrão "viralatas" criado');
        }
        const usuarioId = usuarioPadrao.rows[0].id;
        
        // Migrar dados existentes para o usuário viralatas
        const itensSemUsuario = await pool.query('SELECT COUNT(*) as count FROM itens WHERE usuario_id IS NULL');
        if (parseInt(itensSemUsuario.rows[0].count) > 0) {
            await pool.query('UPDATE itens SET usuario_id = $1 WHERE usuario_id IS NULL', [usuarioId]);
            console.log('Dados existentes migrados para o usuário viralatas');
        }
        
        const categoriasSemUsuario = await pool.query('SELECT COUNT(*) as count FROM categorias WHERE usuario_id IS NULL');
        if (parseInt(categoriasSemUsuario.rows[0].count) > 0) {
            await pool.query('UPDATE categorias SET usuario_id = $1 WHERE usuario_id IS NULL', [usuarioId]);
        }
                
        // Verificar se há dados
        const countResult = await pool.query('SELECT COUNT(*) as count FROM itens WHERE usuario_id = $1', [usuarioId]);
        const count = parseInt(countResult.rows[0].count);
                    
        // Se não houver dados, inserir dados padrão
        if (count === 0) {
            await inserirDadosPadrao(usuarioId);
            console.log('Dados padrão inseridos');
            await inicializarOrdemCategorias(usuarioId);
            await inicializarOrdemItens(usuarioId);
        } else {
            // Inicializar ordem de categorias e itens se necessário
            await inicializarOrdemCategorias(usuarioId);
            await inicializarOrdemItens(usuarioId);
        }
    } catch (error) {
        console.error('Erro ao inicializar banco de dados:', error);
        throw error;
    }
}

// Inserir dados padrão
async function inserirDadosPadrao(usuarioId) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        let ordemPorCategoria = {};
        
        for (const categoria of Object.keys(dadosPadrao)) {
            ordemPorCategoria[categoria] = 0;
            
            for (const item of dadosPadrao[categoria]) {
                const ordem = ordemPorCategoria[categoria]++;
                await client.query(
                    'INSERT INTO itens (usuario_id, categoria, nome, valor, valor_backup, ordem) VALUES ($1, $2, $3, $4, $5, $6)',
                    [usuarioId, categoria, item.nome, item.valor, item.valor, ordem]
                );
            }
        }
        
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

// Inicializar ordem dos itens (para itens que não têm ordem definida)
async function inicializarOrdemItens(usuarioId) {
    try {
        const categoriasResult = await pool.query('SELECT DISTINCT categoria FROM itens WHERE usuario_id = $1', [usuarioId]);
        const categorias = categoriasResult.rows;

        for (const categoriaRow of categorias) {
                const categoria = categoriaRow.categoria;
                
                // Obter todos os itens desta categoria que não têm ordem definida, ordenados por nome
            const itensResult = await pool.query(
                'SELECT id FROM itens WHERE usuario_id = $1 AND categoria = $2 AND (ordem IS NULL OR ordem = 999) ORDER BY nome',
                [usuarioId, categoria]
            );
            const itens = itensResult.rows;
                    
                    // Obter a maior ordem atual para esta categoria
            const maxResult = await pool.query(
                'SELECT MAX(ordem) as maxOrdem FROM itens WHERE usuario_id = $1 AND categoria = $2 AND ordem IS NOT NULL AND ordem != 999',
                [usuarioId, categoria]
            );
            const maxOrdem = maxResult.rows[0]?.maxordem;
            const ordemInicial = (maxOrdem !== null && maxOrdem !== undefined) ? maxOrdem + 1 : 0;
                        
                        // Atualizar a ordem de cada item
            for (let index = 0; index < itens.length; index++) {
                await pool.query(
                    'UPDATE itens SET ordem = $1 WHERE id = $2',
                    [ordemInicial + index, itens[index].id]
                );
                                }
        }
        
                                        console.log('Ordem dos itens inicializada com sucesso');
    } catch (error) {
        console.error('Erro ao inicializar ordem dos itens:', error);
        throw error;
    }
}

// Inicializar ordem das categorias
async function inicializarOrdemCategorias(usuarioId) {
    try {
        // Obter todas as categorias únicas dos itens
        const categoriasResult = await pool.query('SELECT DISTINCT categoria FROM itens WHERE usuario_id = $1', [usuarioId]);
        const categorias = categoriasResult.rows.map(row => row.categoria);
            
            // Verificar quais categorias já têm ordem definida
        const existentesResult = await pool.query('SELECT nome FROM categorias WHERE usuario_id = $1', [usuarioId]);
        const nomesExistentes = new Set(existentesResult.rows.map(c => c.nome));
        const categoriasParaInserir = categorias.filter(cat => !nomesExistentes.has(cat));
                
                if (categoriasParaInserir.length === 0) {
                    return;
                }
                
                // Obter a maior ordem atual
        const maxResult = await pool.query('SELECT MAX(ordem) as maxOrdem FROM categorias WHERE usuario_id = $1', [usuarioId]);
        const maxOrdem = maxResult.rows[0]?.maxordem;
        const ordemInicial = (maxOrdem !== null && maxOrdem !== undefined) ? maxOrdem + 1 : 0;

        // Inserir categorias
        for (let index = 0; index < categoriasParaInserir.length; index++) {
            await pool.query(
                'INSERT INTO categorias (usuario_id, nome, ordem) VALUES ($1, $2, $3)',
                [usuarioId, categoriasParaInserir[index], ordemInicial + index]
            );
        }
    } catch (error) {
        console.error('Erro ao inicializar ordem das categorias:', error);
        throw error;
    }
}

// ========== FUNÇÕES DE AUTENTICAÇÃO ==========

// Verificar credenciais do usuário
async function verificarCredenciais(username, senha) {
    try {
        const result = await pool.query(
            'SELECT id, username, senha_hash FROM usuarios WHERE username = $1',
            [username]
        );
        
        if (result.rows.length === 0) {
            return null;
        }
        
        const usuario = result.rows[0];
        const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
        
        if (!senhaValida) {
            return null;
        }
        
        return {
            id: usuario.id,
            username: usuario.username
        };
    } catch (error) {
        console.error('Erro ao verificar credenciais:', error);
        throw error;
    }
}

// Obter usuário por ID
async function obterUsuarioPorId(id) {
    try {
        const result = await pool.query(
            'SELECT id, username FROM usuarios WHERE id = $1',
            [id]
        );
        
        if (result.rows.length === 0) {
            return null;
        }
        
        return {
            id: result.rows[0].id,
            username: result.rows[0].username
        };
    } catch (error) {
        console.error('Erro ao obter usuário:', error);
        throw error;
    }
}

// Alterar login (username) do usuário
async function alterarLogin(usuarioId, novoLogin, senha) {
    try {
        // Verificar senha atual
        const usuario = await verificarCredenciaisPorId(usuarioId, senha);
        if (!usuario) {
            throw new Error('Senha incorreta');
        }

        // Verificar se o novo login já existe
        const loginExistente = await pool.query(
            'SELECT id FROM usuarios WHERE username = $1 AND id != $2',
            [novoLogin.trim(), usuarioId]
        );

        if (loginExistente.rows.length > 0) {
            throw new Error('Este login já está em uso por outro usuário');
        }

        // Atualizar login
        const result = await pool.query(
            'UPDATE usuarios SET username = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, username',
            [novoLogin.trim(), usuarioId]
        );

        if (result.rows.length === 0) {
            throw new Error('Usuário não encontrado');
        }

        return {
            id: result.rows[0].id,
            username: result.rows[0].username
        };
    } catch (error) {
        console.error('Erro ao alterar login:', error);
        throw error;
    }
}

// Alterar senha do usuário
async function alterarSenha(usuarioId, senhaAtual, novaSenha) {
    try {
        // Verificar senha atual
        const usuario = await verificarCredenciaisPorId(usuarioId, senhaAtual);
        if (!usuario) {
            throw new Error('Senha atual incorreta');
        }

        // Criptografar nova senha
        const novaSenhaHash = await bcrypt.hash(novaSenha, 10);

        // Atualizar senha
        const result = await pool.query(
            'UPDATE usuarios SET senha_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [novaSenhaHash, usuarioId]
        );

        if (result.rowCount === 0) {
            throw new Error('Usuário não encontrado');
        }

        return true;
    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        throw error;
    }
}

// Verificar credenciais por ID (para validação de senha)
async function verificarCredenciaisPorId(usuarioId, senha) {
    try {
        const result = await pool.query(
            'SELECT id, username, senha_hash FROM usuarios WHERE id = $1',
            [usuarioId]
        );
        
        if (result.rows.length === 0) {
            return null;
        }
        
        const usuario = result.rows[0];
        const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
        
        if (!senhaValida) {
            return null;
        }
        
        return {
            id: usuario.id,
            username: usuario.username
        };
    } catch (error) {
        console.error('Erro ao verificar credenciais por ID:', error);
        throw error;
    }
}

// Reiniciar sistema (deletar todos os dados do usuário)
async function reiniciarSistema(usuarioId) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Deletar todos os itens do usuário
        const itensResult = await client.query('DELETE FROM itens WHERE usuario_id = $1', [usuarioId]);
        console.log(`[DB] ${itensResult.rowCount} item(ns) deletado(s)`);

        // Deletar todas as categorias do usuário
        const categoriasResult = await client.query('DELETE FROM categorias WHERE usuario_id = $1', [usuarioId]);
        console.log(`[DB] ${categoriasResult.rowCount} categoria(s) deletada(s)`);

        await client.query('COMMIT');
        console.log(`[DB] Sistema reiniciado para o usuário ${usuarioId}`);
        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao reiniciar sistema:', error);
        throw error;
    } finally {
        client.release();
    }
}

// ========== FUNÇÕES DE ITENS E CATEGORIAS ==========

// Obter todos os itens organizados por categoria (na ordem salva)
async function obterTodosItens(usuarioId) {
    try {
        // Primeiro obter a ordem das categorias
        const categoriasResult = await pool.query(
            'SELECT nome, ordem FROM categorias WHERE usuario_id = $1 ORDER BY CASE WHEN ordem IS NULL THEN 1 ELSE 0 END, ordem, nome',
            [usuarioId]
        );
        const categoriasOrdenadas = categoriasResult.rows;
            
        // Criar mapa de ordem
            const ordemMap = {};
            categoriasOrdenadas.forEach((cat) => {
                ordemMap[cat.nome] = cat.ordem !== null && cat.ordem !== undefined ? cat.ordem : 999;
            });
            
            console.log('Categorias ordenadas do banco:', categoriasOrdenadas.map(c => `${c.nome}:${c.ordem}`));
            console.log('Mapa de ordem criado:', ordemMap);
            
        // Obter todos os itens
        const itensResult = await pool.query(
            'SELECT * FROM itens WHERE usuario_id = $1 ORDER BY categoria, CASE WHEN ordem IS NULL THEN 1 ELSE 0 END, ordem, nome',
            [usuarioId]
        );
        const rows = itensResult.rows;
                
                // Organizar por categoria e atualizar valor_backup se necessário
                const itensPorCategoria = {};
                const promessasAtualizacao = [];
                
        for (const row of rows) {
                    if (!itensPorCategoria[row.categoria]) {
                        itensPorCategoria[row.categoria] = [];
                    }
                    
                    // Se não houver valor_backup, criar com o valor atual
                    if (row.valor_backup === null || row.valor_backup === undefined) {
                        promessasAtualizacao.push(
                    pool.query(
                        'UPDATE itens SET valor_backup = $1 WHERE id = $2 AND usuario_id = $3',
                        [row.valor, row.id, usuarioId]
                    )
                        );
                    }
                    
                    itensPorCategoria[row.categoria].push({
                        id: row.id,
                        nome: row.nome,
                valor: parseFloat(row.valor),
                valorNovo: row.valor_novo ? parseFloat(row.valor_novo) : null,
                valorBackup: row.valor_backup !== null && row.valor_backup !== undefined ? parseFloat(row.valor_backup) : parseFloat(row.valor),
                        ordem: row.ordem !== null && row.ordem !== undefined ? row.ordem : 999
                    });
        }
                
                // Incluir categorias que não têm itens (categorias vazias)
                categoriasOrdenadas.forEach(cat => {
                    if (!itensPorCategoria[cat.nome]) {
                        itensPorCategoria[cat.nome] = [];
                    }
                });
                
                // Ordenar categorias pela ordem salva
                const todasCategorias = new Set([
                    ...Object.keys(itensPorCategoria),
                    ...categoriasOrdenadas.map(cat => cat.nome)
                ]);
                
                const categoriasOrdenadasArray = Array.from(todasCategorias).sort((a, b) => {
                    const ordemA = ordemMap[a] !== undefined ? ordemMap[a] : 999;
                    const ordemB = ordemMap[b] !== undefined ? ordemMap[b] : 999;
                    return ordemA - ordemB;
                });
                
                console.log('Categorias ordenadas para retornar:', categoriasOrdenadasArray);
                
        // Criar objeto ordenado
                const itensPorCategoriaOrdenado = {};
                categoriasOrdenadasArray.forEach(categoria => {
                    itensPorCategoriaOrdenado[categoria] = itensPorCategoria[categoria] || [];
                });
                
                // Aguardar atualizações de backup (mas não bloquear a resposta)
        await Promise.all(promessasAtualizacao).catch(() => {});

        return itensPorCategoriaOrdenado;
    } catch (error) {
        console.error('Erro ao obter todos os itens:', error);
        throw error;
    }
}

// Obter item por ID
async function obterItemPorId(id, usuarioId) {
    try {
        const result = await pool.query('SELECT * FROM itens WHERE id = $1 AND usuario_id = $2', [id, usuarioId]);
        
        if (result.rows.length === 0) {
            return null;
        }
            
        const row = result.rows[0];
        return {
            id: row.id,
            nome: row.nome,
            valor: parseFloat(row.valor),
            valorNovo: row.valor_novo ? parseFloat(row.valor_novo) : null
        };
    } catch (error) {
        console.error('Erro ao obter item por ID:', error);
        throw error;
    }
}

// Obter itens por categoria
async function obterItensPorCategoria(categoria, usuarioId) {
    try {
        const result = await pool.query(
            'SELECT * FROM itens WHERE categoria = $1 AND usuario_id = $2 ORDER BY CASE WHEN ordem IS NULL THEN 1 ELSE 0 END, ordem, nome',
            [categoria, usuarioId]
        );

        return result.rows.map(row => ({
            id: row.id,
            nome: row.nome,
            valor: parseFloat(row.valor),
            valorNovo: row.valor_novo ? parseFloat(row.valor_novo) : null,
            ordem: row.ordem !== null && row.ordem !== undefined ? row.ordem : 999
        }));
    } catch (error) {
        console.error('Erro ao obter itens por categoria:', error);
        throw error;
    }
}

// Criar novo item
async function criarItem(categoria, nome, valor, usuarioId) {
    try {
        // Obter a maior ordem atual para esta categoria
        const maxResult = await pool.query(
            'SELECT MAX(ordem) as maxOrdem FROM itens WHERE categoria = $1 AND usuario_id = $2',
            [categoria, usuarioId]
        );
        const maxOrdem = maxResult.rows[0]?.maxordem;
        const novaOrdem = (maxOrdem !== null && maxOrdem !== undefined) ? maxOrdem + 1 : 0;

        const result = await pool.query(
            'INSERT INTO itens (usuario_id, categoria, nome, valor, valor_backup, ordem) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [usuarioId, categoria, nome, valor, valor, novaOrdem]
        );

        const row = result.rows[0];
        return {
            id: row.id,
            nome: row.nome,
            valor: parseFloat(row.valor),
            valorNovo: row.valor_novo ? parseFloat(row.valor_novo) : null,
            ordem: row.ordem
        };
    } catch (error) {
        console.error('Erro ao criar item:', error);
        throw error;
    }
}

// Atualizar item
async function atualizarItem(id, nome, valor, categoria, usuarioId) {
    try {
        console.log(`[DB] Atualizando item ${id}: nome="${nome}", valor=${valor}, categoria="${categoria}"`);
        
        // Se categoria foi fornecida, precisamos atualizar a categoria e a ordem
        if (categoria !== undefined && categoria !== null) {
            // Primeiro obter o item atual para verificar se a categoria mudou
            const itemAtualResult = await pool.query('SELECT categoria FROM itens WHERE id = $1 AND usuario_id = $2', [id, usuarioId]);
            
            if (itemAtualResult.rows.length === 0) {
                console.error('[DB] Item não encontrado:', id);
                return null;
            }
                
            const categoriaAtual = itemAtualResult.rows[0].categoria;
            const categoriaMudou = categoria.trim() !== categoriaAtual.trim();
                
            console.log(`[DB] Categoria atual: "${categoriaAtual}", nova: "${categoria}", mudou: ${categoriaMudou}`);
                
            if (categoriaMudou) {
                // Se a categoria mudou, obter a maior ordem da nova categoria
                const maxResult = await pool.query(
                    'SELECT MAX(ordem) as maxOrdem FROM itens WHERE categoria = $1 AND usuario_id = $2',
                    [categoria, usuarioId]
                );
                const maxOrdem = maxResult.rows[0]?.maxordem;
                const novaOrdem = (maxOrdem !== null && maxOrdem !== undefined) ? maxOrdem + 1 : 0;
                console.log(`[DB] Nova ordem na categoria "${categoria}": ${novaOrdem}`);
                        
                // Atualizar categoria e ordem
                const updateResult = await pool.query(
                    'UPDATE itens SET nome = $1, valor = $2, categoria = $3, ordem = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 AND usuario_id = $6 RETURNING *',
                    [nome, valor, categoria, novaOrdem, id, usuarioId]
                );

                if (updateResult.rows.length === 0) {
                    return null;
                }
                                
                const row = updateResult.rows[0];
                console.log(`[DB] Item atualizado: categoria="${row.categoria}"`);
                return {
                    id: row.id,
                    nome: row.nome,
                    valor: parseFloat(row.valor),
                    valorNovo: row.valor_novo ? parseFloat(row.valor_novo) : null,
                    categoria: row.categoria
                };
            } else {
                // Categoria não mudou, mas vamos atualizar mesmo assim
                console.log(`[DB] Categoria não mudou, atualizando mesmo assim`);
                const updateResult = await pool.query(
                    'UPDATE itens SET nome = $1, valor = $2, categoria = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 AND usuario_id = $5 RETURNING *',
                    [nome, valor, categoria, id, usuarioId]
                );

                if (updateResult.rows.length === 0) {
                    return null;
                }
                            
                const row = updateResult.rows[0];
                console.log(`[DB] Item retornado: categoria="${row.categoria}"`);
                return {
                    id: row.id,
                    nome: row.nome,
                    valor: parseFloat(row.valor),
                    valorNovo: row.valor_novo ? parseFloat(row.valor_novo) : null,
                    categoria: row.categoria
                };
            }
        } else {
            // Categoria não foi fornecida, atualizar normalmente
            const updateResult = await pool.query(
                'UPDATE itens SET nome = $1, valor = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND usuario_id = $4 RETURNING *',
                [nome, valor, id, usuarioId]
            );

            if (updateResult.rows.length === 0) {
                return null;
            }
                    
            const row = updateResult.rows[0];
            return {
                id: row.id,
                nome: row.nome,
                valor: parseFloat(row.valor),
                valorNovo: row.valor_novo ? parseFloat(row.valor_novo) : null,
                categoria: row.categoria
            };
        }
    } catch (error) {
        console.error('[DB] Erro ao atualizar item:', error);
        throw error;
    }
}

// Deletar item
async function deletarItem(id, usuarioId) {
    try {
        const result = await pool.query('DELETE FROM itens WHERE id = $1 AND usuario_id = $2', [id, usuarioId]);
        return result.rowCount > 0;
    } catch (error) {
        console.error('Erro ao deletar item:', error);
        throw error;
    }
}

// Obter categorias
async function obterCategorias(usuarioId) {
    try {
        const result = await pool.query(
            'SELECT DISTINCT nome FROM categorias WHERE usuario_id = $1 ORDER BY CASE WHEN ordem IS NULL THEN 1 ELSE 0 END, ordem, nome',
            [usuarioId]
        );
        return result.rows.map(row => row.nome);
    } catch (error) {
        console.error('Erro ao obter categorias:', error);
        throw error;
    }
}

// Atualizar valor novo (preço ajustado)
async function atualizarValorNovo(id, valorNovo, usuarioId) {
    try {
        const result = await pool.query(
            'UPDATE itens SET valor_novo = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND usuario_id = $3',
            [valorNovo, id, usuarioId]
        );
        return result.rowCount > 0;
    } catch (error) {
        console.error('Erro ao atualizar valor novo:', error);
        throw error;
    }
}

// Salvar backup do valor antes de aplicar reajuste fixo
async function salvarBackupValor(id, valorBackup, usuarioId) {
    try {
        const result = await pool.query(
            'UPDATE itens SET valor_backup = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND usuario_id = $3',
            [valorBackup, id, usuarioId]
        );
        return result.rowCount > 0;
    } catch (error) {
        console.error('Erro ao salvar backup:', error);
        throw error;
    }
}

// Resetar valores (restaurar valor a partir do backup)
async function resetarValores(usuarioId) {
    try {
        const result = await pool.query(`
            UPDATE itens 
             SET valor = valor_backup, 
                 valor_novo = NULL, 
                 updated_at = CURRENT_TIMESTAMP 
            WHERE valor_backup IS NOT NULL AND usuario_id = $1
        `, [usuarioId]);
        return result.rowCount;
    } catch (error) {
        console.error('Erro ao resetar valores:', error);
        throw error;
    }
}

// Atualizar ordem das categorias
async function atualizarOrdemCategorias(categorias, usuarioId) {
    try {
        if (categorias.length === 0) {
            return;
        }
        
        console.log('=== INICIANDO ATUALIZAÇÃO DE ORDEM ===');
        console.log('Categorias recebidas:', categorias);
        
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Atualizar cada categoria usando INSERT ... ON CONFLICT
            for (let index = 0; index < categorias.length; index++) {
                await client.query(`
                    INSERT INTO categorias (usuario_id, nome, ordem, updated_at) 
                    VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
                    ON CONFLICT (usuario_id, nome) 
                    DO UPDATE SET ordem = $3, updated_at = CURRENT_TIMESTAMP
                `, [usuarioId, categorias[index], index]);
                console.log(`✓ Categoria "${categorias[index]}" -> ordem ${index} (${index + 1}/${categorias.length})`);
            }

            await client.query('COMMIT');
            console.log('=== ORDEM ATUALIZADA COM SUCESSO ===');
            console.log('Ordem final:', categorias.join(' -> '));
                                
            // Verificar se foi salvo corretamente
            const verifyResult = await pool.query('SELECT nome, ordem FROM categorias WHERE usuario_id = $1 ORDER BY ordem', [usuarioId]);
            console.log('Verificação no banco:', verifyResult.rows.map(r => `${r.nome}:${r.ordem}`).join(', '));
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Erro ao atualizar ordem das categorias:', error);
        throw error;
    }
}

// Atualizar ícone da categoria
async function atualizarIconeCategoria(nome, icone, usuarioId) {
    try {
        console.log(`[DB] Atualizando ícone da categoria "${nome}" para "${icone}"`);
        
        const client = await pool.connect();
        try {
            // Verificar se a categoria existe na tabela categorias
            const categoriaExistente = await client.query('SELECT nome FROM categorias WHERE nome = $1 AND usuario_id = $2', [nome, usuarioId]);
            
            if (categoriaExistente.rows.length > 0) {
                // Atualizar o ícone
                await client.query(
                    'UPDATE categorias SET icone = $1, updated_at = CURRENT_TIMESTAMP WHERE nome = $2 AND usuario_id = $3',
                    [icone, nome, usuarioId]
                );
            } else {
                // Se não existe, criar a entrada na tabela categorias
                const ordemResult = await client.query('SELECT MAX(ordem) as maxOrdem FROM categorias WHERE usuario_id = $1', [usuarioId]);
                const maxOrdem = ordemResult.rows[0]?.maxordem;
                const novaOrdem = (maxOrdem !== null && maxOrdem !== undefined) ? maxOrdem + 1 : 0;
                
                await client.query(
                    'INSERT INTO categorias (usuario_id, nome, ordem, icone, updated_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)',
                    [usuarioId, nome, novaOrdem, icone]
                );
            }
            
            console.log(`[DB] Ícone da categoria "${nome}" atualizado com sucesso`);
            return true;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(`[DB] Erro ao atualizar ícone da categoria "${nome}":`, error);
        throw error;
    }
}

// Obter ícone da categoria
async function obterIconeCategoria(nome, usuarioId) {
    try {
        const result = await pool.query('SELECT icone FROM categorias WHERE nome = $1 AND usuario_id = $2', [nome, usuarioId]);
        if (result.rows.length > 0) {
            return result.rows[0].icone || null;
        }
        return null;
    } catch (error) {
        console.error(`[DB] Erro ao obter ícone da categoria "${nome}":`, error);
        return null;
    }
}

// Renomear categoria
async function renomearCategoria(nomeAntigo, nomeNovo, usuarioId) {
    try {
        console.log(`[DB] Renomeando categoria: "${nomeAntigo}" -> "${nomeNovo}"`);
        
        if (nomeAntigo.trim() === nomeNovo.trim()) {
            console.log('[DB] Nome não mudou, nada a fazer');
            return true;
        }
        
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Verificar se a nova categoria já existe
            const categoriaExistente = await client.query('SELECT nome FROM categorias WHERE nome = $1 AND usuario_id = $2', [nomeNovo.trim(), usuarioId]);
            if (categoriaExistente.rows.length > 0) {
                throw new Error('Esta categoria já existe!');
            }
            
            // Atualizar todos os itens com a nova categoria
            const itensResult = await client.query(
                'UPDATE itens SET categoria = $1, updated_at = CURRENT_TIMESTAMP WHERE categoria = $2 AND usuario_id = $3',
                [nomeNovo.trim(), nomeAntigo, usuarioId]
            );
            console.log(`[DB] ${itensResult.rowCount} item(ns) atualizado(s) com a nova categoria`);
            
            // Atualizar a tabela categorias
            const categoriaResult = await client.query(
                'UPDATE categorias SET nome = $1, updated_at = CURRENT_TIMESTAMP WHERE nome = $2 AND usuario_id = $3',
                [nomeNovo.trim(), nomeAntigo, usuarioId]
            );
            
            // Se não havia na tabela categorias, criar
            if (categoriaResult.rowCount === 0) {
                // Obter a ordem atual ou usar a maior ordem + 1
                const ordemResult = await client.query('SELECT MAX(ordem) as maxOrdem FROM categorias WHERE usuario_id = $1', [usuarioId]);
                const maxOrdem = ordemResult.rows[0]?.maxordem;
                const novaOrdem = (maxOrdem !== null && maxOrdem !== undefined) ? maxOrdem + 1 : 0;
                
                await client.query(
                    'INSERT INTO categorias (usuario_id, nome, ordem, updated_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
                    [usuarioId, nomeNovo.trim(), novaOrdem]
                );
                console.log(`[DB] Nova categoria criada na tabela categorias com ordem ${novaOrdem}`);
            }
            
            await client.query('COMMIT');
            console.log(`[DB] Categoria renomeada com sucesso: "${nomeAntigo}" -> "${nomeNovo}"`);
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(`[DB] Erro ao renomear categoria "${nomeAntigo}":`, error);
        throw error;
    }
}

// Deletar categoria e todos os seus itens
async function deletarCategoria(nome, usuarioId) {
    try {
        console.log(`[DB] Iniciando deleção da categoria: "${nome}"`);
        
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Primeiro deletar todos os itens da categoria
            const itensResult = await client.query('DELETE FROM itens WHERE categoria = $1 AND usuario_id = $2', [nome, usuarioId]);
            const itensDeletados = itensResult.rowCount;
            console.log(`[DB] ${itensDeletados} item(ns) deletado(s) da categoria "${nome}"`);
            
            // Depois deletar a categoria (se existir na tabela categorias)
            const categoriaResult = await client.query('DELETE FROM categorias WHERE nome = $1 AND usuario_id = $2', [nome, usuarioId]);
            const categoriaDeletada = categoriaResult.rowCount > 0;
            
            if (categoriaDeletada) {
                console.log(`[DB] Categoria "${nome}" deletada com sucesso da tabela categorias`);
            } else {
                console.log(`[DB] Categoria "${nome}" não existia na tabela categorias, mas itens foram deletados`);
            }
                
            await client.query('COMMIT');
            console.log(`[DB] Deleção da categoria "${nome}" concluída com sucesso`);
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(`[DB] Erro ao deletar categoria "${nome}":`, error);
        throw error;
    }
}

// Atualizar ordem dos itens dentro de uma categoria
async function atualizarOrdemItens(categoria, itensIds, usuarioId) {
    try {
        if (!Array.isArray(itensIds) || itensIds.length === 0) {
            return;
        }
        
        console.log(`=== ATUALIZANDO ORDEM DOS ITENS DA CATEGORIA: ${categoria} ===`);
        console.log('IDs dos itens na ordem:', itensIds);
        
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            for (let index = 0; index < itensIds.length; index++) {
                await client.query(
                    'UPDATE itens SET ordem = $1 WHERE id = $2 AND categoria = $3 AND usuario_id = $4',
                    [index, itensIds[index], categoria, usuarioId]
                );
                console.log(`✓ Item ID ${itensIds[index]} -> ordem ${index} (${index + 1}/${itensIds.length})`);
            }

            await client.query('COMMIT');
            console.log('=== ORDEM DOS ITENS ATUALIZADA COM SUCESSO ===');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Erro ao atualizar ordem dos itens:', error);
        throw error;
    }
}

// Criar nova categoria
async function criarCategoria(nome, icone = null, usuarioId) {
    try {
        // Obter a maior ordem atual
        const maxResult = await pool.query('SELECT MAX(ordem) as maxOrdem FROM categorias WHERE usuario_id = $1', [usuarioId]);
        const maxOrdem = maxResult.rows[0]?.maxordem;
        const novaOrdem = (maxOrdem !== null && maxOrdem !== undefined) ? maxOrdem + 1 : 0;

        try {
            const result = await pool.query(
                'INSERT INTO categorias (usuario_id, nome, ordem, icone) VALUES ($1, $2, $3, $4) RETURNING *',
                [usuarioId, nome, novaOrdem, icone]
            );
            return { nome, ordem: novaOrdem, icone: icone || null };
        } catch (error) {
            // Se já existir, apenas retornar sucesso
            if (error.code === '23505') { // UNIQUE constraint violation
                return { nome, ordem: novaOrdem, icone: icone || null };
            }
            throw error;
        }
    } catch (error) {
        console.error('Erro ao criar categoria:', error);
        throw error;
    }
}

// Fechar conexão
async function fechar() {
    try {
        await pool.end();
                    console.log('Conexão com banco de dados fechada');
    } catch (error) {
        console.error('Erro ao fechar conexão:', error);
        throw error;
                }
}

module.exports = {
    inicializar,
    verificarCredenciais,
    obterUsuarioPorId,
    alterarLogin,
    alterarSenha,
    reiniciarSistema,
    obterTodosItens,
    obterItensPorCategoria,
    obterItemPorId,
    criarItem,
    atualizarItem,
    deletarItem,
    obterCategorias,
    atualizarValorNovo,
    salvarBackupValor,
    resetarValores,
    atualizarOrdemCategorias,
    atualizarOrdemItens,
    criarCategoria,
    renomearCategoria,
    atualizarIconeCategoria,
    obterIconeCategoria,
    deletarCategoria,
    fechar
};
