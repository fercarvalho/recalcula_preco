/**
 * Script para verificar TODOS os planos (assinaturas e pagamentos únicos)
 * 
 * Este script verifica se assinaturas e pagamentos únicos têm plano_id preenchido
 * 
 * Uso: node verificar_todos_planos.js
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

async function verificarTodosPlanos() {
    try {
        console.log('🔍 Verificando TODOS os planos (assinaturas e pagamentos únicos)...\n');
        
        // ========== ASSINATURAS ==========
        console.log('📋 ASSINATURAS (Planos Anuais):\n');
        
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
            console.log('ℹ️  Nenhuma assinatura encontrada.\n');
        } else {
            console.log(`   Total: ${todasAssinaturas.rows.length}`);
            
            const comPlanoId = todasAssinaturas.rows.filter(a => a.plano_id !== null);
            const semPlanoId = todasAssinaturas.rows.filter(a => a.plano_id === null && a.stripe_subscription_id !== null);
            
            console.log(`   ✅ COM plano_id: ${comPlanoId.length}`);
            console.log(`   ⚠️  SEM plano_id: ${semPlanoId.length}\n`);
            
            if (comPlanoId.length > 0) {
                console.log('   ✅ Assinaturas configuradas corretamente:');
                comPlanoId.forEach(a => {
                    console.log(`      - ID: ${a.id} | Usuário: ${a.username || a.usuario_id} | Plano: ${a.plano_nome || 'N/A'} (ID: ${a.plano_id})`);
                });
                console.log('');
            }
            
            if (semPlanoId.length > 0) {
                console.log('   ⚠️  Assinaturas que precisam ser atualizadas:');
                semPlanoId.forEach(a => {
                    console.log(`      - ID: ${a.id} | Usuário: ${a.username || a.usuario_id} | Stripe: ${a.stripe_subscription_id}`);
                });
                console.log('');
            }
        }
        
        // ========== PAGAMENTOS ÚNICOS ==========
        console.log('💳 PAGAMENTOS ÚNICOS (Acesso Único):\n');
        
        const todosPagamentos = await pool.query(`
            SELECT 
                pu.id,
                pu.usuario_id,
                pu.stripe_payment_intent_id,
                pu.plano_id,
                pu.valor,
                pu.status,
                pu.usado,
                pu.created_at,
                u.username,
                p.nome as plano_nome
            FROM pagamentos_unicos pu
            LEFT JOIN usuarios u ON pu.usuario_id = u.id
            LEFT JOIN planos p ON pu.plano_id = p.id
            WHERE pu.status = 'succeeded'
            ORDER BY pu.created_at DESC
        `);
        
        if (todosPagamentos.rows.length === 0) {
            console.log('ℹ️  Nenhum pagamento único encontrado.\n');
        } else {
            console.log(`   Total: ${todosPagamentos.rows.length}`);
            
            const comPlanoId = todosPagamentos.rows.filter(p => p.plano_id !== null);
            const semPlanoId = todosPagamentos.rows.filter(p => p.plano_id === null);
            
            console.log(`   ✅ COM plano_id: ${comPlanoId.length}`);
            console.log(`   ⚠️  SEM plano_id: ${semPlanoId.length}\n`);
            
            if (comPlanoId.length > 0) {
                console.log('   ✅ Pagamentos únicos configurados corretamente:');
                comPlanoId.forEach(p => {
                    const usado = p.usado ? 'USADO' : 'ATIVO';
                    const data = new Date(p.created_at).toLocaleDateString('pt-BR');
                    console.log(`      - ID: ${p.id} | Usuário: ${p.username || p.usuario_id} | Plano: ${p.plano_nome || 'N/A'} (ID: ${p.plano_id}) | ${usado} | ${data}`);
                });
                console.log('');
            }
            
            if (semPlanoId.length > 0) {
                console.log('   ⚠️  Pagamentos únicos que precisam ser atualizados:');
                semPlanoId.forEach(p => {
                    const usado = p.usado ? 'USADO' : 'ATIVO';
                    const data = new Date(p.created_at).toLocaleDateString('pt-BR');
                    console.log(`      - ID: ${p.id} | Usuário: ${p.username || p.usuario_id} | Stripe: ${p.stripe_payment_intent_id} | ${usado} | ${data}`);
                });
                console.log('');
            }
        }
        
        // ========== RESUMO GERAL ==========
        console.log('📊 RESUMO GERAL:\n');
        
        const totalAssinaturas = todasAssinaturas.rows.length;
        const assinaturasComPlano = todasAssinaturas.rows.filter(a => a.plano_id !== null && a.stripe_subscription_id !== null).length;
        
        const totalPagamentos = todosPagamentos.rows.length;
        const pagamentosComPlano = todosPagamentos.rows.filter(p => p.plano_id !== null).length;
        
        const totalGeral = totalAssinaturas + totalPagamentos;
        const totalComPlano = assinaturasComPlano + pagamentosComPlano;
        
        console.log(`   Assinaturas: ${assinaturasComPlano}/${totalAssinaturas} configuradas`);
        console.log(`   Pagamentos únicos: ${pagamentosComPlano}/${totalPagamentos} configurados`);
        console.log(`   Total geral: ${totalComPlano}/${totalGeral} configurados\n`);
        
        if (totalComPlano === totalGeral && totalGeral > 0) {
            console.log('🎉 Todos os planos estão configurados corretamente!');
        } else if (totalGeral === 0) {
            console.log('ℹ️  Nenhum plano encontrado no sistema.');
        } else {
            console.log('⚠️  Alguns planos ainda precisam ser configurados.');
            console.log('💡 Execute os scripts de atualização para corrigir.');
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
    verificarTodosPlanos()
        .then(() => {
            console.log('\n✅ Verificação concluída!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Erro ao executar script:', error);
            process.exit(1);
        });
}

module.exports = { verificarTodosPlanos };

