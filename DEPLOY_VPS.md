# 🚀 Guia de Deploy na VPS Hostinger

Este guia detalha como fazer o deploy da Calculadora de Reajuste na sua VPS da Hostinger, garantindo que este projeto seja **totalmente independente** dos outros projetos já hospedados.

## 📍 Diretório do Projeto

O projeto será instalado em:
- **`/www/recalcula_preço`** (se a VPS aceitar UTF-8)
- **`/www/recalcula_preco`** (se não aceitar UTF-8)

---

## 📋 Pré-requisitos

- ✅ Acesso SSH à sua VPS Hostinger
- ✅ Node.js instalado (versão 18 ou superior)
- ✅ PostgreSQL instalado e configurado
- ✅ PM2 instalado globalmente
- ✅ Nginx instalado (opcional, mas recomendado para múltiplos projetos)

---

## 🏗️ Estrutura do Projeto na VPS

O projeto será instalado no diretório:

```
/www/recalcula_preço/  # (ou /www/recalcula_preco se não aceitar UTF-8)
├── server.js
├── package.json
├── .env
├── frontend/
└── ...
```

**⚠️ Nota sobre o nome do diretório:**
- Se a VPS aceitar UTF-8: `/www/recalcula_preço`
- Se não aceitar UTF-8: `/www/recalcula_preco`

**Cada projeto terá:**
- ✅ Seu próprio diretório
- ✅ Seu próprio banco de dados PostgreSQL
- ✅ Sua própria porta (ou domínio/subdomínio)
- ✅ Sua própria instância PM2
- ✅ Suas próprias variáveis de ambiente

---

## 📦 Passo 1: Preparar o Ambiente na VPS

### 1.1 Conectar via SSH

```bash
ssh seu-usuario@seu-ip-vps
# ou
ssh seu-usuario@seu-dominio.com
```

### 1.2 Criar Diretório do Projeto

```bash
# Criar diretório do projeto
# Tente primeiro com UTF-8 (ç)
sudo mkdir -p /www/recalcula_preço
sudo chown -R $USER:$USER /www/recalcula_preço
cd /www/recalcula_preço

# Se der erro com UTF-8, use sem acento:
# sudo mkdir -p /www/recalcula_preco
# sudo chown -R $USER:$USER /www/recalcula_preco
# cd /www/recalcula_preco
```

### 1.3 Verificar Instalações

```bash
# Verificar Node.js
node --version  # Deve ser 18.x ou superior
npm --version

# Verificar PostgreSQL
psql --version

# Verificar PM2
pm2 --version
```

**Se não tiver instalado:**

```bash
# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2 globalmente
sudo npm install -g pm2

# Instalar PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib
```

---

## 📤 Passo 2: Fazer Upload dos Arquivos

### Opção A: Usando Git (Recomendado)

```bash
# Na VPS, dentro do diretório do projeto
cd /www/recalcula_preço  # ou /www/recalcula_preco

# Clonar o repositório (se usar Git)
git clone https://github.com/seu-usuario/calculadora-reajuste.git .

# OU fazer pull se já tiver clonado
git pull origin main
```

### Opção B: Usando SCP (do seu computador local)

```bash
# Do seu computador local
scp -r /caminho/local/calculadora-reajuste/* seu-usuario@seu-ip-vps:/www/recalcula_preço/
# ou se não aceitar UTF-8:
# scp -r /caminho/local/calculadora-reajuste/* seu-usuario@seu-ip-vps:/www/recalcula_preco/
```

### Opção C: Usando SFTP

Use um cliente SFTP como FileZilla, WinSCP ou Cyberduck para fazer upload dos arquivos.

---

## 🗄️ Passo 3: Configurar Banco de Dados PostgreSQL

### 3.1 Criar Banco de Dados Dedicado

```bash
# Acessar PostgreSQL
sudo -u postgres psql

# Dentro do psql, criar banco de dados específico para este projeto
CREATE DATABASE calculadora_reajuste;

# Criar usuário específico (opcional, mas recomendado)
CREATE USER calculadora_user WITH PASSWORD 'senha_segura_aqui';
GRANT ALL PRIVILEGES ON DATABASE calculadora_reajuste TO calculadora_user;

# Sair do psql
\q
```

**⚠️ IMPORTANTE:** Use um banco de dados e usuário **diferentes** para cada projeto!

### 3.2 Verificar Conexão

