/**
 * Script para atualizar plano_id das assinaturas antigas
 * 
 * Este script busca todas as assinaturas que não têm plano_id preenchido,
 * consulta o Stripe para obter o price_id da assinatura,
 * e atualiza o plano_id no banco de dados.
 * 
 * Uso: node atualizar_plano_id_assinaturas.js
 */

require('dotenv').config();
const { Pool } = require('pg');
const stripeService = require('./services/stripe');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'calculadora_reajuste',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 5432,
});

async function obterPlanoPorStripePriceId(stripePriceId) {
    try {
        const result = await pool.query('SELECT id FROM planos WHERE stripe_price_id = $1', [stripePriceId]);
        if (result.rows.length === 0) {
            return null;
        }
        return result.rows[0].id;
    } catch (error) {
        console.error('Erro ao obter plano por Stripe Price ID:', error);
        throw error;
    }
}

async function atualizarPlanoIdAssinaturas() {
    try {
        console.log('🔍 Buscando assinaturas sem plano_id...');
        
        // Buscar todas as assinaturas sem plano_id
        const assinaturas = await pool.query(`
            SELECT id, usuario_id, stripe_subscription_id 
            FROM assinaturas 
            WHERE plano_id IS NULL 
            AND stripe_subscription_id IS NOT NULL
        `);
        
        console.log(`📋 Encontradas ${assinaturas.rows.length} assinaturas para atualizar`);
        
        if (assinaturas.rows.length === 0) {
            console.log('✅ Nenhuma assinatura precisa ser atualizada!');
            return;
        }
        
        let atualizadas = 0;
        let erros = 0;
        
        for (const assinatura of assinaturas.rows) {
            try {
                console.log(`\n🔄 Processando assinatura ${assinatura.stripe_subscription_id}...`);
                
                // Buscar detalhes da assinatura no Stripe
                if (!stripeService.stripe) {
                    throw new Error('Stripe não está configurado');
                }
                const subscription = await stripeService.obterAssinaturaStripe(assinatura.stripe_subscription_id);
                
                if (!subscription || !subscription.items || subscription.items.data.length === 0) {
                    console.log(`⚠️  Assinatura ${assinatura.stripe_subscription_id} não encontrada no Stripe ou sem items`);
                    erros++;
                    continue;
                }
                
                // Obter price_id da primeira linha item (geralmente há apenas uma)
                const priceId = subscription.items.data[0].price.id;
                console.log(`   Price ID: ${priceId}`);
                
                // Buscar plano_id correspondente
                const planoId = await obterPlanoPorStripePriceId(priceId);
                
                if (!planoId) {
                    console.log(`⚠️  Plano não encontrado para price_id ${priceId}`);
                    erros++;
                    continue;
                }
                
                console.log(`   Plano ID encontrado: ${planoId}`);
                
                // Atualizar assinatura
                await pool.query(`
                    UPDATE assinaturas 
                    SET plano_id = $1 
                    WHERE id = $2
                `, [planoId, assinatura.id]);
                
                console.log(`✅ Assinatura ${assinatura.stripe_subscription_id} atualizada com plano_id ${planoId}`);
                atualizadas++;
                
            } catch (error) {
                console.error(`❌ Erro ao processar assinatura ${assinatura.stripe_subscription_id}:`, error.message);
                erros++;
            }
        }
        
        console.log(`\n📊 Resumo:`);
        console.log(`   ✅ Atualizadas: ${atualizadas}`);
        console.log(`   ❌ Erros: ${erros}`);
        console.log(`   📋 Total: ${assinaturas.rows.length}`);
        
    } catch (error) {
        console.error('❌ Erro ao atualizar plano_id das assinaturas:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Executar script
if (require.main === module) {
    atualizarPlanoIdAssinaturas()
        .then(() => {
            console.log('\n✅ Script concluído!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Erro ao executar script:', error);
            process.exit(1);
        });
}

module.exports = { atualizarPlanoIdAssinaturas };

