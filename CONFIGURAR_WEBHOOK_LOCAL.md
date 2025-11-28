# Como Configurar Webhook para Desenvolvimento Local

## 🔴 Problema

O Stripe não consegue acessar `localhost` porque não é um endereço público. Por isso os webhooks estão falhando com "Failed to connect to remote host".

## ✅ Solução: Usar Stripe CLI

O Stripe CLI cria um túnel que encaminha os webhooks do Stripe para seu servidor local.

### 1. Instalar Stripe CLI

**macOS (usando Homebrew):**
```bash
brew install stripe/stripe-cli/stripe
```

**Outros sistemas:**
Acesse: https://stripe.com/docs/stripe-cli

### 2. Fazer Login no Stripe CLI

```bash
stripe login
```

Isso abrirá o navegador para autenticar. Após autenticar, você verá uma mensagem de sucesso.

### 3. Encaminhar Webhooks para o Servidor Local

Em um **novo terminal** (deixe o servidor rodando em outro), execute:

```bash
stripe listen --forward-to localhost:3001/api/stripe/webhook
```

Você verá algo como:
```
> Ready! Your webhook signing secret is whsec_xxxxx (^C to quit)
```

### 4. Atualizar o Webhook Secret no .env

Copie o `whsec_xxxxx` que apareceu e atualize no arquivo `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxx  # O secret que apareceu no stripe listen
```

### 5. Reiniciar o Servidor

Após atualizar o `.env`, reinicie o servidor:

```bash
# Parar o servidor
pkill -f "node server.js"

# Iniciar novamente
node server.js
```

## 🧪 Testar

Agora quando você fizer um pagamento de teste:

1. O Stripe CLI mostrará os eventos recebidos
2. O servidor processará o webhook
3. Você verá os logs no servidor
4. O pagamento será salvo no banco de dados

## 📋 Checklist

- [ ] Stripe CLI instalado
- [ ] `stripe login` executado com sucesso
- [ ] `stripe listen` rodando em um terminal separado
- [ ] Webhook secret atualizado no `.env`
- [ ] Servidor reiniciado
- [ ] Teste de pagamento realizado

## ⚠️ Importante

- Mantenha o `stripe listen` rodando enquanto estiver testando
- O webhook secret do `stripe listen` é diferente do webhook do dashboard
- Para produção, você precisará configurar o webhook real no dashboard do Stripe

## 🔄 Alternativa: ngrok (se não quiser usar Stripe CLI)

Se preferir usar ngrok:

1. Instale ngrok: https://ngrok.com/
2. Execute: `ngrok http 3001`
3. Copie a URL (ex: `https://xxxxx.ngrok.io`)
4. Configure no Stripe Dashboard: `https://xxxxx.ngrok.io/api/stripe/webhook`
5. Use o webhook secret do dashboard

Mas o Stripe CLI é mais simples para desenvolvimento!