```bash
# Testar conexão
psql -U calculadora_user -d calculadora_reajuste -h localhost
```

---

## ⚙️ Passo 4: Configurar Variáveis de Ambiente

### 4.1 Criar Arquivo .env

```bash
cd /www/recalcula_preço  # ou /www/recalcula_preco

# Copiar exemplo
cp .env.example .env

# Editar o arquivo
nano .env
```

### 4.2 Configurar .env

Edite o arquivo `.env` com suas configurações:

```env
# Banco de dados (use o banco criado no passo 3)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=calculadora_reajuste
DB_USER=calculadora_user
DB_PASSWORD=senha_segura_aqui

# Servidor (use uma porta diferente dos outros projetos)
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://calculadora.seudominio.com

# JWT (gere uma chave única para este projeto)
JWT_SECRET=$(openssl rand -hex 32)

# SMTP (configurações de email)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.sua_api_key_sendgrid
SMTP_FROM=noreply@seudominio.com
BASE_URL=https://calculadora.seudominio.com

# Stripe (chaves de PRODUÇÃO)
STRIPE_SECRET_KEY=sk_live_sua_chave_aqui
STRIPE_PLANO_ANUAL_PRICE_ID=price_xxxxx
STRIPE_PLANO_UNICO_PRICE_ID=price_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

**🔐 Segurança:**
- ✅ Use senhas fortes e únicas
- ✅ Nunca compartilhe o arquivo `.env`
- ✅ Gere uma `JWT_SECRET` única para cada projeto
  - **Como gerar:** `openssl rand -hex 32` (veja `GERAR_JWT_SECRET.md` para mais detalhes)

---

## 🚀 Passo 5: Instalar Dependências e Fazer Build

### 5.1 Instalar Dependências

```bash
cd /www/recalcula_preço  # ou /www/recalcula_preco

# Instalar dependências do backend
npm install --production

# Instalar dependências do frontend e fazer build
cd frontend
npm install
npm run build
cd ..
```

### 5.2 Criar Diretório de Logs

```bash
mkdir -p logs
```

---

## 🔧 Passo 6: Configurar PM2

### 6.1 Iniciar com PM2

```bash
cd /www/recalcula_preço  # ou /www/recalcula_preco

# Iniciar aplicação
pm2 start ecosystem.config.js

# Salvar configuração para reiniciar automaticamente
pm2 save

# Configurar PM2 para iniciar no boot
pm2 startup
# Siga as instruções que aparecerem
```

### 6.2 Verificar Status

```bash
# Ver status
pm2 status

# Ver logs
pm2 logs calculadora-reajuste

# Monitorar recursos
pm2 monit
```

**✅ A aplicação deve estar rodando na porta configurada no `.env` (ex: 3001)**

---

## 🌐 Passo 7: Configurar Nginx (Recomendado)

O Nginx permite que múltiplos projetos compartilhem a porta 80/443 usando domínios diferentes.

### 7.1 Instalar Nginx

```bash
sudo apt update
sudo apt install nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 7.2 Criar Configuração do Nginx

```bash
# Criar arquivo de configuração
sudo nano /etc/nginx/sites-available/calculadora-reajuste
```

**Conteúdo do arquivo:**

```nginx
server {
    listen 80;
    server_name calculadora.seudominio.com;  # Seu domínio ou subdomínio

    # Redirecionar HTTP para HTTPS (se tiver SSL)
    # return 301 https://$server_name$request_uri;

    # Se não tiver SSL, use esta configuração:
    location / {
        proxy_pass http://localhost:3001;  # Porta do seu projeto
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Tamanho máximo de upload (para webhooks do Stripe)
    client_max_body_size 10M;
}
```

### 7.3 Ativar Configuração

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/calculadora-reajuste /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

### 7.4 Configurar DNS

No painel da Hostinger, configure o DNS:

- **Tipo:** A
- **Nome:** calculadora (ou @ para domínio principal)
- **Valor:** IP da sua VPS

Ou use um subdomínio:
- **Tipo:** CNAME
- **Nome:** calculadora
- **Valor:** seudominio.com

---

## 🔒 Passo 8: Configurar SSL/HTTPS (Opcional mas Recomendado)

### 8.1 Instalar Certbot

```bash
sudo apt install certbot python3-certbot-nginx
```

### 8.2 Obter Certificado SSL

```bash
sudo certbot --nginx -d calculadora.seudominio.com
```

Siga as instruções. O Certbot configurará automaticamente o HTTPS.

