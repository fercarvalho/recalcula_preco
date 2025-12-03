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
                email VARCHAR(255) NOT NULL,
                senha_hash VARCHAR(255) NOT NULL,
                is_admin BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Adicionar coluna is_admin se não existir
        if (!(await colunaExiste('usuarios', 'is_admin'))) {
            await pool.query('ALTER TABLE usuarios ADD COLUMN is_admin BOOLEAN DEFAULT FALSE');
        }
        
        // Remover constraint de unicidade do email se existir (permitir emails duplicados)
        try {
            await pool.query('ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_email_unique');
        } catch (error) {
            // Ignorar erro se a constraint não existir
        }
        
        // Adicionar coluna tutorial_completed se não existir
        if (!(await colunaExiste('usuarios', 'tutorial_completed'))) {
            await pool.query('ALTER TABLE usuarios ADD COLUMN tutorial_completed BOOLEAN DEFAULT FALSE');
        }
        
        // Adicionar coluna email se não existir
        if (!(await colunaExiste('usuarios', 'email'))) {
            await pool.query('ALTER TABLE usuarios ADD COLUMN email VARCHAR(255)');
            // Atualizar emails dos usuários padrão primeiro
            await pool.query(`UPDATE usuarios SET email = 'admin@exemplo.com' WHERE username = 'admin' AND (email IS NULL OR email = '')`);
            await pool.query(`UPDATE usuarios SET email = 'viralatas@exemplo.com' WHERE username = 'viralatas' AND (email IS NULL OR email = '')`);
            // Para outros usuários sem email, gerar um email temporário baseado no username
            const usuariosSemEmail = await pool.query('SELECT id, username FROM usuarios WHERE email IS NULL OR email = \'\'');
            for (const usuario of usuariosSemEmail.rows) {
                const emailTemp = `${usuario.username}@temp.local`;
                await pool.query('UPDATE usuarios SET email = $1 WHERE id = $2', [emailTemp, usuario.id]);
            }
            // Tornar email obrigatório
            await pool.query('ALTER TABLE usuarios ALTER COLUMN email SET NOT NULL');
            // Remover constraint de unicidade se existir (caso tenha sido adicionada anteriormente)
            try {
                await pool.query('ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_email_unique');
            } catch (error) {
                // Ignorar erro se a constraint não existir
            }
        }
            
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
        
        // Verificar e corrigir constraint UNIQUE se necessário
        // A constraint antiga pode ser apenas (categoria, nome) sem usuario_id
        try {
            // Verificar se existe constraint antiga sem usuario_id
            const constraintAntiga = await pool.query(`
                SELECT constraint_name 
                FROM information_schema.table_constraints 
                WHERE table_name = 'itens' 
                AND constraint_name = 'itens_categoria_nome_key'
            `);
            
            if (constraintAntiga.rows.length > 0) {
                console.log('[DB] Constraint antiga encontrada (sem usuario_id). Removendo...');
                // Remover constraint antiga
                await pool.query('ALTER TABLE itens DROP CONSTRAINT IF EXISTS itens_categoria_nome_key');
                // Criar constraint correta com usuario_id
                await pool.query(`
                    ALTER TABLE itens 
                    ADD CONSTRAINT itens_usuario_categoria_nome_unique 
                    UNIQUE (usuario_id, categoria, nome)
                `);
                console.log('[DB] Constraint corrigida! Agora inclui usuario_id.');
            } else {
                // Verificar se a constraint correta já existe
                const constraintCorreta = await pool.query(`
                    SELECT constraint_name 
                    FROM information_schema.table_constraints 
                    WHERE table_name = 'itens' 
                    AND constraint_name = 'itens_usuario_categoria_nome_unique'
                `);
                
                if (constraintCorreta.rows.length === 0) {
                    // Criar constraint correta
                    await pool.query(`
                        ALTER TABLE itens 
                        ADD CONSTRAINT itens_usuario_categoria_nome_unique 
                        UNIQUE (usuario_id, categoria, nome)
                    `);
                    console.log('[DB] Constraint UNIQUE criada com usuario_id.');
                } else {
                    console.log('[DB] Constraint UNIQUE correta já existe.');
                }
            }
        } catch (error) {
            // Se houver erro, apenas logar mas não bloquear inicialização
            if (error.code === '42710') { // duplicate_object
                console.log('[DB] Constraint já existe (ok)');
            } else {
                console.warn('[DB] Aviso ao verificar/criar constraint UNIQUE (continuando):', error.message);
            }
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
        
        // Criar tabela de tokens de recuperação de senha
        await pool.query(`
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id SERIAL PRIMARY KEY,
                usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
                token VARCHAR(255) UNIQUE NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                used BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Criar índice para busca rápida por token
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token 
            ON password_reset_tokens(token)
        `);
        
        // Limpar tokens expirados periodicamente (executar na inicialização)
        await pool.query(`
            DELETE FROM password_reset_tokens 
            WHERE expires_at < NOW() OR used = TRUE
        `);
        
        // Criar tabela de assinaturas Stripe
        await pool.query(`
            CREATE TABLE IF NOT EXISTS assinaturas (
                id SERIAL PRIMARY KEY,
                usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
                stripe_subscription_id VARCHAR(255) UNIQUE,
                stripe_customer_id VARCHAR(255),
                plano_tipo VARCHAR(50) NOT NULL, -- 'anual' ou 'unico'
                status VARCHAR(50) NOT NULL, -- 'active', 'canceled', 'past_due', 'trialing', etc.
                current_period_start TIMESTAMP,
                current_period_end TIMESTAMP,
                cancel_at_period_end BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Criar índice para busca rápida por usuario_id
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_assinaturas_usuario_id 
            ON assinaturas(usuario_id)
        `);
        
        // Criar índice para busca rápida por stripe_subscription_id
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_assinaturas_stripe_subscription_id 
            ON assinaturas(stripe_subscription_id)
        `);
        
        // Criar tabela de pagamentos únicos
        await pool.query(`
            CREATE TABLE IF NOT EXISTS pagamentos_unicos (
                id SERIAL PRIMARY KEY,
                usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
                stripe_payment_intent_id VARCHAR(255) UNIQUE,
                stripe_customer_id VARCHAR(255),
                valor NUMERIC(10, 2) NOT NULL,
                status VARCHAR(50) NOT NULL, -- 'succeeded', 'pending', 'failed', etc.
                usado BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Criar índice para busca rápida por usuario_id
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_pagamentos_unicos_usuario_id 
            ON pagamentos_unicos(usuario_id)
        `);
        
        // Criar tabela de plataformas
        await pool.query(`
            CREATE TABLE IF NOT EXISTS plataformas (
                id SERIAL PRIMARY KEY,
                usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
                nome VARCHAR(255) NOT NULL,
                taxa NUMERIC(10, 2) NOT NULL,
                ordem INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(usuario_id, nome)
            )
        `);

        // Criar tabela de funções da landing page
        await pool.query(`
            CREATE TABLE IF NOT EXISTS funcoes (
                id SERIAL PRIMARY KEY,
                titulo VARCHAR(255) NOT NULL,
                descricao TEXT NOT NULL,
                icone VARCHAR(100),
                icone_upload TEXT,
                ativa BOOLEAN DEFAULT TRUE,
                eh_ia BOOLEAN DEFAULT FALSE,
                ordem INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Criar índice para busca rápida por usuario_id
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_plataformas_usuario_id 
            ON plataformas(usuario_id)
        `);
        
        // Criar usuário admin padrão se não existir
        let adminPadrao = await pool.query('SELECT id FROM usuarios WHERE username = $1', ['admin']);
        if (adminPadrao.rows.length === 0) {
            const senhaHashAdmin = await bcrypt.hash('admin123', 10);
            const resultAdmin = await pool.query(
                'INSERT INTO usuarios (username, email, senha_hash, is_admin) VALUES ($1, $2, $3, $4) RETURNING id',
                ['admin', 'admin@exemplo.com', senhaHashAdmin, true]
            );
            adminPadrao = resultAdmin;
            console.log('Usuário admin padrão "admin" criado (senha: admin123, email: admin@exemplo.com)');
        } else {
            // Garantir que o admin existente tenha is_admin = true e email
            await pool.query('UPDATE usuarios SET is_admin = true WHERE username = $1', ['admin']);
            // Atualizar email do admin se não tiver
            const adminAtual = await pool.query('SELECT email FROM usuarios WHERE username = $1', ['admin']);
            if (!adminAtual.rows[0]?.email) {
                await pool.query('UPDATE usuarios SET email = $1 WHERE username = $2', ['admin@exemplo.com', 'admin']);
            }
        }
        
        // Criar usuário padrão viralatas se não existir
        let usuarioPadrao = await pool.query('SELECT id FROM usuarios WHERE username = $1', ['viralatas']);
        if (usuarioPadrao.rows.length === 0) {
            const senhaHash = await bcrypt.hash('edulili123', 10);
            const result = await pool.query(
                'INSERT INTO usuarios (username, email, senha_hash, is_admin) VALUES ($1, $2, $3, $4) RETURNING id',
                ['viralatas', 'viralatas@exemplo.com', senhaHash, false]
            );
            usuarioPadrao = result;
            console.log('Usuário padrão "viralatas" criado (email: viralatas@exemplo.com)');
        } else {
            // Atualizar email do viralatas se não tiver
            const viralatasAtual = await pool.query('SELECT email FROM usuarios WHERE username = $1', ['viralatas']);
            if (!viralatasAtual.rows[0]?.email) {
                await pool.query('UPDATE usuarios SET email = $1 WHERE username = $2', ['viralatas@exemplo.com', 'viralatas']);
            }
        }
        const usuarioId = usuarioPadrao.rows[0].id;
        
        // Criar assinatura anual para o usuário viralatas
        try {
            const assinaturaExistente = await pool.query(
                'SELECT id FROM assinaturas WHERE usuario_id = $1',
                [usuarioId]
            );
            
            if (assinaturaExistente.rows.length === 0) {
                // Criar assinatura anual ativa (sem Stripe, para uso interno)
                const dataInicio = new Date();
                const dataFim = new Date();
                dataFim.setFullYear(dataFim.getFullYear() + 1); // 1 ano a partir de agora
                
                await criarOuAtualizarAssinatura(usuarioId, {
                    stripe_subscription_id: null,
                    stripe_customer_id: null,
                    plano_tipo: 'anual',
                    status: 'active',
                    current_period_start: dataInicio,
                    current_period_end: dataFim,
                    cancel_at_period_end: false,
                });
                console.log('✅ Assinatura anual criada para o usuário "viralatas"');
            } else {
                // Verificar se a assinatura está ativa, se não, atualizar para ativa
                const assinatura = await pool.query(
                    'SELECT status, current_period_end FROM assinaturas WHERE usuario_id = $1',
                    [usuarioId]
                );
                
                if (assinatura.rows.length > 0) {
                    const assinaturaAtual = assinatura.rows[0];
                    const dataFim = new Date(assinaturaAtual.current_period_end || new Date());
                    const agora = new Date();
                    
                    // Se a assinatura expirou ou não está ativa, renovar por mais 1 ano
                    if (assinaturaAtual.status !== 'active' || dataFim < agora) {
                        const novaDataFim = new Date();
                        novaDataFim.setFullYear(novaDataFim.getFullYear() + 1);
                        
                        await criarOuAtualizarAssinatura(usuarioId, {
                            stripe_subscription_id: null,
                            stripe_customer_id: null,
                            plano_tipo: 'anual',
                            status: 'active',
                            current_period_start: agora,
                            current_period_end: novaDataFim,
                            cancel_at_period_end: false,
                        });
                        console.log('✅ Assinatura anual renovada para o usuário "viralatas"');
                    }
                }
            }
        } catch (error) {
            console.error('⚠️  Erro ao criar/atualizar assinatura do viralatas:', error.message);
            // Não bloquear a inicialização se houver erro na assinatura
        }
        
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

// Verificar credenciais do usuário (aceita username ou email)
async function verificarCredenciais(identificador, senha) {
    try {
        // Detectar se é email (contém @) ou username
        const isEmail = identificador.includes('@');
        
        let result;
        if (isEmail) {
            // Buscar por email (pode haver múltiplos usuários com o mesmo email)
            result = await pool.query(
                'SELECT id, username, email, senha_hash, is_admin FROM usuarios WHERE email = $1',
                [identificador.trim().toLowerCase()]
            );
        } else {
            // Buscar por username (único)
            result = await pool.query(
                'SELECT id, username, email, senha_hash, is_admin FROM usuarios WHERE username = $1',
                [identificador.trim()]
            );
        }
        
        if (result.rows.length === 0) {
            return null;
        }
        
        // Se for email e houver múltiplos usuários, verificar a senha de cada um
        // até encontrar o correto (combinação email + senha)
        if (isEmail && result.rows.length > 1) {
            for (const usuario of result.rows) {
                const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
                if (senhaValida) {
                    return {
                        id: usuario.id,
                        username: usuario.username,
                        email: usuario.email,
                        is_admin: usuario.is_admin || false
                    };
                }
            }
            // Nenhuma senha correspondeu
            return null;
        } else {
            // Username (único) ou email (único resultado)
            const usuario = result.rows[0];
            const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
            
            if (!senhaValida) {
                return null;
            }
            
            return {
                id: usuario.id,
                username: usuario.username,
                email: usuario.email,
                is_admin: usuario.is_admin || false
            };
        }
    } catch (error) {
        console.error('Erro ao verificar credenciais:', error);
        throw error;
    }
}

// Obter usuário por ID
async function obterUsuarioPorId(id) {
    try {
        const result = await pool.query(
            'SELECT id, username, email, is_admin, tutorial_completed FROM usuarios WHERE id = $1',
            [id]
        );
        
        if (result.rows.length === 0) {
            return null;
        }
        
        return {
            id: result.rows[0].id,
            username: result.rows[0].username,
            email: result.rows[0].email,
            is_admin: result.rows[0].is_admin || false,
            tutorial_completed: result.rows[0].tutorial_completed || false
        };
    } catch (error) {
        console.error('Erro ao obter usuário:', error);
        throw error;
    }
}

// Verificar se tutorial foi completado
async function verificarTutorialCompleto(usuarioId) {
    try {
        const result = await pool.query(
            'SELECT tutorial_completed FROM usuarios WHERE id = $1',
            [usuarioId]
        );
        
        if (result.rows.length === 0) {
            return false;
        }
        
        return result.rows[0].tutorial_completed || false;
    } catch (error) {
        console.error('Erro ao verificar tutorial completo:', error);
        return false; // Em caso de erro, retornar false para mostrar tutorial
    }
}

// Marcar tutorial como completo
async function marcarTutorialCompleto(usuarioId) {
    try {
        await pool.query(
            'UPDATE usuarios SET tutorial_completed = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
            [usuarioId]
        );
        return true;
    } catch (error) {
        console.error('Erro ao marcar tutorial como completo:', error);
        throw error;
    }
}

// Limpar flag de tutorial completo (para re-exibir)
async function limparTutorialCompleto(usuarioId) {
    try {
        await pool.query(
            'UPDATE usuarios SET tutorial_completed = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
            [usuarioId]
        );
        return true;
    } catch (error) {
        console.error('Erro ao limpar tutorial completo:', error);
        throw error;
    }
}

// Listar todos os usuários (apenas para admin)
async function listarUsuarios() {
    try {
        const result = await pool.query(
            'SELECT id, username, email, is_admin, created_at FROM usuarios ORDER BY created_at DESC'
        );
        
        return result.rows.map(row => ({
            id: row.id,
            username: row.username,
            email: row.email,
            is_admin: row.is_admin || false,
            created_at: row.created_at
        }));
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        throw error;
    }
}

// Atualizar usuário (apenas para admin)
async function atualizarUsuario(usuarioId, novoUsername, novoEmail, novaSenha, isAdmin) {
    try {
        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (novoUsername) {
            // Verificar se o novo username já existe
            const existente = await pool.query(
                'SELECT id FROM usuarios WHERE username = $1 AND id != $2',
                [novoUsername.trim(), usuarioId]
            );
            if (existente.rows.length > 0) {
                throw new Error('Este nome de usuário já está em uso');
            }
            updates.push(`username = $${paramIndex++}`);
            values.push(novoUsername.trim());
        }

        if (novoEmail) {
            // Validar formato do email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(novoEmail.trim())) {
                throw new Error('Email inválido');
            }
            updates.push(`email = $${paramIndex++}`);
            values.push(novoEmail.trim().toLowerCase());
        }

        if (novaSenha) {
            if (novaSenha.length < 6) {
                throw new Error('A senha deve ter pelo menos 6 caracteres');
            }
            const senhaHash = await bcrypt.hash(novaSenha, 10);
            updates.push(`senha_hash = $${paramIndex++}`);
            values.push(senhaHash);
        }

        if (isAdmin !== undefined) {
            updates.push(`is_admin = $${paramIndex++}`);
            values.push(isAdmin);
        }

        if (updates.length === 0) {
            throw new Error('Nenhuma alteração especificada');
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(usuarioId);

        const query = `UPDATE usuarios SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, username, email, is_admin`;
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            throw new Error('Usuário não encontrado');
        }

        return {
            id: result.rows[0].id,
            username: result.rows[0].username,
            email: result.rows[0].email,
            is_admin: result.rows[0].is_admin || false
        };
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        throw error;
    }
}

// Deletar usuário (apenas para admin)
async function deletarUsuario(usuarioId) {
    try {
        const result = await pool.query('DELETE FROM usuarios WHERE id = $1 RETURNING id, username', [usuarioId]);
        
        if (result.rows.length === 0) {
            throw new Error('Usuário não encontrado');
        }

        return {
            id: result.rows[0].id,
            username: result.rows[0].username
        };
    } catch (error) {
        console.error('Erro ao deletar usuário:', error);
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

// Alterar email do usuário
async function alterarEmail(usuarioId, novoEmail, senha) {
    try {
        // Verificar senha atual
        const usuario = await verificarCredenciaisPorId(usuarioId, senha);
        if (!usuario) {
            throw new Error('Senha incorreta');
        }

        // Validar email
        if (!novoEmail || !novoEmail.trim()) {
            throw new Error('O email é obrigatório');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(novoEmail.trim())) {
            throw new Error('Email inválido');
        }

        // Atualizar email
        const result = await pool.query(
            'UPDATE usuarios SET email = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email',
            [novoEmail.trim().toLowerCase(), usuarioId]
        );

        if (result.rows.length === 0) {
            throw new Error('Usuário não encontrado');
        }

        return {
            id: result.rows[0].id,
            email: result.rows[0].email
        };
    } catch (error) {
        console.error('Erro ao alterar email:', error);
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

// Criar novo usuário
async function criarUsuario(username, email, senha) {
    try {
        // Verificar se o username já existe
        const usuarioExistente = await pool.query(
            'SELECT id FROM usuarios WHERE username = $1',
            [username.trim()]
        );

        if (usuarioExistente.rows.length > 0) {
            throw new Error('Este nome de usuário já está em uso');
        }

        // Validar username
        if (username.trim().length < 3) {
            throw new Error('O nome de usuário deve ter pelo menos 3 caracteres');
        }

        // Validar email
        if (!email || !email.trim()) {
            throw new Error('O email é obrigatório');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            throw new Error('Email inválido');
        }

        // Validar senha
        if (!senha || senha.length < 6) {
            throw new Error('A senha é obrigatória e deve ter pelo menos 6 caracteres');
        }

        // Criptografar senha
        const senhaHash = await bcrypt.hash(senha, 10);

        // Criar usuário
        const result = await pool.query(
            'INSERT INTO usuarios (username, email, senha_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
            [username.trim(), email.trim().toLowerCase(), senhaHash]
        );

        return {
            id: result.rows[0].id,
            username: result.rows[0].username,
            email: result.rows[0].email
        };
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
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
        // Normalizar nome e categoria (apenas trim)
        const nomeNormalizado = nome.trim();
        const categoriaNormalizada = categoria.trim();
        
        // Garantir que usuarioId é um número
        const userId = parseInt(usuarioId);
        if (isNaN(userId)) {
            throw new Error('ID do usuário inválido');
        }
        
        console.log('[DB] Criar item:', { 
            userId, 
            categoriaNormalizada, 
            nomeNormalizado, 
            valor
        });
        
        // REMOVIDA verificação prévia de duplicata
        // A constraint UNIQUE do banco (usuario_id, categoria, nome) já garante que não haverá duplicatas
        // para o mesmo usuário. Diferentes usuários podem ter itens com o mesmo nome na mesma categoria.
        // Deixar o banco de dados fazer a validação através da constraint é mais confiável.

        // Obter a maior ordem atual para esta categoria
        const maxResult = await pool.query(
            'SELECT MAX(ordem) as maxOrdem FROM itens WHERE categoria = $1 AND usuario_id = $2',
            [categoriaNormalizada, userId]
        );
        const maxOrdem = maxResult.rows[0]?.maxordem;
        const novaOrdem = (maxOrdem !== null && maxOrdem !== undefined) ? maxOrdem + 1 : 0;

        // Verificar se já existe um item com o mesmo nome na mesma categoria PARA ESTE USUÁRIO
        // Isso evita erro de constraint e permite mensagem mais clara
        const checkDuplicate = await pool.query(
            'SELECT id FROM itens WHERE usuario_id = $1 AND categoria = $2 AND nome = $3',
            [userId, categoriaNormalizada, nomeNormalizado]
        );
        
        if (checkDuplicate.rows.length > 0) {
            const erro = new Error(`Já existe um item com o nome "${nomeNormalizado}" na categoria "${categoriaNormalizada}".`);
            erro.code = 'ITEM_DUPLICADO';
            throw erro;
        }
        
        // Tentar inserir - a constraint UNIQUE do banco vai validar como backup
        const result = await pool.query(
            'INSERT INTO itens (usuario_id, categoria, nome, valor, valor_backup, ordem) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [userId, categoriaNormalizada, nomeNormalizado, valor, valor, novaOrdem]
        );

        const row = result.rows[0];
        console.log('[DB] Item criado com sucesso:', { id: row.id, usuario_id: row.usuario_id });
        
        return {
            id: row.id,
            nome: row.nome,
            valor: parseFloat(row.valor),
            valorNovo: row.valor_novo ? parseFloat(row.valor_novo) : null,
            ordem: row.ordem
        };
    } catch (error) {
        console.error('========== ERRO NO DATABASE - CRIAR ITEM ==========');
        console.error('Erro completo:', error);
        console.error('Stack:', error.stack);
        
        // Se for erro de constraint UNIQUE do PostgreSQL (código 23505)
        if (error.code === '23505') {
            console.error('[DB] Erro de constraint UNIQUE - item duplicado:', {
                constraint: error.constraint,
                detail: error.detail,
                table: error.table
            });
            
            // Verificar se a constraint é de itens
            if (error.constraint && (error.constraint.includes('itens') || error.table === 'itens')) {
                // Se a constraint não inclui usuario_id, é um problema - precisamos corrigir
                if (error.constraint === 'itens_categoria_nome_key') {
                    const erro = new Error('A constraint do banco de dados está incorreta. Por favor, contate o administrador.');
                    erro.code = 'CONSTRAINT_INCORRETA';
                    erro.constraint = error.constraint;
                    erro.detail = 'A constraint atual não inclui usuario_id, impedindo que diferentes usuários tenham itens com o mesmo nome.';
                    throw erro;
                }
                
                const erro = new Error(`Já existe um item com o nome "${nomeNormalizado}" na categoria "${categoriaNormalizada}".`);
                erro.code = 'ITEM_DUPLICADO';
                erro.constraint = error.constraint;
                erro.detail = error.detail;
                throw erro;
            }
        }
        
        console.error('Detalhes do erro:', {
            code: error.code,
            message: error.message,
            constraint: error.constraint,
            detail: error.detail,
            table: error.table
        });
        console.error('==================================================');
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
            'SELECT nome, ordem FROM categorias WHERE usuario_id = $1 ORDER BY CASE WHEN ordem IS NULL THEN 1 ELSE 0 END, ordem, nome',
            [usuarioId]
        );
        // Remover duplicatas mantendo a ordem
        const categoriasUnicas = [];
        const categoriasVistas = new Set();
        result.rows.forEach(row => {
            if (!categoriasVistas.has(row.nome)) {
                categoriasUnicas.push(row.nome);
                categoriasVistas.add(row.nome);
            }
        });
        return categoriasUnicas;
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

// ========== FUNÇÕES DE RECUPERAÇÃO DE SENHA ==========

// Obter usuários por email (pode haver múltiplos)
async function obterUsuariosPorEmail(email) {
    try {
        const result = await pool.query(
            'SELECT id, username, email FROM usuarios WHERE email = $1',
            [email.trim().toLowerCase()]
        );
        
        return result.rows;
    } catch (error) {
        console.error('Erro ao obter usuários por email:', error);
        throw error;
    }
}

// Obter usuário por username (único)
async function obterUsuarioPorUsername(username) {
    try {
        const result = await pool.query(
            'SELECT id, username, email FROM usuarios WHERE username = $1',
            [username.trim()]
        );
        
        if (result.rows.length === 0) {
            return null;
        }
        
        return result.rows[0];
    } catch (error) {
        console.error('Erro ao obter usuário por username:', error);
        throw error;
    }
}

// Criar token de recuperação de senha
async function criarTokenRecuperacao(usuarioId) {
    try {
        const crypto = require('crypto');
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1); // Token expira em 1 hora
        
        // Invalidar tokens anteriores do usuário
        await pool.query(
            'UPDATE password_reset_tokens SET used = TRUE WHERE usuario_id = $1 AND used = FALSE',
            [usuarioId]
        );
        
        // Criar novo token
        const result = await pool.query(
            'INSERT INTO password_reset_tokens (usuario_id, token, expires_at) VALUES ($1, $2, $3) RETURNING token, expires_at',
            [usuarioId, token, expiresAt]
        );
        
        return {
            token: result.rows[0].token,
            expiresAt: result.rows[0].expires_at
        };
    } catch (error) {
        console.error('Erro ao criar token de recuperação:', error);
        throw error;
    }
}

// Validar token de recuperação de senha
async function validarTokenRecuperacao(token) {
    try {
        const result = await pool.query(
            `SELECT prt.usuario_id, prt.expires_at, prt.used, u.username, u.email
             FROM password_reset_tokens prt
             JOIN usuarios u ON prt.usuario_id = u.id
             WHERE prt.token = $1 AND prt.used = FALSE AND prt.expires_at > NOW()`,
            [token]
        );
        
        if (result.rows.length === 0) {
            return null;
        }
        
        return {
            usuarioId: result.rows[0].usuario_id,
            username: result.rows[0].username,
            email: result.rows[0].email,
            expiresAt: result.rows[0].expires_at
        };
    } catch (error) {
        console.error('Erro ao validar token de recuperação:', error);
        throw error;
    }
}

// Marcar token como usado
async function marcarTokenComoUsado(token) {
    try {
        await pool.query(
            'UPDATE password_reset_tokens SET used = TRUE WHERE token = $1',
            [token]
        );
    } catch (error) {
        console.error('Erro ao marcar token como usado:', error);
        throw error;
    }
}

// Resetar senha usando token
async function resetarSenhaComToken(token, novaSenha) {
    try {
        // Validar token
        const tokenValido = await validarTokenRecuperacao(token);
        if (!tokenValido) {
            throw new Error('Token inválido ou expirado');
        }
        
        // Validar senha
        if (!novaSenha || novaSenha.length < 6) {
            throw new Error('A senha deve ter pelo menos 6 caracteres');
        }
        
        // Criptografar nova senha
        const novaSenhaHash = await bcrypt.hash(novaSenha, 10);
        
        // Atualizar senha
        await pool.query(
            'UPDATE usuarios SET senha_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [novaSenhaHash, tokenValido.usuarioId]
        );
        
        // Marcar token como usado
        await marcarTokenComoUsado(token);
        
        return {
            id: tokenValido.usuarioId,
            username: tokenValido.username,
            email: tokenValido.email
        };
    } catch (error) {
        console.error('Erro ao resetar senha:', error);
        throw error;
    }
}

// ========== FUNÇÕES DE ASSINATURAS E PAGAMENTOS ==========

// Criar ou atualizar assinatura
async function criarOuAtualizarAssinatura(usuarioId, dadosAssinatura) {
    try {
        const {
            stripe_subscription_id,
            stripe_customer_id,
            plano_tipo,
            status,
            current_period_start,
            current_period_end,
            cancel_at_period_end
        } = dadosAssinatura;

        // Verificar se já existe assinatura para este usuário
        const existente = await pool.query(
            'SELECT id FROM assinaturas WHERE usuario_id = $1',
            [usuarioId]
        );

        if (existente.rows.length > 0) {
            // Atualizar assinatura existente
            const result = await pool.query(`
                UPDATE assinaturas 
                SET stripe_subscription_id = $1,
                    stripe_customer_id = $2,
                    plano_tipo = $3,
                    status = $4,
                    current_period_start = $5,
                    current_period_end = $6,
                    cancel_at_period_end = $7,
                    updated_at = CURRENT_TIMESTAMP
                WHERE usuario_id = $8
                RETURNING *
            `, [
                stripe_subscription_id,
                stripe_customer_id,
                plano_tipo,
                status,
                current_period_start,
                current_period_end,
                cancel_at_period_end || false,
                usuarioId
            ]);

            return result.rows[0];
        } else {
            // Criar nova assinatura
            const result = await pool.query(`
                INSERT INTO assinaturas (
                    usuario_id, stripe_subscription_id, stripe_customer_id,
                    plano_tipo, status, current_period_start, current_period_end,
                    cancel_at_period_end
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `, [
                usuarioId,
                stripe_subscription_id,
                stripe_customer_id,
                plano_tipo,
                status,
                current_period_start,
                current_period_end,
                cancel_at_period_end || false
            ]);

            return result.rows[0];
        }
    } catch (error) {
        console.error('Erro ao criar/atualizar assinatura:', error);
        throw error;
    }
}

// Obter assinatura do usuário
async function obterAssinatura(usuarioId) {
    try {
        const result = await pool.query(
            'SELECT * FROM assinaturas WHERE usuario_id = $1',
            [usuarioId]
        );

        if (result.rows.length === 0) {
            return null;
        }

        return result.rows[0];
    } catch (error) {
        console.error('Erro ao obter assinatura:', error);
        throw error;
    }
}

// Verificar se usuário tem acesso ativo
async function verificarAcessoAtivo(usuarioId) {
    try {
        // Verificar se é o usuário viralatas (acesso vitalício)
        const usuarioViralatas = await pool.query(
            'SELECT id, username FROM usuarios WHERE id = $1 AND username = $2',
            [usuarioId, 'viralatas']
        );
        
        if (usuarioViralatas.rows.length > 0) {
            // Usuário viralatas tem acesso vitalício
            return {
                temAcesso: true,
                tipo: 'vitalicio',
                assinatura: null
            };
        }
        
        // Verificar assinatura anual ativa
        const assinatura = await pool.query(`
            SELECT * FROM assinaturas 
            WHERE usuario_id = $1 
            AND plano_tipo = 'anual'
            AND status IN ('active', 'trialing')
            AND (current_period_end IS NULL OR current_period_end > NOW())
        `, [usuarioId]);

        if (assinatura.rows.length > 0) {
            return {
                temAcesso: true,
                tipo: 'anual',
                assinatura: assinatura.rows[0]
            };
        }

        // Verificar pagamento único não usado e não expirado (24 horas)
        const pagamentoUnico = await pool.query(`
            SELECT * FROM pagamentos_unicos 
            WHERE usuario_id = $1 
            AND status = 'succeeded'
            AND usado = FALSE
            AND created_at > NOW() - INTERVAL '24 hours'
        `, [usuarioId]);

        if (pagamentoUnico.rows.length > 0) {
            return {
                temAcesso: true,
                tipo: 'unico',
                pagamento: pagamentoUnico.rows[0]
            };
        }

        return {
            temAcesso: false,
            tipo: null
        };
    } catch (error) {
        console.error('Erro ao verificar acesso:', error);
        throw error;
    }
}

// Criar pagamento único
async function criarPagamentoUnico(usuarioId, dadosPagamento) {
    try {
        const {
            stripe_payment_intent_id,
            stripe_customer_id,
            valor,
            status
        } = dadosPagamento;

        const result = await pool.query(`
            INSERT INTO pagamentos_unicos (
                usuario_id, stripe_payment_intent_id, stripe_customer_id,
                valor, status
            ) VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [
            usuarioId,
            stripe_payment_intent_id,
            stripe_customer_id,
            valor,
            status
        ]);

        return result.rows[0];
    } catch (error) {
        console.error('Erro ao criar pagamento único:', error);
        throw error;
    }
}

// Atualizar status do pagamento único
async function atualizarPagamentoUnico(stripe_payment_intent_id, status) {
    try {
        const result = await pool.query(`
            UPDATE pagamentos_unicos 
            SET status = $1, updated_at = CURRENT_TIMESTAMP
            WHERE stripe_payment_intent_id = $2
            RETURNING *
        `, [status, stripe_payment_intent_id]);

        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        console.error('Erro ao atualizar pagamento único:', error);
        throw error;
    }
}

// Marcar pagamento único como usado
async function marcarPagamentoUnicoComoUsado(usuarioId) {
    try {
        const result = await pool.query(`
            UPDATE pagamentos_unicos 
            SET usado = TRUE, updated_at = CURRENT_TIMESTAMP
            WHERE usuario_id = $1 
            AND status = 'succeeded'
            AND usado = FALSE
            RETURNING *
        `, [usuarioId]);

        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        console.error('Erro ao marcar pagamento como usado:', error);
        throw error;
    }
}

// Obter assinatura por stripe_subscription_id
async function obterAssinaturaPorStripeId(stripe_subscription_id) {
    try {
        const result = await pool.query(
            'SELECT * FROM assinaturas WHERE stripe_subscription_id = $1',
            [stripe_subscription_id]
        );

        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        console.error('Erro ao obter assinatura por Stripe ID:', error);
        throw error;
    }
}

// ========== FUNÇÕES DE PLATAFORMAS ==========

// Obter todas as plataformas de um usuário
async function obterPlataformas(usuarioId) {
    try {
        const result = await pool.query(
            'SELECT id, nome, taxa, ordem FROM plataformas WHERE usuario_id = $1 ORDER BY CASE WHEN ordem IS NULL THEN 1 ELSE 0 END, ordem, nome',
            [usuarioId]
        );
        return result.rows.map(row => ({
            id: row.id,
            nome: row.nome,
            taxa: parseFloat(row.taxa),
            ordem: row.ordem !== null && row.ordem !== undefined ? row.ordem : 999
        }));
    } catch (error) {
        console.error('Erro ao obter plataformas:', error);
        throw error;
    }
}

// Criar nova plataforma
async function criarPlataforma(usuarioId, nome, taxa) {
    try {
        const result = await pool.query(
            'INSERT INTO plataformas (usuario_id, nome, taxa) VALUES ($1, $2, $3) RETURNING id, nome, taxa',
            [usuarioId, nome.trim(), taxa]
        );
        const row = result.rows[0];
        return {
            id: row.id,
            nome: row.nome,
            taxa: parseFloat(row.taxa)
        };
    } catch (error) {
        if (error.code === '23505') { // unique_violation
            throw new Error('Já existe uma plataforma com este nome');
        }
        console.error('Erro ao criar plataforma:', error);
        throw error;
    }
}

// Atualizar plataforma
async function atualizarPlataforma(usuarioId, id, nome, taxa) {
    try {
        const result = await pool.query(
            'UPDATE plataformas SET nome = $1, taxa = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND usuario_id = $4 RETURNING id, nome, taxa',
            [nome.trim(), taxa, id, usuarioId]
        );
        if (result.rows.length === 0) {
            return null;
        }
        const row = result.rows[0];
        return {
            id: row.id,
            nome: row.nome,
            taxa: parseFloat(row.taxa)
        };
    } catch (error) {
        if (error.code === '23505') { // unique_violation
            throw new Error('Já existe uma plataforma com este nome');
        }
        console.error('Erro ao atualizar plataforma:', error);
        throw error;
    }
}

// Deletar plataforma
async function deletarPlataforma(usuarioId, id) {
    try {
        const result = await pool.query(
            'DELETE FROM plataformas WHERE id = $1 AND usuario_id = $2',
            [id, usuarioId]
        );
        return result.rowCount > 0;
    } catch (error) {
        console.error('Erro ao deletar plataforma:', error);
        throw error;
    }
}

// Atualizar ordem das plataformas
async function atualizarOrdemPlataformas(usuarioId, plataformasIds) {
    try {
        // Usar transação para garantir consistência
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            for (let i = 0; i < plataformasIds.length; i++) {
                await client.query(
                    'UPDATE plataformas SET ordem = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND usuario_id = $3',
                    [i, plataformasIds[i], usuarioId]
                );
            }
            
            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Erro ao atualizar ordem das plataformas:', error);
        throw error;
    }
}

// ========== FUNÇÕES DE FUNÇÕES DA LANDING PAGE ==========

// Obter todas as funções
async function obterFuncoes() {
    try {
        const result = await pool.query(
            'SELECT * FROM funcoes ORDER BY ordem, id'
        );
        return result.rows.map(row => ({
            id: row.id,
            titulo: row.titulo,
            descricao: row.descricao,
            icone: row.icone,
            icone_upload: row.icone_upload,
            ativa: row.ativa,
            eh_ia: row.eh_ia,
            ordem: row.ordem
        }));
    } catch (error) {
        console.error('Erro ao obter funções:', error);
        throw error;
    }
}

// Criar função
async function criarFuncao(titulo, descricao, icone, icone_upload, ativa, eh_ia, ordem) {
    try {
        const result = await pool.query(
            `INSERT INTO funcoes (titulo, descricao, icone, icone_upload, ativa, eh_ia, ordem, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             RETURNING *`,
            [titulo, descricao, icone || null, icone_upload || null, ativa, eh_ia, ordem || 0]
        );
        const row = result.rows[0];
        return {
            id: row.id,
            titulo: row.titulo,
            descricao: row.descricao,
            icone: row.icone,
            icone_upload: row.icone_upload,
            ativa: row.ativa,
            eh_ia: row.eh_ia,
            ordem: row.ordem
        };
    } catch (error) {
        console.error('Erro ao criar função:', error);
        throw error;
    }
}

// Atualizar função
async function atualizarFuncao(id, titulo, descricao, icone, icone_upload, ativa, eh_ia, ordem) {
    try {
        const result = await pool.query(
            `UPDATE funcoes 
             SET titulo = $1, descricao = $2, icone = $3, icone_upload = $4, ativa = $5, eh_ia = $6, ordem = $7, updated_at = CURRENT_TIMESTAMP
             WHERE id = $8
             RETURNING *`,
            [titulo, descricao, icone || null, icone_upload || null, ativa, eh_ia, ordem || 0, id]
        );
        if (result.rows.length === 0) {
            return null;
        }
        const row = result.rows[0];
        return {
            id: row.id,
            titulo: row.titulo,
            descricao: row.descricao,
            icone: row.icone,
            icone_upload: row.icone_upload,
            ativa: row.ativa,
            eh_ia: row.eh_ia,
            ordem: row.ordem
        };
    } catch (error) {
        console.error('Erro ao atualizar função:', error);
        throw error;
    }
}

// Deletar função
async function deletarFuncao(id) {
    try {
        const result = await pool.query(
            'DELETE FROM funcoes WHERE id = $1',
            [id]
        );
        return result.rowCount > 0;
    } catch (error) {
        console.error('Erro ao deletar função:', error);
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
    criarUsuario,
    alterarLogin,
    alterarSenha,
    alterarEmail,
    reiniciarSistema,
    listarUsuarios,
    atualizarUsuario,
    deletarUsuario,
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
    obterUsuariosPorEmail,
    obterUsuarioPorUsername,
    criarTokenRecuperacao,
    validarTokenRecuperacao,
    resetarSenhaComToken,
    criarOuAtualizarAssinatura,
    obterAssinatura,
    verificarAcessoAtivo,
    criarPagamentoUnico,
    atualizarPagamentoUnico,
    marcarPagamentoUnicoComoUsado,
    obterAssinaturaPorStripeId,
    // Funções de plataformas
    obterPlataformas,
    criarPlataforma,
    atualizarPlataforma,
    deletarPlataforma,
    atualizarOrdemPlataformas,
    // Funções de tutorial
    verificarTutorialCompleto,
    marcarTutorialCompleto,
    limparTutorialCompleto,
    // Funções de funções da landing page
    obterFuncoes,
    criarFuncao,
    atualizarFuncao,
    deletarFuncao,
    fechar
};
