# 📧 Guia de Configuração SMTP

## 🎯 Recomendações por Ambiente

- **Desenvolvimento (localhost)**: Gmail ou Ethereal Email (automático)
- **Produção (VPS)**: **SendGrid** (mais fácil) ou **AWS SES** (mais barato)

---

## Opção 1: Gmail (Apenas para testes/desenvolvimento)

⚠️ **NÃO recomendado para produção** - pode ser bloqueado, tem limites rígidos

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

## ⭐ Opção 2: SendGrid (RECOMENDADO PARA PRODUÇÃO/VPS)

### ✅ Por que SendGrid?
- ✅ **100 emails/dia GRÁTIS** (perfeito para começar)
- ✅ Fácil configuração
- ✅ Excelente reputação de entrega
- ✅ Dashboard completo para monitoramento
- ✅ Escalável conforme cresce
- ✅ Suporte a domínios personalizados

### Passo 1: Criar conta
1. Acesse: https://sendgrid.com
2. Crie uma conta gratuita (100 emails/dia grátis)

### Passo 2: Gerar API Key
1. Vá em Settings → API Keys
2. Clique em "Create API Key"
3. Dê um nome: "Calculadora Reajuste"
4. Selecione "Full Access" ou "Mail Send"
5. **Copie a API Key gerada**

### Passo 3: Configurar Domínio para Envio (Set Up Sending)

Esta é a etapa mais importante para garantir que seus emails sejam entregues corretamente!

#### 3.1. Tela "Set Up Sending" (Onde você está agora!)

Na tela que você está vendo, siga estes passos:

Quando você acessar o SendGrid pela primeira vez, verá uma tela de configuração. Siga estes passos:

**A. Configurar Domínio:**
1. No campo "Domain", digite seu domínio **SEM o https://**
   - ✅ Correto: `recalculapreco.com.br`
   - ❌ Errado: `https://recalculapreco.com.br` ou `www.recalculapreco.com.br`
   
2. **Importante:** 
   - Use apenas o domínio raiz (sem www, sem https)
   - Se você digitou `https://recalculapreco.com.br`, **remova o "https://"**
   - O campo deve conter apenas: `recalculapreco.com.br`

**B. Link Branding (Recomendado):**
- ✅ **Marque "Yes"** para ativar Link Branding
- Isso faz com que todos os links de rastreamento usem seu domínio ao invés de "sendgrid.net"
- **Benefícios:**
  - Links parecem mais confiáveis: `recalculapreco.com.br/...` ao invés de `sendgrid.net/...`
  - Melhora a entrega dos emails
  - Profissionalismo

**C. Advanced Settings (Opcional):**
- Você pode deixar como padrão por enquanto
- Essas configurações são para casos específicos

**D. Clique em "Next →"**

#### 3.2. Instalar DNS Records (Próxima Etapa)

Após clicar em "Next", o SendGrid mostrará registros DNS que você precisa adicionar no seu provedor de domínio (ex: Hostinger, GoDaddy, etc.).

**O que você verá:**
- Registros CNAME para autenticação de domínio
- Registros CNAME para link branding (se ativou)
- Instruções específicas para seu provedor

**Como configurar:**
1. Acesse o painel do seu provedor de domínio (ex: Hostinger)
2. Vá em "DNS" ou "Zona DNS"
3. Adicione cada registro CNAME exatamente como o SendGrid mostrar
4. Aguarde a propagação DNS (pode levar de alguns minutos a 24 horas)
5. Volte ao SendGrid e clique em "Verify" para verificar

**⚠️ IMPORTANTE:**
- Não pule esta etapa! Sem os registros DNS, seus emails podem ir para spam
- Use o domínio que você configurou no campo "Domain"
- O SendGrid verificará automaticamente quando os DNS estiverem corretos

#### 3.3. Verificação Alternativa (Para Testes Rápidos)

Se você quiser testar rapidamente sem configurar DNS completo:

1. Vá em **Settings → Sender Authentication**
2. Clique em **"Verify a Single Sender"**
3. Digite um email válido (pode ser seu email pessoal)
4. Verifique o email que receber
5. Use este email no `SMTP_FROM` do `.env`

**⚠️ Limitação:** 
- Só pode enviar para emails verificados
- Não é recomendado para produção
- Use apenas para testes iniciais

#### 3.4. Após Configurar o Domínio

Depois que você:
1. ✅ Configurou o domínio na tela "Set Up Sending"
2. ✅ Adicionou os registros DNS no seu provedor
3. ✅ O SendGrid verificou o domínio (status "Verified")

Você poderá usar emails do seu domínio no sistema de recuperação de senha!

**Exemplo para seu caso:**
- Domínio configurado: `recalculapreco.com.br`
- Email de recuperação: `noreply@recalculapreco.com.br` ou `suporte@recalculapreco.com.br`

