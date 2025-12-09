require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'recalculapreco',
    user: process.env.DB_USER || 'fernandocarvalho',
    password: process.env.DB_PASSWORD,
});

async function atualizarViralatas() {
    try {
        console.log('🔍 Verificando usuário viralatas...');
        
        // Verificar se o usuário existe
        const result = await pool.query(
            'SELECT id, username, acesso_especial FROM usuarios WHERE username = $1',
            ['viralatas']
        );
        
        if (result.rows.length === 0) {
            console.log('⚠️  Usuário viralatas não encontrado. Criando...');
            const senhaHash = require('bcrypt').hashSync('edulili123', 10);
            await pool.query(
                'INSERT INTO usuarios (username, email, senha_hash, is_admin, acesso_especial) VALUES ($1, $2, $3, $4, $5)',
                ['viralatas', 'viralatas@exemplo.com', senhaHash, false, 'vitalicio']
            );
            console.log('✅ Usuário viralatas criado com acesso vitalício');
        } else {
            const usuario = result.rows[0];
            console.log(`📋 Usuário encontrado: ID ${usuario.id}, acesso_especial: ${usuario.acesso_especial || 'null'}`);
            
            if (usuario.acesso_especial !== 'vitalicio') {
                console.log('🔄 Atualizando acesso_especial para vitalicio...');
                await pool.query(
                    'UPDATE usuarios SET acesso_especial = $1 WHERE username = $2',
                    ['vitalicio', 'viralatas']
                );
                console.log('✅ Acesso vitalício atribuído ao usuário viralatas');
            } else {
                console.log('✅ Usuário viralatas já possui acesso vitalício');
            }
        }
        
        // Verificar novamente para confirmar
        const verificacao = await pool.query(
            'SELECT id, username, acesso_especial FROM usuarios WHERE username = $1',
            ['viralatas']
        );
        
        if (verificacao.rows.length > 0) {
            console.log('\n📊 Resultado final:');
            console.log(`   ID: ${verificacao.rows[0].id}`);
            console.log(`   Username: ${verificacao.rows[0].username}`);
            console.log(`   Acesso Especial: ${verificacao.rows[0].acesso_especial || 'null'}`);
        }
        
        await pool.end();
        console.log('\n✅ Script concluído!');
    } catch (error) {
        console.error('❌ Erro:', error);
        await pool.end();
        process.exit(1);
    }
}

atualizarViralatas();

