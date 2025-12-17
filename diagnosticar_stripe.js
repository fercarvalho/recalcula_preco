require('dotenv').config();
const Stripe = require('stripe');

console.log('🔍 DIAGNÓSTICO DA CONFIGURAÇÃO STRIPE\n');
console.log('='.repeat(60));

// 1. Verificar variáveis de ambiente
console.log('\n📋 1. VARIÁVEIS DE AMBIENTE:');
console.log('-'.repeat(60));

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripePublicKey = process.env.VITE_STRIPE_PUBLIC_KEY;

if (!stripeSecretKey) {
    console.log('❌ STRIPE_SECRET_KEY não encontrada no .env');
} else {
    const isTestKey = stripeSecretKey.startsWith('sk_test_');
    const isLiveKey = stripeSecretKey.startsWith('sk_live_');
    
    console.log('✅ STRIPE_SECRET_KEY encontrada');
    console.log(`   Tipo: ${isTestKey ? 'TESTE (sk_test_)' : isLiveKey ? 'PRODUÇÃO (sk_live_)' : 'DESCONHECIDO'}`);
    console.log(`   Primeiros caracteres: ${stripeSecretKey.substring(0, 20)}...`);
    console.log(`   Últimos caracteres: ...${stripeSecretKey.substring(stripeSecretKey.length - 10)}`);
}

if (!stripePublicKey) {
    console.log('❌ VITE_STRIPE_PUBLIC_KEY não encontrada no .env');
} else {
    const isTestKey = stripePublicKey.startsWith('pk_test_');
    const isLiveKey = stripePublicKey.startsWith('pk_live_');
    
    console.log('✅ VITE_STRIPE_PUBLIC_KEY encontrada');
    console.log(`   Tipo: ${isTestKey ? 'TESTE (pk_test_)' : isLiveKey ? 'PRODUÇÃO (pk_live_)' : 'DESCONHECIDO'}`);
    console.log(`   Primeiros caracteres: ${stripePublicKey.substring(0, 20)}...`);
}

// Verificar se as chaves são do mesmo tipo (teste ou produção)
if (stripeSecretKey && stripePublicKey) {
    const secretIsTest = stripeSecretKey.startsWith('sk_test_');
    const publicIsTest = stripePublicKey.startsWith('pk_test_');
    
    if (secretIsTest !== publicIsTest) {
        console.log('\n⚠️  ATENÇÃO: As chaves são de tipos diferentes!');
        console.log(`   Secret Key: ${secretIsTest ? 'TESTE' : 'PRODUÇÃO'}`);
        console.log(`   Public Key: ${publicIsTest ? 'TESTE' : 'PRODUÇÃO'}`);
    } else {
        console.log('\n✅ As chaves são do mesmo tipo (ambas de teste ou ambas de produção)');
    }
}

// 2. Testar conexão com Stripe
console.log('\n📋 2. TESTE DE CONEXÃO COM STRIPE:');
console.log('-'.repeat(60));

if (!stripeSecretKey) {
    console.log('❌ Não é possível testar conexão sem STRIPE_SECRET_KEY');
    process.exit(1);
}

const stripe = new Stripe(stripeSecretKey);

