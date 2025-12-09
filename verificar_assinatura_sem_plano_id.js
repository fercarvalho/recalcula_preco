/**
 * Script para verificar assinaturas sem plano_id
 * 
 * Uso: node verificar_assinatura_sem_plano_id.js
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'calculadora_reajuste',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 5432,
});

async function verificarAssinaturaSemPlanoId() {
    try {
        console.log('🔍 Verificando assinaturas sem plano_id...\n');
        
        const assinaturas = await pool.query(`
            SELECT 
                a.id,
                a.usuario_id,
                a.stripe_subscription_id,
                a.plano_id,
                a.plano_tipo,
                a.status,
                u.username
            FROM assinaturas a
            LEFT JOIN usuarios u ON a.usuario_id = u.id
            WHERE a.plano_id IS NULL
            ORDER BY a.id
        `);
        
        if (assinaturas.rows.length === 0) {
            console.log('✅ Todas as assinaturas têm plano_id ou não precisam (sem stripe_subscription_id).');
            return;
        }
        
        console.log(`📋 Encontradas ${assinaturas.rows.length} assinaturas sem plano_id:\n`);
        
        assinaturas.rows.forEach(assinatura => {
            console.log(`ID: ${assinatura.id} | Usuário: ${assinatura.username || assinatura.usuario_id}`);
            console.log(`   Stripe Subscription ID: ${assinatura.stripe_subscription_id || '(não configurado)'}`);
            console.log(`   Tipo: ${assinatura.plano_tipo} | Status: ${assinatura.status}`);
            
            if (!assinatura.stripe_subscription_id || assinatura.stripe_subscription_id.trim() === '') {
                console.log(`   ℹ️  Esta assinatura não tem stripe_subscription_id, então não precisa de plano_id.`);
            } else {
                console.log(`   ⚠️  Esta assinatura TEM stripe_subscription_id mas NÃO tem plano_id!`);
                console.log(`   💡 Execute o script atualizar_plano_id_assinaturas.js para corrigir.`);
            }
            console.log('');
        });
        
    } catch (error) {
        console.error('❌ Erro ao verificar assinaturas:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Executar script
if (require.main === module) {
    verificarAssinaturaSemPlanoId()
        .then(() => {
            console.log('\n✅ Verificação concluída!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Erro ao executar script:', error);
            process.exit(1);
        });
}

module.exports = { verificarAssinaturaSemPlanoId };