---

## ✅ Passo 9: Verificar Deploy

### 9.1 Testar Aplicação

```bash
# Verificar se está rodando
pm2 status

# Ver logs
pm2 logs calculadora-reajuste --lines 50

# Testar endpoint
curl http://localhost:3001/api/auth/me
```

### 9.2 Acessar no Navegador

Acesse: `http://calculadora.seudominio.com` (ou `https://` se configurou SSL)

---

## 🔄 Comandos Úteis para Gerenciamento

### Gerenciar Aplicação PM2

```bash
# Ver status
pm2 status

# Ver logs
pm2 logs calculadora-reajuste

# Reiniciar
pm2 restart calculadora-reajuste

# Parar
pm2 stop calculadora-reajuste

# Iniciar
pm2 start calculadora-reajuste

# Deletar
pm2 delete calculadora-reajuste

# Monitorar recursos
pm2 monit
```

### Gerenciar Nginx

```bash
# Recarregar configuração
sudo systemctl reload nginx

# Reiniciar
sudo systemctl restart nginx

# Ver status
sudo systemctl status nginx

# Ver logs
sudo tail -f /var/log/nginx/error.log
```

### Atualizar Aplicação

```bash
cd /www/recalcula_preço  # ou /www/recalcula_preco

# Se usar Git
git pull origin main

# Executar script de deploy
chmod +x deploy.sh
./deploy.sh
```

---

## 🛠️ Solução de Problemas

### Aplicação não inicia

```bash
# Verificar logs
pm2 logs calculadora-reajuste --err

# Verificar se a porta está em uso
sudo netstat -tulpn | grep 3001

# Verificar variáveis de ambiente
pm2 env 0
```

### Erro de conexão com banco de dados

```bash
# Testar conexão
psql -U calculadora_user -d calculadora_reajuste -h localhost

# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql
```

### Nginx retorna 502 Bad Gateway

```bash
# Verificar se a aplicação está rodando
pm2 status

# Verificar logs do Nginx
sudo tail -f /var/log/nginx/error.log

# Verificar se a porta está correta no Nginx
sudo nano /etc/nginx/sites-available/calculadora-reajuste
```

### Porta já em uso

```bash
# Verificar qual processo está usando a porta
sudo lsof -i :3001

# Matar processo (se necessário)
sudo kill -9 PID
```

---

## 📝 Checklist de Deploy

- [ ] Node.js instalado (versão 18+)
- [ ] PostgreSQL instalado e rodando
- [ ] PM2 instalado globalmente
- [ ] Banco de dados criado e configurado
- [ ] Arquivo `.env` configurado com todas as variáveis
- [ ] Dependências instaladas (`npm install`)
- [ ] Frontend buildado (`npm run build` no diretório frontend)
- [ ] Aplicação iniciada com PM2
- [ ] PM2 configurado para iniciar no boot
- [ ] Nginx configurado (se usar)
- [ ] DNS configurado
- [ ] SSL configurado (se usar HTTPS)
- [ ] Aplicação acessível via navegador
- [ ] Logs verificados (sem erros)

---

## 🔐 Segurança

### Boas Práticas

1. ✅ **Use senhas fortes** para banco de dados e JWT
2. ✅ **Não commite o arquivo `.env`** (já está no `.gitignore`)
3. ✅ **Use HTTPS** em produção
4. ✅ **Mantenha dependências atualizadas**
5. ✅ **Configure firewall** (UFW) se necessário
6. ✅ **Use usuários diferentes** no PostgreSQL para cada projeto
7. ✅ **Monitore logs** regularmente

### Firewall (Opcional)

```bash
# Instalar UFW
sudo apt install ufw

# Permitir SSH
sudo ufw allow 22/tcp

# Permitir HTTP e HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Ativar firewall
sudo ufw enable
```

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs: `pm2 logs calculadora-reajuste`
2. Verifique o status: `pm2 status`
3. Verifique o Nginx: `sudo nginx -t`
4. Verifique o banco: `sudo systemctl status postgresql`

---

## 🎉 Pronto!

Sua aplicação está no ar e **totalmente isolada** dos outros projetos na mesma VPS!

Cada projeto tem:
- ✅ Seu próprio diretório
- ✅ Seu próprio banco de dados
- ✅ Sua própria instância PM2
- ✅ Sua própria configuração Nginx
- ✅ Suas próprias variáveis de ambiente

