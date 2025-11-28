# Como Corrigir: Modo de Teste vs Produção

## 🔴 Problema Identificado

Você está usando a chave **LIVE** (produção) do Stripe, mas tentando usar cartões de teste.

**Chave atual:** `sk_live_...` (modo de produção)
**Necessário:** `sk_test_...` (modo de teste)

## ✅ Solução: Usar Chaves de Teste

### 1. Obter Chaves de Teste no Stripe

1. Acesse: https://dashboard.stripe.com/test/apikeys
2. Certifique-se de estar no modo **TEST** (veja o toggle no canto superior direito)
3. Copie a **Secret key** que começa com `sk_test_...`
4. Copie a **Publishable key** que começa com `pk_test_...` (se precisar no futuro)

### 2. Obter Price IDs de Teste

1. Acesse: https://dashboard.stripe.com/test/products
2. Certifique-se de estar no modo **TEST**
3. Encontre seus produtos/planos
4. Copie os **Price IDs** que começam com `price_...`

### 3. Atualizar o arquivo .env

Edite o arquivo `.env` e substitua:

```env
# ❌ REMOVA ESTAS (modo produção):
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PLANO_ANUAL_PRICE_ID=price_xxxxx  # (pode ser de produção)
STRIPE_PLANO_UNICO_PRICE_ID=price_xxxxx  # (pode ser de produção)

# ✅ ADICIONE ESTAS (modo teste):
STRIPE_SECRET_KEY=sk_test_xxxxx  # Sua chave de TESTE
STRIPE_PLANO_ANUAL_PRICE_ID=price_xxxxx  # Price ID de TESTE
STRIPE_PLANO_UNICO_PRICE_ID=price_xxxxx  # Price ID de TESTE
STRIPE_WEBHOOK_SECRET=whsec_xxxxx  # Webhook secret de TESTE
```

### 4. Atualizar Webhook Secret (se necessário)

1. Acesse: https://dashboard.stripe.com/test/webhooks
2. Certifique-se de estar no modo **TEST**
3. Se não tiver webhook de teste, crie um novo
4. Copie o **Signing secret** (começa com `whsec_...`)
5. Atualize no `.env`

### 5. Reiniciar o Servidor

Após atualizar o `.env`, reinicie o servidor:

```bash
# Parar o servidor atual
pkill -f "node server.js"

# Iniciar novamente
node server.js
```

## 🧪 Testar com Cartões de Teste

Agora você pode usar:

- **Cartão de sucesso**: `4242 4242 4242 4242`
- **Data**: Qualquer data futura (ex: 12/25)
- **CVC**: Qualquer número (ex: 123)

## ⚠️ Importante

- **Modo TEST**: Use `sk_test_...` e price IDs de teste
- **Modo LIVE**: Use `sk_live_...` e price IDs de produção
- **NÃO misture**: Não use cartões de teste com chaves de produção

## 🔄 Alternar entre Teste e Produção

Para alternar entre modos:

1. **Teste**: Use chaves que começam com `sk_test_` e `pk_test_`
2. **Produção**: Use chaves que começam com `sk_live_` e `pk_live_`

Sempre verifique o toggle no dashboard do Stripe para garantir que está no modo correto!

