require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'recalculapreco',
    user: process.env.DB_USER || 'fernandocarvalho',
    password: process.env.DB_PASSWORD,
});

async function testarAcesso() {
    try {
        console.log('🔍 Testando acesso ao Modo Estúdio para usuário viralatas...\n');
        
        // Buscar ID do viralatas
        const viralatas = await pool.query(
            'SELECT id, username, is_admin, acesso_especial FROM usuarios WHERE username = $1',
            ['viralatas']
        );
        
        if (viralatas.rows.length === 0) {
            console.log('❌ Usuário viralatas não encontrado');
            await pool.end();
            return;
        }
        
        const usuarioId = viralatas.rows[0].id;
        const isAdmin = viralatas.rows[0].is_admin;
        const acessoEspecial = viralatas.rows[0].acesso_especial;
        
        console.log(`📋 Usuário encontrado:`);
        console.log(`   ID: ${usuarioId}`);
        console.log(`   Username: ${viralatas.rows[0].username}`);
        console.log(`   is_admin: ${isAdmin}`);
        console.log(`   acesso_especial: ${acessoEspecial}\n`);
        
        // Verificar permissões do Modo Estúdio
        const funcaoEspecial = 'modo_estudio';
        
        console.log('🔍 Verificando permissões do Modo Estúdio...\n');
        
        // Verificar "todos"
        const permissaoTodos = await pool.query(`
            SELECT habilitado FROM funcoes_especiais_acesso
            WHERE funcao_especial = $1 AND tipo_acesso = 'todos'
        `, [funcaoEspecial]);
        
        console.log(`📊 Permissão "Todos": ${permissaoTodos.rows.length > 0 ? (permissaoTodos.rows[0].habilitado ? 'HABILITADO' : 'DESABILITADO') : 'NÃO CONFIGURADO'}`);
        
        // Verificar "admin"
        const permissaoAdmin = await pool.query(`
            SELECT habilitado FROM funcoes_especiais_acesso
            WHERE funcao_especial = $1 AND tipo_acesso = 'admin'
        `, [funcaoEspecial]);
        
        const adminHabilitado = permissaoAdmin.rows.length > 0 && permissaoAdmin.rows[0].habilitado;
        console.log(`📊 Permissão "Somente Admin": ${adminHabilitado ? 'HABILITADO' : 'DESABILITADO'}`);
        
        // Verificar "vitalicio"
        const permissaoVitalicio = await pool.query(`
            SELECT habilitado FROM funcoes_especiais_acesso
            WHERE funcao_especial = $1 AND tipo_acesso = 'vitalicio'
        `, [funcaoEspecial]);
        
        console.log(`📊 Permissão "Vitalícios": ${permissaoVitalicio.rows.length > 0 ? (permissaoVitalicio.rows[0].habilitado ? 'HABILITADO' : 'DESABILITADO') : 'NÃO CONFIGURADO'}\n`);
        
        // Simular a lógica de verificação
        console.log('🔄 Simulando verificação de acesso...\n');
        
        // 1. Verificar "todos"
        if (permissaoTodos.rows.length > 0 && permissaoTodos.rows[0].habilitado) {
            console.log('✅ Acesso concedido via "Todos"');
            await pool.end();
            return;
        }
        
        // 2. Verificar "admin"
        if (adminHabilitado) {
            console.log(`   Verificando se é admin...`);
            if (isAdmin) {
                console.log('✅ Acesso concedido via "Somente Admin" (é admin)');
            } else {
                console.log('❌ Acesso NEGADO via "Somente Admin" (não é admin)');
            }
            await pool.end();
            return;
        }
        
        // 3. Verificar "vitalicio"
        if (acessoEspecial === 'vitalicio') {
            if (permissaoVitalicio.rows.length > 0 && permissaoVitalicio.rows[0].habilitado) {
                console.log('✅ Acesso concedido via "Vitalícios"');
            } else {
                console.log('❌ Acesso NEGADO (vitalício mas permissão não habilitada)');
            }
        } else {
            console.log('❌ Acesso NEGADO (não tem acesso vitalício)');
        }
        
        await pool.end();
    } catch (error) {
        console.error('❌ Erro:', error);
        await pool.end();
        process.exit(1);
    }
}

testarAcesso();

