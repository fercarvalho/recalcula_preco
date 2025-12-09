# Recalcula Preço de Preços

Sistema de cálculo de reajuste de preços para lanchonetes.
## Autor

**Fernando Carvalho**

Este projeto é uma homenagem ao Vira-Latas Hotdogs e Lanches, lanchonete do meu pai.

Feito com ❤️ por aí

- 📧 Email: desenvolvimento@fercarvalho.com
- 📱 Instagram: [@cadeofer](https://instagram.com/cadeofer)

## Tecnologias

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: Node.js + Express
- **Banco de Dados**: PostgreSQL

## Instalação

### 1. Configurar PostgreSQL

Certifique-se de que o PostgreSQL está instalado e rodando. Veja o arquivo `CONFIGURACAO_POSTGRESQL.md` para instruções detalhadas.

Crie um arquivo `.env` na raiz do projeto com as configurações do banco:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=calculadora_reajuste
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui

# Google Gemini API (para Modo Estúdio)
GOOGLE_GEMINI_API_KEY=sua_chave_api_aqui
```

### 2. Criar o banco de dados

```bash
psql -U postgres
CREATE DATABASE calculadora_reajuste;
\q
```

### 3. Instalar dependências

```bash
npm install
```

### 4. Iniciar o servidor

```bash
npm start
```

Para desenvolvimento com auto-reload:

```bash
npm run dev
```

O servidor estará rodando em `http://localhost:3000`

## Deploy no VPS (Hostinger - Ubuntu)

### 1. Instalar Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Instalar PM2 (gerenciador de processos)

```bash
sudo npm install -g pm2
```

### 3. Fazer upload dos arquivos

Use SCP, SFTP ou Git para fazer upload dos arquivos para o VPS.

### 4. Instalar dependências no servidor

```bash
cd /caminho/do/projeto
npm install --production
```

### 5. Iniciar com PM2

```bash
pm2 start server.js --name calculadora-reajuste
pm2 save
pm2 startup
```

### 6. Configurar Nginx (opcional, para usar porta 80)

Crie um arquivo de configuração do Nginx:

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Estrutura do Banco de Dados

A tabela `itens` possui:
- `id`: ID único do item
- `categoria`: Categoria do item
- `nome`: Nome do item
- `valor`: Preço atual
- `valor_novo`: Preço ajustado (opcional)
- `created_at`: Data de criação
- `updated_at`: Data de atualização

## API Endpoints

- `GET /api/itens` - Obter todos os itens organizados por categoria
- `GET /api/itens/categoria/:categoria` - Obter itens de uma categoria
- `POST /api/itens` - Criar novo item
- `PUT /api/itens/:id` - Atualizar item
- `DELETE /api/itens/:id` - Deletar item
- `GET /api/categorias` - Obter lista de categorias

## Migração de SQLite para PostgreSQL

O projeto foi migrado de SQLite para PostgreSQL. As tabelas são criadas automaticamente na primeira execução do servidor.

Se você tinha dados no SQLite anterior, será necessário migrar manualmente ou usar uma ferramenta de migração de dados.
