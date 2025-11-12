# Calculadora de Reajuste de Preços - Vira-Latas

Sistema de cálculo de reajuste de preços para o estabelecimento Vira-Latas Hotdogs e Lanches.

## Tecnologias

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: Node.js + Express
- **Banco de Dados**: SQLite

## Instalação

### 1. Instalar dependências

```bash
npm install
```

### 2. Iniciar o servidor

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

## Migração de SQLite para PostgreSQL (opcional)

Se preferir usar PostgreSQL no futuro, você pode modificar o arquivo `database.js` para usar `pg` em vez de `sqlite3`.
