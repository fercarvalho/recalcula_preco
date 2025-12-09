/**
 * Script para verificar e atualizar stripe_price_id dos planos
 * 
 * Este script lista todos os planos e seus stripe_price_id,
 * e permite atualizar manualmente se necessário.
 * 
 * Uso: node verificar_planos_stripe.js
 */

require('dotenv').config();
const { Pool } = require('pg');
const readline = require('readline');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'calculadora_reajuste',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 5432,
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function listarPlanos() {
    try {
        console.log('\n📋 Planos cadastrados no banco de dados:\n');
        
        const planos = await pool.query(`
            SELECT id, nome, tipo, ativo, stripe_price_id 
            FROM planos 
            ORDER BY tipo, id
        `);
        
        if (planos.rows.length === 0) {
            console.log('❌ Nenhum plano encontrado no banco de dados.');
            return [];
        }
        
        planos.rows.forEach((plano, index) => {
            console.log(`${index + 1}. ID: ${plano.id} | Nome: ${plano.nome} | Tipo: ${plano.tipo} | Ativo: ${plano.ativo ? 'Sim' : 'Não'}`);
            console.log(`   Stripe Price ID: ${plano.stripe_price_id || '(não configurado)'}`);
            console.log('');
        });
        
        return planos.rows;
    } catch (error) {
        console.error('❌ Erro ao listar planos:', error);
        throw error;
    }
}

async function atualizarStripePriceId(planoId, novoPriceId) {
    try {
        await pool.query(`
            UPDATE planos 
            SET stripe_price_id = $1 
            WHERE id = $2
        `, [novoPriceId, planoId]);
        
        console.log(`✅ Plano ${planoId} atualizado com stripe_price_id: ${novoPriceId}`);
    } catch (error) {
        console.error('❌ Erro ao atualizar plano:', error);
        throw error;
    }
}

async function verificarAssinaturaStripe() {
    try {
        console.log('\n🔍 Assinaturas sem plano_id:\n');
        
        const assinaturas = await pool.query(`
            SELECT id, usuario_id, stripe_subscription_id 
            FROM assinaturas 
            WHERE plano_id IS NULL 
            AND stripe_subscription_id IS NOT NULL
        `);
        
        if (assinaturas.rows.length === 0) {
            console.log('✅ Todas as assinaturas já têm plano_id configurado.');
            return;
        }
        
        const stripeService = require('./services/stripe');
        
        for (const assinatura of assinaturas.rows) {
            try {
                console.log(`\n📋 Assinatura: ${assinatura.stripe_subscription_id}`);
                
                if (!stripeService.stripe) {
                    console.log('⚠️  Stripe não está configurado.');
                    continue;
                }
                
                const subscription = await stripeService.obterAssinaturaStripe(assinatura.stripe_subscription_id);
                
                if (!subscription || !subscription.items || subscription.items.data.length === 0) {
                    console.log('⚠️  Assinatura não encontrada no Stripe ou sem items');
                    continue;
                }
                
                const priceId = subscription.items.data[0].price.id;
                console.log(`   Price ID no Stripe: ${priceId}`);
                
                // Verificar se existe plano com esse price_id
                const plano = await pool.query(
                    'SELECT id, nome FROM planos WHERE stripe_price_id = $1',
                    [priceId]
                );
                
                if (plano.rows.length > 0) {
                    console.log(`   ✅ Plano encontrado: ID ${plano.rows[0].id} - ${plano.rows[0].nome}`);
                } else {
                    console.log(`   ❌ Nenhum plano encontrado com esse stripe_price_id`);
                    console.log(`   💡 Você precisa atualizar o stripe_price_id de um plano para: ${priceId}`);
                }
                
            } catch (error) {
                console.error(`❌ Erro ao processar assinatura ${assinatura.stripe_subscription_id}:`, error.message);
            }
        }
        
    } catch (error) {
        console.error('❌ Erro ao verificar assinaturas:', error);
        throw error;
    }
}

async function main() {
    try {
        console.log('🔍 Verificando planos e assinaturas...\n');
        
        // Listar planos
        const planos = await listarPlanos();
        
        // Verificar assinaturas
        await verificarAssinaturaStripe();
        
        // Perguntar se deseja atualizar algum plano
        if (planos.length > 0) {
            console.log('\n💡 Para atualizar o stripe_price_id de um plano, você pode:');
            console.log('   1. Usar o painel admin do sistema');
            console.log('   2. Executar SQL diretamente:');
            console.log('      UPDATE planos SET stripe_price_id = \'price_xxx\' WHERE id = X;');
            console.log('\n   O price_id que precisa ser configurado está mostrado acima.');
        }
        
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await pool.end();
        rl.close();
    }
}

// Executar script
if (require.main === module) {
    main()
        .then(() => {
            console.log('\n✅ Verificação concluída!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Erro ao executar script:', error);
            process.exit(1);
        });
}

module.exports = { listarPlanos, atualizarStripePriceId, verificarAssinaturaStripe };

