/**
 * Script para atualizar plano_id dos pagamentos únicos antigos
 * 
 * Este script busca todos os pagamentos únicos que não têm plano_id preenchido,
 * consulta o Stripe para obter o price_id do pagamento,
 * e atualiza o plano_id no banco de dados.
 * 
 * Uso: node atualizar_plano_id_pagamentos_unicos.js
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

async function atualizarPlanoIdPagamentosUnicos() {
    try {
        console.log('🔍 Buscando pagamentos únicos sem plano_id...');
        
        // Buscar todos os pagamentos únicos sem plano_id
        const pagamentos = await pool.query(`
            SELECT id, usuario_id, stripe_payment_intent_id 
            FROM pagamentos_unicos 
            WHERE plano_id IS NULL 
            AND stripe_payment_intent_id IS NOT NULL
            AND status = 'succeeded'
        `);
        
        console.log(`📋 Encontrados ${pagamentos.rows.length} pagamentos únicos para atualizar`);
        
        if (pagamentos.rows.length === 0) {
            console.log('✅ Nenhum pagamento único precisa ser atualizado!');
            return;
        }
        
        if (!stripeService.stripe) {
            console.error('❌ Stripe não está configurado. Verifique STRIPE_SECRET_KEY no arquivo .env');
            return;
        }
        
        let atualizados = 0;
        let erros = 0;
        
        for (const pagamento of pagamentos.rows) {
            try {
                console.log(`\n🔄 Processando pagamento único ${pagamento.stripe_payment_intent_id}...`);
                
                // Buscar detalhes do payment intent no Stripe
                const paymentIntent = await stripeService.stripe.paymentIntents.retrieve(pagamento.stripe_payment_intent_id);
                
                if (!paymentIntent) {
                    console.log(`⚠️  Payment Intent ${pagamento.stripe_payment_intent_id} não encontrado no Stripe`);
                    erros++;
                    continue;
                }
                
                // Tentar obter price_id de diferentes formas
                let priceId = null;
                
                // 1. Tentar obter do metadata do payment intent
                if (paymentIntent.metadata && paymentIntent.metadata.plano_id) {
                    // Se já tem plano_id no metadata, usar diretamente
                    const planoId = parseInt(paymentIntent.metadata.plano_id);
                    if (planoId) {
                        console.log(`   Plano ID encontrado no metadata: ${planoId}`);
                        await pool.query(`
                            UPDATE pagamentos_unicos 
                            SET plano_id = $1 
                            WHERE id = $2
                        `, [planoId, pagamento.id]);
                        console.log(`✅ Pagamento único ${pagamento.stripe_payment_intent_id} atualizado com plano_id ${planoId}`);
                        atualizados++;
                        continue;
                    }
                }
                
                // 2. Tentar obter do invoice (se houver)
                if (paymentIntent.invoice) {
                    try {
                        const invoice = await stripeService.stripe.invoices.retrieve(paymentIntent.invoice);
                        if (invoice.lines && invoice.lines.data && invoice.lines.data.length > 0) {
                            priceId = invoice.lines.data[0].price?.id;
                        }
                    } catch (invoiceError) {
                        // Ignorar erro se não conseguir buscar invoice
                    }
                }
                
                // 3. Tentar obter do checkout session (se houver)
                if (!priceId && paymentIntent.metadata && paymentIntent.metadata.checkout_session_id) {
                    try {
                        const session = await stripeService.stripe.checkout.sessions.retrieve(
                            paymentIntent.metadata.checkout_session_id
                        );
                        if (session.line_items && session.line_items.data && session.line_items.data.length > 0) {
                            priceId = session.line_items.data[0].price?.id;
                        } else if (session.metadata && session.metadata.plano_id) {
                            const planoId = parseInt(session.metadata.plano_id);
                            if (planoId) {
                                console.log(`   Plano ID encontrado no metadata da sessão: ${planoId}`);
                                await pool.query(`
                                    UPDATE pagamentos_unicos 
                                    SET plano_id = $1 
                                    WHERE id = $2
                                `, [planoId, pagamento.id]);
                                console.log(`✅ Pagamento único ${pagamento.stripe_payment_intent_id} atualizado com plano_id ${planoId}`);
                                atualizados++;
                                continue;
                            }
                        }
                    } catch (sessionError) {
                        // Ignorar erro se não conseguir buscar sessão
                    }
                }
                
                // 4. Tentar buscar checkout sessions pelo payment_intent
                if (!priceId) {
                    try {
                        // Buscar todas as sessões de checkout e procurar a que tem esse payment_intent
                        const sessions = await stripeService.stripe.checkout.sessions.list({
                            limit: 100
                        });
                        
                        // Procurar sessão que corresponde ao payment intent
                        for (const session of sessions.data) {
                            if (session.payment_intent === pagamento.stripe_payment_intent_id) {
                                // Buscar line items da sessão
                                const lineItems = await stripeService.stripe.checkout.sessions.listLineItems(session.id);
                                if (lineItems.data && lineItems.data.length > 0) {
                                    priceId = lineItems.data[0].price?.id;
                                }
                                // Se não encontrou price_id, tentar metadata
                                if (!priceId && session.metadata && session.metadata.plano_id) {
                                    const planoId = parseInt(session.metadata.plano_id);
                                    if (planoId) {
                                        console.log(`   Plano ID encontrado no metadata da sessão: ${planoId}`);
                                        await pool.query(`
                                            UPDATE pagamentos_unicos 
                                            SET plano_id = $1 
                                            WHERE id = $2
                                        `, [planoId, pagamento.id]);
                                        console.log(`✅ Pagamento único ${pagamento.stripe_payment_intent_id} atualizado com plano_id ${planoId}`);
                                        atualizados++;
                                        priceId = 'found'; // Marcar como encontrado para pular o resto
                                        break;
                                    }
                                }
                                if (priceId) break;
                            }
                        }
                    } catch (searchError) {
                        console.log(`   ⚠️  Erro ao buscar sessões: ${searchError.message}`);
                    }
                }
                
                if (!priceId) {
                    console.log(`⚠️  Não foi possível obter price_id para o payment intent ${pagamento.stripe_payment_intent_id}`);
                    erros++;
                    continue;
                }
                
                console.log(`   Price ID: ${priceId}`);
                
                // Buscar plano_id correspondente
                const planoId = await obterPlanoPorStripePriceId(priceId);
                
                if (!planoId) {
                    console.log(`⚠️  Plano não encontrado para price_id ${priceId}`);
                    erros++;
                    continue;
                }
                
                console.log(`   Plano ID encontrado: ${planoId}`);
                
                // Atualizar pagamento único
                await pool.query(`
                    UPDATE pagamentos_unicos 
                    SET plano_id = $1 
                    WHERE id = $2
                `, [planoId, pagamento.id]);
                
                console.log(`✅ Pagamento único ${pagamento.stripe_payment_intent_id} atualizado com plano_id ${planoId}`);
                atualizados++;
                
            } catch (error) {
                console.error(`❌ Erro ao processar pagamento único ${pagamento.stripe_payment_intent_id}:`, error.message);
                erros++;
            }
        }
        
        console.log(`\n📊 Resumo:`);
        console.log(`   ✅ Atualizados: ${atualizados}`);
        console.log(`   ❌ Erros: ${erros}`);
        console.log(`   📋 Total: ${pagamentos.rows.length}`);
        
    } catch (error) {
        console.error('❌ Erro ao atualizar plano_id dos pagamentos únicos:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Executar script
if (require.main === module) {
    atualizarPlanoIdPagamentosUnicos()
        .then(() => {
            console.log('\n✅ Script concluído!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Erro ao executar script:', error);
            process.exit(1);
        });
}

module.exports = { atualizarPlanoIdPagamentosUnicos };