### Passo 4: Adicionar ao arquivo .env
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=sua-api-key-do-sendgrid
SMTP_FROM=noreply@seudominio.com
BASE_URL=https://seudominio.com
```

**Exemplo real (para seu domínio recalculapreco.com.br):**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SMTP_FROM=noreply@recalculapreco.com.br
BASE_URL=https://recalculapreco.com.br
```

**⚠️ IMPORTANTE:**
- O `SMTP_FROM` deve usar um email do domínio que você configurou no SendGrid
- O `BASE_URL` deve ser o domínio completo com https://
- Após configurar, os emails de recuperação de senha virão de `noreply@recalculapreco.com.br`

**🔧 Configuração para Desenvolvimento vs Produção:**

Para **desenvolvimento local** (localhost):
```env
BASE_URL=http://localhost:3000
```

Para **produção** (VPS/servidor):
```env
BASE_URL=https://recalculapreco.com.br
```

**💡 Dica:** Você pode ter dois arquivos `.env`:
- `.env.local` - para desenvolvimento
- `.env.production` - para produção

Ou simplesmente altere o `BASE_URL` conforme o ambiente que está usando.

### 💡 Dica para VPS:
- Use um domínio personalizado no `SMTP_FROM` (ex: noreply@seudominio.com)
- Configure SPF e DKIM no DNS do seu domínio (SendGrid fornece instruções)
- Isso melhora a entrega e evita spam

---

## Opção 3: AWS SES (Alternativa para produção - mais barato)

### ✅ Por que AWS SES?
- ✅ **Muito barato**: ~$0.10 por 1.000 emails
- ✅ Escalável para milhões de emails
- ✅ Integração com outros serviços AWS
- ⚠️ Requer conta AWS e configuração mais complexa

### Passo 1: Criar conta AWS
1. Acesse: https://aws.amazon.com
2. Crie uma conta (requer cartão de crédito, mas tem free tier)

### Passo 2: Configurar SES
1. Acesse o console AWS SES
2. Verifique seu email ou domínio
3. Vá em SMTP Settings → Create SMTP Credentials
4. **Copie as credenciais geradas**

### Passo 3: Adicionar ao arquivo .env
```env
SMTP_HOST=email-smtp.REGIAO.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=sua-smtp-username
SMTP_PASS=sua-smtp-password
SMTP_FROM=noreply@seudominio.com
BASE_URL=https://seudominio.com
```

**Exemplo (região us-east-1):**
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=AKIAIOSFODNN7EXAMPLE
SMTP_PASS=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
SMTP_FROM=noreply@calculadora.com
BASE_URL=https://calculadora.com
```

### ⚠️ Importante AWS SES:
- Conta começa em "Sandbox" (só pode enviar para emails verificados)
- Para produção, solicite "Production Access"
- Configure SPF e DKIM no DNS

---

## Opção 4: Outlook/Hotmail (Apenas para testes)

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

## 🚀 Configuração para VPS (Produção)

### Checklist para produção:

1. ✅ **Use SendGrid ou AWS SES** (não Gmail)
2. ✅ **Configure domínio personalizado** no `SMTP_FROM`
3. ✅ **Altere `BASE_URL`** para seu domínio real (ex: `https://calculadora.com`)
4. ✅ **Configure SPF e DKIM** no DNS (melhora entrega)
5. ✅ **Use variáveis de ambiente** no servidor (não hardcode no código)
6. ✅ **Monitore a entrega** (dashboard SendGrid/AWS)

### Exemplo .env para produção (VPS):
```env
# Banco de dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=calculadora_reajuste
DB_USER=postgres
DB_PASSWORD=sua_senha_segura

# Servidor
PORT=3000
NODE_ENV=production

# SMTP (SendGrid)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.sua_api_key_aqui
SMTP_FROM=noreply@seudominio.com
BASE_URL=https://seudominio.com

# JWT
JWT_SECRET=chave_super_secreta_aleatoria_aqui
JWT_EXPIRES_IN=7d
```

---

## ⚠️ IMPORTANTE

1. **Nunca compartilhe** seu arquivo `.env` - ele contém senhas!
2. O arquivo `.env` já está no `.gitignore` (não será commitado)
3. Após adicionar as configurações, **reinicie o servidor**
4. Para produção, altere `BASE_URL` para seu domínio real
5. **Use HTTPS** em produção (BASE_URL deve começar com https://)

---

## 🧪 Testar Configuração

Após configurar, teste solicitando uma recuperação de senha. Se funcionar, você receberá o email real!

Se der erro, verifique:
- ✅ Senha de app está correta (sem espaços)
- ✅ Verificação em duas etapas está ativada
- ✅ Porta e host estão corretos
- ✅ Servidor foi reiniciado após alterar .env

