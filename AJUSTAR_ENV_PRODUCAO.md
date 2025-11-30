# ⚙️ Ajustar .env para Produção (VPS)

Quando você cola o `.env` local para a VPS, algumas variáveis **precisam ser ajustadas** para produção.

---

## ✅ O Que Pode Ser Copiado Igual

Estas variáveis podem ser **copiadas exatamente** do `.env` local:

- ✅ `DB_USER` - Usuário do banco (se for o mesmo)
- ✅ `DB_PASSWORD` - Senha do banco (se for o mesmo)
- ✅ `JWT_SECRET` - **IMPORTANTE:** Use uma chave DIFERENTE para produção!
- ✅ `SMTP_USER` - Usuário SMTP
- ✅ `SMTP_PASS` - Senha SMTP
- ✅ `STRIPE_SECRET_KEY` - Chave do Stripe (use chave de PRODUÇÃO)
- ✅ `STRIPE_PLANO_ANUAL_PRICE_ID` - Price ID
- ✅ `STRIPE_PLANO_UNICO_PRICE_ID` - Price ID
- ✅ `STRIPE_WEBHOOK_SECRET` - Webhook secret (de PRODUÇÃO)

---

## ⚠️ O Que PRECISA Ser Ajustado

### 1. **DB_HOST**

**Local (desenvolvimento):**
```env
DB_HOST=localhost
```

**VPS (produção):**
```env
DB_HOST=localhost
# OU se o banco estiver em outro servidor:
# DB_HOST=ip-do-servidor-banco
```

**✅ Geralmente pode ficar `localhost` se o PostgreSQL está na mesma VPS.**

---

### 2. **DB_NAME**

**Local:**
```env
DB_NAME=calculadora_reajuste
```

**VPS:**
```env
DB_NAME=calculadora_reajuste
# OU se criou um banco com nome diferente:
# DB_NAME=recalcula_preco_db
```

**✅ Pode ser o mesmo, mas certifique-se de que o banco existe na VPS!**

---

### 3. **PORT**

**Local:**
```env
PORT=3001
```

**VPS:**
```env
PORT=3001
# OU outra porta se 3001 já estiver em uso
# PORT=3002
```

**✅ Pode ser o mesmo, mas verifique se a porta está livre na VPS.**

---

### 4. **NODE_ENV**

**Local:**
```env
NODE_ENV=development
# OU pode não estar definido
```

**VPS (produção):**
```env
NODE_ENV=production
```

**⚠️ IMPORTANTE:** Mude para `production` na VPS!

---

### 5. **FRONTEND_URL**

**Local:**
```env
FRONTEND_URL=http://localhost:3000
# OU
FRONTEND_URL=http://localhost:3001
```

**VPS (produção):**
```env
FRONTEND_URL=https://seu-dominio.com
# OU se usar subdomínio:
# FRONTEND_URL=https://calculadora.seudominio.com
```

**⚠️ CRÍTICO:** Mude para o domínio real da VPS!

---

### 6. **BASE_URL**

**Local:**
```env
BASE_URL=http://localhost:3000
```

**VPS (produção):**
```env
BASE_URL=https://seu-dominio.com
# OU se usar subdomínio:
# BASE_URL=https://calculadora.seudominio.com
```

**⚠️ CRÍTICO:** Mude para o domínio real da VPS! (usado nos emails)

---

### 7. **SMTP_FROM**

**Local:**
```env
SMTP_FROM=seu-email@gmail.com
```

**VPS (produção):**
```env
SMTP_FROM=noreply@seudominio.com
# OU se não tiver domínio:
# SMTP_FROM=seu-email@gmail.com
```

**✅ Pode ser o mesmo, mas idealmente use um email do seu domínio.**

---

### 8. **JWT_SECRET**

**⚠️ IMPORTANTE:** **NÃO use a mesma chave do desenvolvimento!**

**Local:**
```env
JWT_SECRET=chave_de_desenvolvimento_123
```

**VPS (produção):**
```env
JWT_SECRET=chave_diferente_para_producao_456
```

**Como gerar nova chave:**
```bash
# Na VPS
openssl rand -hex 32
```

**Cole o resultado no JWT_SECRET do .env da VPS.**

---

## 📋 Checklist de Ajustes

Ao colar o `.env` local na VPS, verifique e ajuste:

- [ ] `NODE_ENV=production` (mudar de development)
- [ ] `FRONTEND_URL=https://seu-dominio.com` (mudar de localhost)
- [ ] `BASE_URL=https://seu-dominio.com` (mudar de localhost)
- [ ] `JWT_SECRET=` (gerar nova chave única para produção)
- [ ] `DB_HOST=localhost` (verificar se está correto)
- [ ] `DB_NAME=` (verificar se o banco existe na VPS)
- [ ] `PORT=` (verificar se porta está livre)
- [ ] `STRIPE_SECRET_KEY=` (usar chave de PRODUÇÃO, não teste)
- [ ] `STRIPE_WEBHOOK_SECRET=` (webhook de PRODUÇÃO)

