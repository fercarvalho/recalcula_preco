/**
 * Script para verificar se as assinaturas têm plano_id preenchido
 * 
 * Uso: node verificar_assinaturas_atualizadas.js
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

async function verificarAssinaturas() {
    try {
        console.log('🔍 Verificando assinaturas...\n');
        
        // Buscar todas as assinaturas
        const todasAssinaturas = await pool.query(`
            SELECT 
                a.id,
                a.usuario_id,
                a.stripe_subscription_id,
                a.plano_id,
                a.plano_tipo,
                a.status,
                u.username,
                p.nome as plano_nome
            FROM assinaturas a
            LEFT JOIN usuarios u ON a.usuario_id = u.id
            LEFT JOIN planos p ON a.plano_id = p.id
            ORDER BY a.id
        `);
        
        if (todasAssinaturas.rows.length === 0) {
            console.log('ℹ️  Nenhuma assinatura encontrada no banco de dados.');
            return;
        }
        
        console.log(`📋 Total de assinaturas: ${todasAssinaturas.rows.length}\n`);
        
        // Separar por status
        const comPlanoId = todasAssinaturas.rows.filter(a => a.plano_id !== null);
        const semPlanoId = todasAssinaturas.rows.filter(a => a.plano_id === null && a.stripe_subscription_id !== null);
        
        console.log(`✅ Assinaturas COM plano_id: ${comPlanoId.length}`);
        console.log(`⚠️  Assinaturas SEM plano_id (mas com stripe_subscription_id): ${semPlanoId.length}\n`);
        
        if (comPlanoId.length > 0) {
            console.log('✅ Assinaturas atualizadas:\n');
            comPlanoId.forEach(assinatura => {
                console.log(`   ID: ${assinatura.id} | Usuário: ${assinatura.username || assinatura.usuario_id}`);
                console.log(`   Stripe Subscription: ${assinatura.stripe_subscription_id}`);
                console.log(`   Plano: ${assinatura.plano_nome || 'N/A'} (ID: ${assinatura.plano_id})`);
                console.log(`   Tipo: ${assinatura.plano_tipo} | Status: ${assinatura.status}`);
                console.log('');
            });
        }
        
        if (semPlanoId.length > 0) {
            console.log('⚠️  Assinaturas que ainda precisam ser atualizadas:\n');
            semPlanoId.forEach(assinatura => {
                console.log(`   ID: ${assinatura.id} | Usuário: ${assinatura.username || assinatura.usuario_id}`);
                console.log(`   Stripe Subscription: ${assinatura.stripe_subscription_id}`);
                console.log(`   Tipo: ${assinatura.plano_tipo} | Status: ${assinatura.status}`);
                console.log('');
            });
            
            console.log('💡 Execute o script atualizar_plano_id_assinaturas.js novamente para atualizar essas assinaturas.');
        } else {
            console.log('🎉 Todas as assinaturas com stripe_subscription_id têm plano_id preenchido!');
        }
        
    } catch (error) {
        console.error('❌ Erro ao verificar assinaturas:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Executar script
if (require.main === module) {
    verificarAssinaturas()
        .then(() => {
            console.log('\n✅ Verificação concluída!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Erro ao executar script:', error);
            process.exit(1);
        });
}

module.exports = { verificarAssinaturas };

