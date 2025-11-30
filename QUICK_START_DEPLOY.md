# ⚡ Início Rápido - Deploy VPS

## 🎯 Resumo Rápido

Este guia rápido te ajuda a fazer o deploy na VPS da Hostinger em **5 minutos**.

## 📍 Diretório do Projeto

O projeto será instalado em:
- **`/www/recalcula_preço`** (se a VPS aceitar UTF-8)
- **`/www/recalcula_preco`** (se não aceitar UTF-8)

---

## 📋 Checklist Rápido

### 1. Na VPS (via SSH)

```bash
# Criar diretório
# Tente primeiro com UTF-8 (ç)
sudo mkdir -p /www/recalcula_preço
sudo chown -R $USER:$USER /www/recalcula_preço
cd /www/recalcula_preço

# Se der erro com UTF-8, use sem acento:
# sudo mkdir -p /www/recalcula_preco
# sudo chown -R $USER:$USER /www/recalcula_preco
# cd /www/recalcula_preco

# Fazer upload dos arquivos (Git, SCP ou SFTP)
# ...

# Criar banco de dados
sudo -u postgres psql
CREATE DATABASE calculadora_reajuste;
CREATE USER calculadora_user WITH PASSWORD 'senha_segura';
GRANT ALL PRIVILEGES ON DATABASE calculadora_reajuste TO calculadora_user;
\q

# Configurar .env
cp .env.example .env
nano .env  # Editar com suas configurações

# Instalar e buildar
npm install --production
cd frontend && npm install && npm run build && cd ..

# Iniciar com PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Seguir instruções
```

### 2. Configurar Nginx (Opcional)

```bash
# Copiar configuração
sudo cp nginx-example.conf /etc/nginx/sites-available/calculadora-reajuste

# Editar domínio e porta
sudo nano /etc/nginx/sites-available/calculadora-reajuste

# Ativar
sudo ln -s /etc/nginx/sites-available/calculadora-reajuste /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Configurar SSL (Opcional)

```bash
sudo certbot --nginx -d calculadora.seudominio.com
```

---

## ✅ Pronto!

Acesse: `http://calculadora.seudominio.com` (ou `https://` se configurou SSL)

---

## 📚 Documentação Completa

Para instruções detalhadas, veja: **DEPLOY_VPS.md**

---

## 🔧 Comandos Úteis

```bash
# Ver status
pm2 status

# Ver logs
pm2 logs calculadora-reajuste

# Reiniciar
pm2 restart calculadora-reajuste

# Atualizar (se usar Git)
git pull && ./deploy.sh
```

---

## ⚠️ Importante

- ✅ Use um **banco de dados diferente** para cada projeto
- ✅ Use uma **porta diferente** para cada projeto (ou domínios diferentes)
- ✅ Use **JWT_SECRET diferente** para cada projeto
- ✅ Nunca compartilhe o arquivo `.env`

