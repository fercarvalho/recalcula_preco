# 🔧 Preparar Projeto para Upload via Git

Este guia te ajuda a preparar seu projeto antes de fazer upload para a VPS via Git.

---

## ✅ Checklist de Preparação

Antes de fazer push para o repositório remoto, verifique:

- [ ] Git está inicializado
- [ ] `.gitignore` está configurado corretamente
- [ ] Arquivos sensíveis não estão no Git
- [ ] Todos os arquivos necessários estão commitados
- [ ] Repositório remoto está configurado (GitHub/GitLab)
- [ ] Arquivos de documentação estão incluídos

---

## 📋 Passo a Passo

### 1. Verificar Status do Git

```bash
# Verificar se Git está inicializado
git status
```

**Se aparecer erro:** Git não está inicializado, veja passo 2.

**Se aparecer "working tree clean":** ✅ Git está OK, vá para passo 3.

### 2. Inicializar Git (se necessário)

```bash
# Inicializar repositório Git
git init

# Criar branch main (se necessário)
git branch -M main
```

### 3. Verificar .gitignore

Verifique se o arquivo `.gitignore` contém:

```gitignore
node_modules/
database.sqlite
.env
*.log
.DS_Store
logs/
.env.local
.env.*.local
```

**✅ Seu `.gitignore` já está correto!**

### 4. Verificar Arquivos Sensíveis

**⚠️ IMPORTANTE:** Certifique-se de que estes arquivos NÃO estão no Git:

```bash
# Verificar se .env está sendo rastreado (NÃO DEVE ESTAR)
git ls-files | grep "\.env$"

# Se aparecer algo, remover:
git rm --cached .env
```

**Arquivos que NÃO devem estar no Git:**
- ❌ `.env` (contém senhas e chaves)
- ❌ `node_modules/` (muito grande, será instalado na VPS)
- ❌ `*.log` (logs são temporários)
- ❌ `database.sqlite` (se usar SQLite)

### 5. Adicionar Arquivos ao Git

```bash
# Ver quais arquivos serão adicionados
git status

# Adicionar todos os arquivos (exceto os do .gitignore)
git add .

# Verificar o que será commitado
git status
```

**Deve incluir:**
- ✅ `server.js`
- ✅ `package.json`
- ✅ `frontend/` (exceto node_modules)
- ✅ `.env.example`
- ✅ Arquivos de documentação (`.md`)
- ✅ `deploy.sh`
- ✅ `ecosystem.config.js`
- ✅ `nginx-example.conf`

**NÃO deve incluir:**
- ❌ `.env`
- ❌ `node_modules/`
- ❌ `*.log`

### 6. Fazer Commit

```bash
# Fazer commit inicial (se for primeiro commit)
git commit -m "Projeto pronto para deploy na VPS"

# OU se já tiver commits, adicionar novos arquivos:
git commit -m "Adicionar arquivos de deploy e documentação"
```

### 7. Criar Repositório Remoto

Você precisa criar um repositório no GitHub, GitLab ou Bitbucket:

#### Opção A: GitHub

1. Acesse: https://github.com/new
2. Nome do repositório: `calculadora-reajuste`
3. Descrição: "Calculadora de Reajuste de Preços"
4. Escolha: **Privado** (recomendado) ou Público
5. **NÃO** marque "Initialize with README"
6. Clique em "Create repository"

#### Opção B: GitLab

1. Acesse: https://gitlab.com/projects/new
2. Nome do projeto: `calculadora-reajuste`
3. Visibilidade: **Privado** (recomendado)
4. Clique em "Create project"

### 8. Adicionar Remote e Fazer Push

```bash
# Adicionar repositório remoto
git remote add origin https://github.com/SEU-USUARIO/calculadora-reajuste.git

# OU se usar GitLab:
# git remote add origin https://gitlab.com/SEU-USUARIO/calculadora-reajuste.git

# Verificar remote adicionado
git remote -v

# Fazer push
git push -u origin main
```

**Se pedir autenticação:**
- **GitHub:** Use Personal Access Token (não senha)
- **GitLab:** Use token ou senha

### 9. Verificar no Repositório

Acesse seu repositório no GitHub/GitLab e verifique:
- ✅ Todos os arquivos estão lá
- ✅ `.env` NÃO está lá
- ✅ `node_modules/` NÃO está lá
- ✅ Arquivos de documentação estão lá

---

## 🔐 Autenticação no GitHub

### Usando Token (Recomendado)

GitHub não aceita mais senha, precisa usar token:

