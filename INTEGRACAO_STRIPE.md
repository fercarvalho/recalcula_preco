# Integração com Stripe - Guia de Configuração

Este documento explica como configurar a integração com Stripe para o sistema de pagamentos.

## Requisitos

1. Conta no Stripe (https://stripe.com)
2. Chaves de API do Stripe (Secret Key e Publishable Key)
3. Webhook endpoint configurado no Stripe

## Configuração no Stripe Dashboard

### 1. Criar Produtos e Preços

No dashboard do Stripe, você precisa criar dois produtos:

#### Plano Anual (12x R$ 19,90)
- **Tipo**: Assinatura recorrente
- **Preço**: R$ 19,90
- **Intervalo**: Mensal
- **Duração**: 12 meses
- **ID do Preço**: Copie o `price_id` gerado (ex: `price_xxxxx`)

#### Acesso Único (R$ 199,00)
- **Tipo**: Pagamento único
- **Preço**: R$ 199,00
- **ID do Preço**: Copie o `price_id` gerado (ex: `price_xxxxx`)

### 2. Configurar Webhook

1. Acesse **Developers > Webhooks** no dashboard do Stripe
2. Clique em **Add endpoint**
3. URL do endpoint: `https://seu-dominio.com/api/stripe/webhook`
4. Selecione os seguintes eventos:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `payment_intent.succeeded`
5. Copie o **Signing secret** (ex: `whsec_xxxxx`)

## Variáveis de Ambiente

Adicione as seguintes variáveis no arquivo `.env`:

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx  # Sua chave secreta do Stripe
STRIPE_WEBHOOK_SECRET=whsec_xxxxx  # Secret do webhook
STRIPE_PLANO_ANUAL_PRICE_ID=price_xxxxx  # ID do preço do plano anual
STRIPE_PLANO_UNICO_PRICE_ID=price_xxxxx  # ID do preço do acesso único

# URL do frontend (para redirecionamento após pagamento)
FRONTEND_URL=http://localhost:3000
```

## Testando a Integração

### Modo de Teste (Stripe Test Mode)

1. Use as chaves de teste do Stripe
2. Use cartões de teste:
   - **Sucesso**: `4242 4242 4242 4242`
   - **Falha**: `4000 0000 0000 0002`
   - **Requer autenticação**: `4000 0025 0000 3155`
3. Use qualquer data de expiração futura e qualquer CVC

### Verificar Webhook

1. No dashboard do Stripe, acesse **Developers > Webhooks**
2. Clique no seu webhook
3. Verifique os eventos recebidos em **Recent events**

## Funcionalidades Implementadas

### Planos Disponíveis

1. **Plano Anual**: R$ 19,90/mês em 12x
   - Acesso completo ao sistema
   - Dados salvos permanentemente
   - Cancele quando quiser

2. **Acesso Único**: R$ 199,00 (pagamento único)
   - Acesso completo ao sistema por 24 horas
   - **Dados não são salvos permanentemente**
   - Expira automaticamente após 24 horas do pagamento
   - Ideal para uso pontual

### Bloqueio de Acesso

- Usuários sem pagamento ativo não podem acessar as funcionalidades do sistema
- Apenas rotas de autenticação e pagamento são acessíveis sem pagamento
- O sistema verifica automaticamente o status do pagamento em cada requisição

### Acesso Único

- O acesso único expira automaticamente após **24 horas** do pagamento
- Quando o usuário com acesso único tenta salvar dados (criar item, atualizar item, criar categoria), o sistema:
  1. Marca o pagamento como usado
  2. Retorna erro informando que os dados não são salvos
  3. Permite que o usuário continue usando o sistema (apenas não salva dados)
- Após 24 horas, o acesso é automaticamente revogado, mesmo que o pagamento não tenha sido marcado como usado

## Troubleshooting

### Webhook não está recebendo eventos

1. Verifique se a URL do webhook está correta
2. Verifique se o `STRIPE_WEBHOOK_SECRET` está correto
3. Use o Stripe CLI para testar webhooks localmente:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

### Pagamento não está sendo processado

1. Verifique os logs do servidor
2. Verifique se os IDs dos preços estão corretos
3. Verifique se o webhook está configurado corretamente
4. Verifique se os eventos estão sendo recebidos no dashboard do Stripe

### Erro "PAGAMENTO_REQUERIDO"

- Isso significa que o usuário não tem acesso pago ativo
- Verifique se a assinatura está ativa no banco de dados
- Verifique se o webhook processou corretamente o pagamento

## Produção

Antes de ir para produção:

1. Troque as chaves de teste pelas chaves de produção
2. Configure o webhook com a URL de produção
3. Teste todos os fluxos de pagamento
4. Configure alertas no Stripe para falhas de pagamento
5. Configure emails de notificação para eventos importantes

## Suporte

Para mais informações, consulte a documentação do Stripe:
- https://stripe.com/docs/api
- https://stripe.com/docs/webhooks
- https://stripe.com/docs/testing

