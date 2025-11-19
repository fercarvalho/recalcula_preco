# Configuração do PostgreSQL

Este projeto foi migrado de SQLite para PostgreSQL. Siga os passos abaixo para configurar:

## 1. Instalar PostgreSQL

Se ainda não tiver o PostgreSQL instalado:

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Baixe e instale do site oficial: https://www.postgresql.org/download/windows/

## 2. Criar o Banco de Dados

```bash
# Acessar o PostgreSQL
psql -U postgres

# Criar o banco de dados
CREATE DATABASE calculadora_reajuste;

# Sair do psql
\q
```

## 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=calculadora_reajuste
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui
```

**OU** configure as variáveis de ambiente diretamente no sistema.

## 4. Instalar Dependências

```bash
npm install
```

## 5. Iniciar o Servidor

```bash
npm start
```

O servidor irá criar automaticamente as tabelas necessárias na primeira execução.

## Notas

- Se você já tinha dados no SQLite, será necessário migrar manualmente ou usar uma ferramenta de migração.
- As tabelas serão criadas automaticamente na primeira execução.
- Certifique-se de que o PostgreSQL está rodando antes de iniciar o servidor.

