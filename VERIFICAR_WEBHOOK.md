# Como Verificar se o Webhook Processou Corretamente

## ⚠️ IMPORTANTE: Cartões de Teste DO Funcionam!

Os cartões de teste do Stripe **FUNCIONAM PERFEITAMENTE** no modo de teste. Use:

- **Sucesso**: `4242 4242 4242 4242`
- **Qualquer data futura** (ex: 12/25)
- **Qualquer CVC** (ex: 123)

## 📋 Formas de Verificar o Webhook

### 1. ✅ Verificar nos Logs do Servidor

O servidor agora mostra logs detalhados quando processa webhooks:

```bash
# No terminal onde o servidor está rodando, você verá:
📥 Webhook recebido: checkout.session.completed
✅ Evento processado: pagamento_unico
💳 Processando pagamento único - UserId: 1 PaymentIntentId: pi_xxxxx
💰 Valor do pagamento: 199.00
✅ Pagamento único salvo no banco de dados para usuário: 1
✅ Webhook processado com sucesso
```

**Para assinaturas:**
```bash
📥 Webhook recebido: customer.subscription.created
✅ Evento processado: assinatura
📋 Processando assinatura - UserId: 1 SubscriptionId: sub_xxxxx
✅ Assinatura salva no banco de dados para usuário: 1 Status: active
✅ Webhook processado com sucesso
```

### 2. 🔍 Verificar no Dashboard do Stripe

1. Acesse: https://dashboard.stripe.com/test/webhooks
2. Clique no seu webhook (ou vá em **Developers > Webhooks**)
3. Clique em **Recent events**
4. Procure pelo evento `checkout.session.completed`
5. Clique no evento para ver detalhes:
   - **Status**: Deve estar como "Succeeded" (verde)
   - **Response**: Deve mostrar `{"received":true}`
   - Se houver erro, aparecerá em vermelho

### 3. 🗄️ Verificar no Banco de Dados

#### Para Pagamento Único:

```sql
-- Verificar se o pagamento foi salvo
SELECT * FROM pagamentos_unicos 
WHERE usuario_id = SEU_USER_ID 
ORDER BY created_at DESC 
LIMIT 1;
```

Você deve ver:
- `status = 'succeeded'`
- `stripe_payment_intent_id` preenchido
- `valor` correto (199.00 para acesso único)

#### Para Assinatura:

```sql
-- Verificar se a assinatura foi salva
SELECT * FROM assinaturas 
WHERE usuario_id = SEU_USER_ID 
ORDER BY created_at DESC 
LIMIT 1;
```

Você deve ver:
- `status = 'active'` (ou 'trialing')
- `stripe_subscription_id` preenchido
- `plano_tipo = 'anual'`
- `current_period_start` e `current_period_end` preenchidos

### 4. 🧪 Verificar no Sistema (Frontend)

Após processar o pagamento:

1. Faça login no sistema
2. O sistema deve verificar automaticamente o status de pagamento
3. Você deve ter acesso completo (sem bloqueios de trial)

**Ou teste via API:**

```bash
# Verificar status de pagamento (precisa estar autenticado)
curl -X GET http://localhost:3001/api/stripe/status \
  -H "Authorization: Bearer SEU_TOKEN"
```

Resposta esperada:
```json
{
  "temAcesso": true,
  "tipo": "anual", // ou "unico"
  "assinatura": {
    "status": "active",
    "plano_tipo": "anual",
    "current_period_end": "2025-01-XX",
    "cancel_at_period_end": false
  }
}
```

## 🐛 Troubleshooting

### Webhook não está sendo recebido

1. **Verifique a URL do webhook no Stripe:**
   - Deve ser: `https://seu-dominio.com/api/stripe/webhook`
   - Para desenvolvimento local, use: Stripe CLI (veja abaixo)

2. **Verifique o webhook secret:**
   ```bash
   # No arquivo .env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

3. **Use Stripe CLI para testar localmente:**
   ```bash
   # Instalar Stripe CLI (se não tiver)
   # macOS: brew install stripe/stripe-cli/stripe
   
   # Fazer login
   stripe login
   
   # Encaminhar webhooks para servidor local
   stripe listen --forward-to localhost:3001/api/stripe/webhook
   ```

### Webhook recebido mas não processa

1. **Verifique os logs do servidor** - deve mostrar erros
2. **Verifique se o evento está na lista de eventos ouvidos:**
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `payment_intent.succeeded`

3. **Verifique se o userId está no metadata:**
   - O webhook precisa do `user_id` no metadata da sessão
   - Isso é adicionado automaticamente no código

### Pagamento processado mas usuário não tem acesso

1. **Verifique se o registro foi salvo no banco:**
   ```sql
   SELECT * FROM pagamentos_unicos WHERE usuario_id = X;
   SELECT * FROM assinaturas WHERE usuario_id = X;
   ```

2. **Verifique a função `verificarAcessoAtivo`:**
   - Deve retornar `temAcesso: true` se houver pagamento/assinatura ativa

3. **Verifique os logs do servidor** ao fazer login

## 📝 Checklist de Verificação

Após fazer um pagamento de teste:

- [ ] Logs do servidor mostram webhook recebido
- [ ] Logs mostram "Webhook processado com sucesso"
- [ ] Dashboard do Stripe mostra evento como "Succeeded"
- [ ] Banco de dados tem registro na tabela `pagamentos_unicos` ou `assinaturas`
- [ ] Usuário consegue acessar o sistema sem bloqueios
- [ ] API `/api/stripe/status` retorna `temAcesso: true`

## 🎯 Teste Rápido

1. Faça login no sistema
2. Clique em "Assinar agora" ou "Comprar acesso único"
3. Use cartão de teste: `4242 4242 4242 4242`
4. Complete o pagamento
5. Verifique os logs do servidor
6. Verifique no dashboard do Stripe
7. Faça login novamente e verifique se tem acesso completo