---

## 🔍 Exemplo: Comparação Local vs Produção

### .env Local (Desenvolvimento)

```env
# Banco
DB_HOST=localhost
DB_PORT=5432
DB_NAME=calculadora_reajuste
DB_USER=postgres
DB_PASSWORD=senha123

# Servidor
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# JWT
JWT_SECRET=chave_dev_123

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_USER=seu-email@gmail.com
SMTP_PASS=senha_app
SMTP_FROM=seu-email@gmail.com
BASE_URL=http://localhost:3000

# Stripe (TESTE)
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PLANO_ANUAL_PRICE_ID=price_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_test_xxxxx
```

### .env VPS (Produção)

```env
# Banco (pode ser igual se mesmo servidor)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=calculadora_reajuste
DB_USER=postgres
DB_PASSWORD=senha123

# Servidor (AJUSTAR!)
PORT=3001
NODE_ENV=production  # ⚠️ MUDAR!
FRONTEND_URL=https://calculadora.seudominio.com  # ⚠️ MUDAR!

# JWT (GERAR NOVA!)
JWT_SECRET=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456  # ⚠️ NOVA CHAVE!

# SMTP (AJUSTAR URLs)
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=SG.sua_api_key
SMTP_FROM=noreply@seudominio.com  # ⚠️ AJUSTAR!
BASE_URL=https://calculadora.seudominio.com  # ⚠️ MUDAR!

# Stripe (PRODUÇÃO!)
STRIPE_SECRET_KEY=sk_live_xxxxx  # ⚠️ CHAVE DE PRODUÇÃO!
STRIPE_PLANO_ANUAL_PRICE_ID=price_live_xxxxx  # ⚠️ PRICE ID DE PRODUÇÃO!
STRIPE_WEBHOOK_SECRET=whsec_live_xxxxx  # ⚠️ WEBHOOK DE PRODUÇÃO!
```

---

## 🚀 Passo a Passo Rápido

### 1. Copiar .env Local

```bash
# Na VPS
cd /www/recalcula_preco
cp .env.example .env
nano .env
```

### 2. Colar Conteúdo do .env Local

Cole o conteúdo do seu `.env` local.

### 3. Ajustar Variáveis Críticas

Edite estas linhas:

```env
# Mudar para produção
NODE_ENV=production

# Mudar para domínio real
FRONTEND_URL=https://seu-dominio.com
BASE_URL=https://seu-dominio.com

# Gerar nova chave JWT
JWT_SECRET=$(openssl rand -hex 32)
# Cole o resultado aqui

# Verificar Stripe (usar chaves de PRODUÇÃO)
STRIPE_SECRET_KEY=sk_live_xxxxx
```

### 4. Salvar e Verificar

```bash
# Salvar (Ctrl+X, Y, Enter no nano)

# Verificar se está correto
cat .env | grep -E "NODE_ENV|FRONTEND_URL|BASE_URL|JWT_SECRET"
```

---

## ⚠️ Erros Comuns

### Erro 1: "Token inválido" após deploy

**Causa:** Usou a mesma `JWT_SECRET` do desenvolvimento.

**Solução:** Gerar nova chave:
```bash
openssl rand -hex 32
```

### Erro 2: Links de email quebrados

**Causa:** `BASE_URL` ainda aponta para `localhost`.

**Solução:** Mudar para domínio real:
```env
BASE_URL=https://seu-dominio.com
```

### Erro 3: Stripe não funciona

**Causa:** Usando chaves de TESTE em produção.

**Solução:** Usar chaves de PRODUÇÃO:
```env
STRIPE_SECRET_KEY=sk_live_xxxxx  # Não sk_test_xxxxx
```

### Erro 4: Banco de dados não conecta

**Causa:** `DB_NAME` ou `DB_USER` incorretos.

**Solução:** Verificar se banco existe:
```bash
# Na VPS
sudo -u postgres psql -l
```

---

## ✅ Verificação Final

Antes de iniciar a aplicação, verifique:

```bash
# Verificar variáveis críticas
grep -E "NODE_ENV|FRONTEND_URL|BASE_URL|JWT_SECRET" .env

# Deve mostrar:
# NODE_ENV=production
# FRONTEND_URL=https://seu-dominio.com
# BASE_URL=https://seu-dominio.com
# JWT_SECRET=chave_aleatoria_64_caracteres
```

---

## 🎯 Resumo

**Pode colar o `.env` local, mas AJUSTE:**

1. ✅ `NODE_ENV=production`
2. ✅ `FRONTEND_URL` → domínio real
3. ✅ `BASE_URL` → domínio real
4. ✅ `JWT_SECRET` → gerar nova chave
5. ✅ `STRIPE_SECRET_KEY` → chave de PRODUÇÃO
6. ✅ `STRIPE_WEBHOOK_SECRET` → webhook de PRODUÇÃO

**O resto pode ficar igual!** 🚀

