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

## 2. Definir Senha para o Usuário postgres (Recomendado)

Por padrão, o PostgreSQL pode não ter senha configurada. É recomendado definir uma senha para maior segurança:

### macOS/Linux:

```bash
# Acessar o PostgreSQL (sem senha)
psql -U postgres

# Dentro do psql, execute:
ALTER USER postgres WITH PASSWORD 'sua_senha_segura_aqui';

# Sair do psql
\q
```

**Exemplo:**
```sql
ALTER USER postgres WITH PASSWORD 'minhasenha123';
```

### Windows:

1. Abra o **SQL Shell (psql)** ou **Command Prompt**
2. Quando pedir senha, pressione **Enter** (se não tiver senha)
3. Execute:
```sql
ALTER USER postgres WITH PASSWORD 'sua_senha_segura_aqui';
```

### Se não conseguir acessar sem senha:

**macOS (com Homebrew):**
```bash
# Acessar como usuário do sistema
psql postgres

# Ou se tiver problemas:
psql -d postgres -U $(whoami)
```

**Linux:**
```bash
# Acessar como usuário postgres do sistema
sudo -u postgres psql

# Depois execute:
ALTER USER postgres WITH PASSWORD 'sua_senha_segura_aqui';
```

## 3. Criar o Banco de Dados

```bash
# Acessar o PostgreSQL
psql -U postgres
# (Se configurou senha, digite a senha quando pedir)

# Criar o banco de dados
CREATE DATABASE calculadora_reajuste;

# Verificar se foi criado
\l

# Sair do psql
\q
```

## 4. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=calculadora_reajuste
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui
```

**OU** configure as variáveis de ambiente diretamente no sistema.

## 5. Instalar Dependências

```bash
npm install
```

## 6. Iniciar o Servidor

```bash
npm start
```

O servidor irá criar automaticamente as tabelas necessárias na primeira execução.

## Notas

- Se você já tinha dados no SQLite, será necessário migrar manualmente ou usar uma ferramenta de migração.
- As tabelas serão criadas automaticamente na primeira execução.
- Certifique-se de que o PostgreSQL está rodando antes de iniciar o servidor.

