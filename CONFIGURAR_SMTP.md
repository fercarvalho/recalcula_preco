# 📧 Guia de Configuração SMTP

## Opção 1: Gmail (Recomendado para testes)

### Passo 1: Ativar verificação em duas etapas
1. Acesse: https://myaccount.google.com/security
2. Ative a "Verificação em duas etapas"

### Passo 2: Gerar Senha de App
1. Acesse: https://myaccount.google.com/apppasswords
2. Selecione "App" → "Email"
3. Selecione "Dispositivo" → "Outro (nome personalizado)"
4. Digite: "Calculadora Reajuste"
5. Clique em "Gerar"
6. **Copie a senha gerada** (16 caracteres, sem espaços)

### Passo 3: Adicionar ao arquivo .env
Adicione estas linhas ao seu arquivo `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app-gerada
SMTP_FROM=seu-email@gmail.com
BASE_URL=http://localhost:3000
```

**Exemplo:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=fercarvalho10@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
SMTP_FROM=fercarvalho10@gmail.com
BASE_URL=http://localhost:3000
```

---

## Opção 2: SendGrid (Recomendado para produção)

### Passo 1: Criar conta
1. Acesse: https://sendgrid.com
2. Crie uma conta gratuita (100 emails/dia grátis)

### Passo 2: Gerar API Key
1. Vá em Settings → API Keys
2. Clique em "Create API Key"
3. Dê um nome: "Calculadora Reajuste"
4. Selecione "Full Access" ou "Mail Send"
5. **Copie a API Key gerada**

### Passo 3: Adicionar ao arquivo .env
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=sua-api-key-do-sendgrid
SMTP_FROM=noreply@seudominio.com
BASE_URL=http://localhost:3000
```

---

## Opção 3: Outlook/Hotmail

### Passo 1: Gerar Senha de App
1. Acesse: https://account.microsoft.com/security
2. Ative a "Verificação em duas etapas"
3. Vá em "Senhas de app"
4. Gere uma nova senha de app

### Passo 2: Adicionar ao arquivo .env
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@outlook.com
SMTP_PASS=sua-senha-de-app
SMTP_FROM=seu-email@outlook.com
BASE_URL=http://localhost:3000
```

---

## ⚠️ IMPORTANTE

1. **Nunca compartilhe** seu arquivo `.env` - ele contém senhas!
2. O arquivo `.env` já está no `.gitignore` (não será commitado)
3. Após adicionar as configurações, **reinicie o servidor**
4. Para produção, altere `BASE_URL` para seu domínio real

---

## 🧪 Testar Configuração

Após configurar, teste solicitando uma recuperação de senha. Se funcionar, você receberá o email real!

Se der erro, verifique:
- ✅ Senha de app está correta (sem espaços)
- ✅ Verificação em duas etapas está ativada
- ✅ Porta e host estão corretos
- ✅ Servidor foi reiniciado após alterar .env

