require('dotenv').config();
const Stripe = require('stripe');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

if (!stripeSecretKey) {
    console.warn('⚠️  STRIPE_SECRET_KEY não configurada. Funcionalidades do Stripe não estarão disponíveis.');
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
    apiVersion: '2024-12-18.acacia',
}) : null;

// IDs dos produtos/planos no Stripe (devem ser criados no dashboard do Stripe)
const PLANO_ANUAL_PRICE_ID = process.env.STRIPE_PLANO_ANUAL_PRICE_ID || '';
const PLANO_UNICO_PRICE_ID = process.env.STRIPE_PLANO_UNICO_PRICE_ID || '';

// Criar sessão de checkout para plano anual
async function criarCheckoutAnual(customerEmail, userId, successUrl, cancelUrl) {
    try {
        if (!stripe) {
            throw new Error('Stripe não está configurado. Verifique STRIPE_SECRET_KEY no arquivo .env');
        }
        
        if (!PLANO_ANUAL_PRICE_ID || PLANO_ANUAL_PRICE_ID.trim() === '') {
            throw new Error('STRIPE_PLANO_ANUAL_PRICE_ID não está configurado. Configure a variável de ambiente STRIPE_PLANO_ANUAL_PRICE_ID com o ID do preço recorrente no Stripe.');
        }
        
        // Verificar se o price é válido e é do tipo recorrente
        try {
            const price = await stripe.prices.retrieve(PLANO_ANUAL_PRICE_ID);
            if (!price.recurring) {
                throw new Error(`O preço ${PLANO_ANUAL_PRICE_ID} não é um preço recorrente. Para assinaturas, é necessário usar um preço do tipo "recurring" criado no Stripe Dashboard.`);
            }
        } catch (priceError) {
            if (priceError.message.includes('No such price')) {
                throw new Error(`O preço ${PLANO_ANUAL_PRICE_ID} não foi encontrado no Stripe. Verifique se o STRIPE_PLANO_ANUAL_PRICE_ID está correto no arquivo .env.`);
            }
            throw priceError;
        }
        
        const session = await stripe.checkout.sessions.create({
            customer_email: customerEmail,
            payment_method_types: ['card'],
            line_items: [
                {
                    price: PLANO_ANUAL_PRICE_ID,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            subscription_data: {
                metadata: {
                    user_id: userId.toString(),
                },
            },
            metadata: {
                user_id: userId.toString(),
                plano_tipo: 'anual',
            },
            success_url: successUrl,
            cancel_url: cancelUrl,
        });

        return session;
    } catch (error) {
        console.error('Erro ao criar checkout anual:', error);
        throw error;
    }
}

// Criar sessão de checkout para pagamento único (com price_id dinâmico)
async function criarCheckoutUnico(customerEmail, userId, successUrl, cancelUrl, priceId = null) {
    try {
        if (!stripe) {
            throw new Error('Stripe não está configurado. Verifique STRIPE_SECRET_KEY no arquivo .env');
        }
        
        // Usar price_id fornecido ou fallback para o do .env
        const finalPriceId = priceId || PLANO_UNICO_PRICE_ID;
        
        if (!finalPriceId || finalPriceId.trim() === '') {
            throw new Error('Price ID do Stripe não está configurado. Configure o campo "Stripe Price ID" no plano ou a variável STRIPE_PLANO_UNICO_PRICE_ID no arquivo .env');
        }
        
        const session = await stripe.checkout.sessions.create({
            customer_email: customerEmail,
            payment_method_types: ['card'],
            line_items: [
                {
                    price: finalPriceId,
                    quantity: 1,
                },
            ],
            mode: 'payment',
            metadata: {
                user_id: userId.toString(),
                plano_tipo: 'unico',
            },
            success_url: successUrl,
            cancel_url: cancelUrl,
        });

        return session;
    } catch (error) {
        console.error('Erro ao criar checkout único:', error);
        throw error;
    }
}

// Processar webhook do Stripe
async function processarWebhook(event) {
    try {
        switch (event.type) {
            case 'checkout.session.completed':
                // Pagamento único ou primeira cobrança de assinatura
                const session = event.data.object;
                const userId = parseInt(session.metadata?.user_id);
                const planoTipo = session.metadata?.plano_tipo;

                if (planoTipo === 'unico') {
                    // Processar pagamento único
                    return {
                        tipo: 'pagamento_unico',
                        userId,
                        sessionId: session.id,
                        paymentIntentId: session.payment_intent,
                        status: session.payment_status,
                    };
                }
                break;

            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                // Assinatura criada ou atualizada
                const subscription = event.data.object;
                return {
                    tipo: 'assinatura',
                    subscriptionId: subscription.id,
                    customerId: subscription.customer,
                    status: subscription.status,
                    currentPeriodStart: new Date(subscription.current_period_start * 1000),
                    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                    cancelAtPeriodEnd: subscription.cancel_at_period_end,
                    metadata: subscription.metadata,
                };

            case 'customer.subscription.deleted':
                // Assinatura cancelada
                const deletedSubscription = event.data.object;
                return {
                    tipo: 'assinatura_cancelada',
                    subscriptionId: deletedSubscription.id,
                    customerId: deletedSubscription.customer,
                };

            case 'invoice.payment_succeeded':
                // Pagamento de assinatura bem-sucedido
                const invoice = event.data.object;
                return {
                    tipo: 'pagamento_assinatura',
                    subscriptionId: invoice.subscription,
                    customerId: invoice.customer,
                    amountPaid: invoice.amount_paid,
                };

            case 'invoice.payment_failed':
                // Falha no pagamento de assinatura
                const failedInvoice = event.data.object;
                return {
                    tipo: 'pagamento_falhou',
                    subscriptionId: failedInvoice.subscription,
                    customerId: failedInvoice.customer,
                };

            case 'payment_intent.succeeded':
                // Pagamento único bem-sucedido
                const paymentIntent = event.data.object;
                return {
                    tipo: 'pagamento_unico_sucesso',
                    paymentIntentId: paymentIntent.id,
                    customerId: paymentIntent.customer,
                    amount: paymentIntent.amount / 100, // Converter de centavos para reais
                    metadata: paymentIntent.metadata,
                };

            default:
                return null;
        }
    } catch (error) {
        console.error('Erro ao processar webhook:', error);
        throw error;
    }
}

// Obter assinatura do Stripe
async function obterAssinaturaStripe(subscriptionId) {
    try {
        if (!stripe) {
            throw new Error('Stripe não está configurado. Verifique STRIPE_SECRET_KEY no arquivo .env');
        }
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        return subscription;
    } catch (error) {
        console.error('Erro ao obter assinatura do Stripe:', error);
        throw error;
    }
}

// Cancelar assinatura
async function cancelarAssinatura(subscriptionId, cancelImmediately = false) {
    try {
        if (!stripe) {
            throw new Error('Stripe não está configurado. Verifique STRIPE_SECRET_KEY no arquivo .env');
        }
        if (cancelImmediately) {
            // Cancelar imediatamente
            const subscription = await stripe.subscriptions.cancel(subscriptionId);
            return subscription;
        } else {
            // Cancelar no final do período
            const subscription = await stripe.subscriptions.update(subscriptionId, {
                cancel_at_period_end: true,
            });
            return subscription;
        }
    } catch (error) {
        console.error('Erro ao cancelar assinatura:', error);
        throw error;
    }
}

// Criar sessão do Customer Portal do Stripe
async function criarSessaoCustomerPortal(customerId, returnUrl) {
    try {
        if (!stripe) {
            throw new Error('Stripe não está configurado. Verifique STRIPE_SECRET_KEY no arquivo .env');
        }
        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: returnUrl,
        });
        return session;
    } catch (error) {
        console.error('Erro ao criar sessão do Customer Portal:', error);
        throw error;
    }
}

module.exports = {
    criarCheckoutAnual,
    criarCheckoutUnico,
    processarWebhook,
    obterAssinaturaStripe,
    cancelarAssinatura,
    criarSessaoCustomerPortal,
    stripe,
};