(async () => {
    try {
        // Testar conexão buscando account
        const account = await stripe.accounts.retrieve();
        console.log('✅ Conexão com Stripe estabelecida com sucesso');
        console.log(`   Account ID: ${account.id}`);
        console.log(`   Tipo: ${account.type}`);
        console.log(`   País: ${account.country || 'N/A'}`);
        console.log(`   Email: ${account.email || 'N/A'}`);
        
        // Verificar modo (test vs live)
        const isTestMode = stripeSecretKey.startsWith('sk_test_');
        console.log(`   Modo: ${isTestMode ? 'TESTE' : 'PRODUÇÃO'}`);
        
    } catch (error) {
        console.log('❌ Erro ao conectar com Stripe:', error.message);
        process.exit(1);
    }

    // 3. Verificar Payment Intents recentes
    console.log('\n📋 3. PAYMENT INTENTS RECENTES (últimas 10):');
    console.log('-'.repeat(60));
    
    try {
        const paymentIntents = await stripe.paymentIntents.list({
            limit: 10,
        });
        
        console.log(`✅ Encontrados ${paymentIntents.data.length} Payment Intent(s) recentes:\n`);
        
        if (paymentIntents.data.length === 0) {
            console.log('⚠️  Nenhum Payment Intent encontrado na Stripe');
        } else {
            paymentIntents.data.forEach((pi, idx) => {
                console.log(`${idx + 1}. Payment Intent: ${pi.id}`);
                console.log(`   Status: ${pi.status}`);
                console.log(`   Valor: R$ ${(pi.amount / 100).toFixed(2)}`);
                console.log(`   Customer: ${pi.customer || 'N/A'}`);
                console.log(`   Criado em: ${new Date(pi.created * 1000).toLocaleString('pt-BR')}`);
                console.log(`   Metadata:`, pi.metadata);
                if (pi.charges?.data?.length > 0) {
                    console.log(`   Charges: ${pi.charges.data.length}`);
                    pi.charges.data.forEach((charge, cIdx) => {
                        console.log(`      ${cIdx + 1}. Charge ${charge.id} - Status: ${charge.status}`);
                    });
                } else {
                    console.log(`   ⚠️  Nenhum charge associado`);
                }
                console.log('');
            });
        }
    } catch (error) {
        console.log('❌ Erro ao buscar Payment Intents:', error.message);
    }

    // 4. Verificar Checkout Sessions recentes
    console.log('\n📋 4. CHECKOUT SESSIONS RECENTES (últimas 10):');
    console.log('-'.repeat(60));
    
    try {
        const sessions = await stripe.checkout.sessions.list({
            limit: 10,
        });
        
        console.log(`✅ Encontradas ${sessions.data.length} Checkout Session(s) recentes:\n`);
        
        if (sessions.data.length === 0) {
            console.log('⚠️  Nenhuma Checkout Session encontrada na Stripe');
        } else {
            sessions.data.forEach((session, idx) => {
                console.log(`${idx + 1}. Checkout Session: ${session.id}`);
                console.log(`   Status: ${session.status}`);
                console.log(`   Payment Status: ${session.payment_status}`);
                console.log(`   Valor Total: R$ ${(session.amount_total / 100).toFixed(2)}`);
                console.log(`   Customer: ${session.customer || 'N/A'}`);
                console.log(`   Payment Intent: ${session.payment_intent || 'N/A'}`);
                console.log(`   Criado em: ${new Date(session.created * 1000).toLocaleString('pt-BR')}`);
                console.log(`   Metadata:`, session.metadata);
                console.log('');
            });
        }
    } catch (error) {
        console.log('❌ Erro ao buscar Checkout Sessions:', error.message);
    }

    // 5. Verificar Customers recentes
    console.log('\n📋 5. CUSTOMERS RECENTES (últimos 10):');
    console.log('-'.repeat(60));
    
    try {
        const customers = await stripe.customers.list({
            limit: 10,
        });
        
        console.log(`✅ Encontrados ${customers.data.length} Customer(s) recentes:\n`);
        
        if (customers.data.length === 0) {
            console.log('⚠️  Nenhum Customer encontrado na Stripe');
        } else {
            customers.data.forEach((customer, idx) => {
                console.log(`${idx + 1}. Customer: ${customer.id}`);
                console.log(`   Email: ${customer.email || 'N/A'}`);
                console.log(`   Nome: ${customer.name || 'N/A'}`);
                console.log(`   Criado em: ${new Date(customer.created * 1000).toLocaleString('pt-BR')}`);
                console.log(`   Metadata:`, customer.metadata);
                
                // Verificar se há Payment Intents associados
                stripe.paymentIntents.list({ customer: customer.id, limit: 5 })
                    .then(pis => {
                        if (pis.data.length > 0) {
                            console.log(`   Payment Intents associados: ${pis.data.length}`);
                        }
                    })
                    .catch(() => {});
                console.log('');
            });
        }
    } catch (error) {
        console.log('❌ Erro ao buscar Customers:', error.message);
    }

    // 6. Verificar Charges recentes (transações reais)
    console.log('\n📋 6. CHARGES RECENTES (transações reais - últimas 10):');
    console.log('-'.repeat(60));
    
    try {
        const charges = await stripe.charges.list({
            limit: 10,
        });
        
        console.log(`✅ Encontrados ${charges.data.length} Charge(s) recentes:\n`);
        
        if (charges.data.length === 0) {
            console.log('⚠️  Nenhum Charge encontrado na Stripe');
            console.log('   Isso pode indicar que:');
            console.log('   - Nenhuma transação foi realmente processada');
            console.log('   - As transações estão apenas como Payment Intents sem confirmação');
            console.log('   - Você está em modo TESTE e não há transações de teste');
        } else {
            charges.data.forEach((charge, idx) => {
                console.log(`${idx + 1}. Charge: ${charge.id}`);
                console.log(`   Status: ${charge.status}`);
                console.log(`   Valor: R$ ${(charge.amount / 100).toFixed(2)}`);
                console.log(`   Customer: ${charge.customer || 'N/A'}`);
                console.log(`   Payment Intent: ${charge.payment_intent || 'N/A'}`);
                console.log(`   Criado em: ${new Date(charge.created * 1000).toLocaleString('pt-BR')}`);
                console.log(`   Paid: ${charge.paid}`);
                console.log(`   Captured: ${charge.captured}`);
                console.log('');
            });
        }
    } catch (error) {
        console.log('❌ Erro ao buscar Charges:', error.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Diagnóstico concluído!');
    console.log('\n💡 DICAS:');
    console.log('   - Se não há Charges, as transações podem estar apenas como Payment Intents');
    console.log('   - Checkout Sessions com cupom de 100% podem não gerar Charges');
    console.log('   - Verifique se está usando o modo correto (teste vs produção)');
    console.log('   - No dashboard da Stripe, verifique "Payments" e "Payment Intents"');
    
})();