1. **Gerar Token:**
   - GitHub → Settings → Developer settings
   - Personal access tokens → Tokens (classic)
   - Generate new token (classic)
   - Marque: `repo` (acesso completo aos repositórios)
   - Copiar token gerado

2. **Usar no Push:**
   ```bash
   # Ao fazer push, usar token como senha
   git push -u origin main
   # Username: seu-usuario
   # Password: SEU_TOKEN_AQUI
   ```

3. **OU configurar credenciais:**
   ```bash
   # macOS - salvar no Keychain
   git config --global credential.helper osxkeychain
   
   # Linux
   git config --global credential.helper store
   ```

### Usando SSH Key (Mais Seguro)

```bash
# Gerar chave SSH (se não tiver)
ssh-keygen -t ed25519 -C "seu-email@exemplo.com"

# Copiar chave pública
cat ~/.ssh/id_ed25519.pub

# Adicionar no GitHub:
# Settings → SSH and GPG keys → New SSH key
# Colar a chave pública

# Usar SSH URL no remote:
git remote set-url origin git@github.com:SEU-USUARIO/calculadora-reajuste.git
```

---

## 📦 Estrutura Final do Repositório

Seu repositório deve ter esta estrutura:

```
calculadora-reajuste/
├── .gitignore          ✅
├── .env.example        ✅
├── package.json        ✅
├── server.js           ✅
├── database.js         ✅
├── deploy.sh           ✅
├── ecosystem.config.js ✅
├── nginx-example.conf  ✅
├── frontend/           ✅
│   ├── package.json
│   ├── src/
│   └── ...
├── middleware/         ✅
├── services/           ✅
└── *.md                ✅ (documentação)
```

**NÃO deve ter:**
- ❌ `.env`
- ❌ `node_modules/`
- ❌ `*.log`
- ❌ `database.sqlite`

---

## ✅ Verificação Final

Antes de fazer push, execute:

```bash
# 1. Verificar status
git status

# 2. Verificar arquivos que serão commitados
git diff --cached --name-only

# 3. Verificar se .env não está sendo rastreado
git ls-files | grep "\.env$"
# (não deve retornar nada)

# 4. Verificar se node_modules não está sendo rastreado
git ls-files | grep "node_modules"
# (não deve retornar nada)

# 5. Ver tamanho do repositório
du -sh .git
```

---

## 🚀 Próximos Passos

Após fazer push:

1. ✅ Ir para a VPS
2. ✅ Clonar o repositório: `git clone https://github.com/...`
3. ✅ Configurar `.env` na VPS
4. ✅ Executar `./deploy.sh`

---

## 🆘 Problemas Comuns

### Problema 1: "fatal: not a git repository"

**Solução:**
```bash
git init
git branch -M main
```

### Problema 2: ".env está sendo rastreado"

**Solução:**
```bash
# Remover do Git (mas manter localmente)
git rm --cached .env

# Adicionar ao .gitignore (se não estiver)
echo ".env" >> .gitignore

# Commit
git add .gitignore
git commit -m "Remover .env do Git"
```

### Problema 3: "node_modules está sendo rastreado"

**Solução:**
```bash
# Remover do Git
git rm -r --cached node_modules
git rm -r --cached frontend/node_modules

# Verificar .gitignore
echo "node_modules/" >> .gitignore
echo "frontend/node_modules/" >> .gitignore

# Commit
git add .gitignore
git commit -m "Remover node_modules do Git"
```

### Problema 4: "Authentication failed"

**Solução:**
- Use Personal Access Token ao invés de senha
- Ou configure SSH key
- Veja seção "Autenticação no GitHub" acima

### Problema 5: "Repository not found"

**Solução:**
- Verificar se o repositório existe no GitHub/GitLab
- Verificar se o nome do usuário está correto
- Verificar permissões (se for privado, precisa ter acesso)

---

## 💡 Dicas

### Commit Semântico

Use mensagens de commit claras:

```bash
git commit -m "feat: adicionar arquivos de deploy"
git commit -m "docs: adicionar documentação de deploy"
git commit -m "fix: corrigir .gitignore"
```

### Tags para Versões

```bash
# Criar tag para versão
git tag -a v1.0.0 -m "Versão 1.0.0 - Deploy inicial"

# Enviar tags
git push origin --tags
```

### Branch de Desenvolvimento

```bash
# Criar branch de desenvolvimento
git checkout -b develop

# Trabalhar na branch develop
# Quando pronto, fazer merge para main
git checkout main
git merge develop
git push origin main
```

---

Pronto! Seu projeto está preparado para upload via Git! 🚀

