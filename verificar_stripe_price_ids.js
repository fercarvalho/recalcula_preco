/**
 * Script para verificar se os stripe_price_id dos planos estão configurados
 * 
 * Uso: node verificar_stripe_price_ids.js
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

async function verificarStripePriceIds() {
    try {
        console.log('🔍 Verificando stripe_price_id dos planos...\n');
        
        const planos = await pool.query(`
            SELECT id, nome, tipo, ativo, stripe_price_id 
            FROM planos 
            ORDER BY tipo, id
        `);
        
        if (planos.rows.length === 0) {
            console.log('❌ Nenhum plano encontrado no banco de dados.');
            return;
        }
        
        console.log(`📋 Total de planos: ${planos.rows.length}\n`);
        
        let configurados = 0;
        let naoConfigurados = 0;
        
        planos.rows.forEach((plano, index) => {
            console.log(`${index + 1}. ID: ${plano.id} | Nome: ${plano.nome} | Tipo: ${plano.tipo} | Ativo: ${plano.ativo ? 'Sim' : 'Não'}`);
            
            if (plano.stripe_price_id && plano.stripe_price_id.trim() !== '') {
                console.log(`   ✅ Stripe Price ID: ${plano.stripe_price_id}`);
                configurados++;
            } else {
                console.log(`   ⚠️  Stripe Price ID: (não configurado)`);
                naoConfigurados++;
            }
            console.log('');
        });
        
        console.log('📊 Resumo:');
        console.log(`   ✅ Configurados: ${configurados}`);
        console.log(`   ⚠️  Não configurados: ${naoConfigurados}`);
        console.log(`   📋 Total: ${planos.rows.length}\n`);
        
        if (naoConfigurados === 0) {
            console.log('🎉 Todos os planos têm stripe_price_id configurado!');
        } else {
            console.log('⚠️  Alguns planos ainda precisam ter stripe_price_id configurado.');
            console.log('💡 Configure via painel admin ou execute SQL diretamente.');
        }
        
    } catch (error) {
        console.error('❌ Erro ao verificar planos:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Executar script
if (require.main === module) {
    verificarStripePriceIds()
        .then(() => {
            console.log('\n✅ Verificação concluída!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Erro ao executar script:', error);
            process.exit(1);
        });
}

module.exports = { verificarStripePriceIds };

