# 📤 Como Fazer Upload dos Arquivos para a VPS

Este guia explica as 3 principais formas de fazer upload dos arquivos do projeto para a VPS da Hostinger.

---

## 🎯 Opções Disponíveis

1. **Git** (Recomendado) - Melhor para atualizações futuras
2. **SCP** - Rápido e direto via terminal
3. **SFTP** - Interface gráfica, mais fácil para iniciantes

---

## 📋 Pré-requisitos

Antes de começar, você precisa de:

- ✅ Acesso SSH à VPS (usuário e senha, ou chave SSH)
- ✅ IP ou domínio da VPS
- ✅ Projeto pronto localmente

**Obter informações de acesso:**
- Painel da Hostinger → VPS → Detalhes → Informações de SSH

---

## 🚀 Opção 1: Git (Recomendado)

### ✅ Vantagens
- ✅ Fácil de atualizar depois (só fazer `git pull`)
- ✅ Versionamento do código
- ✅ Histórico de mudanças
- ✅ Backup automático

### ⚠️ Requisitos
- Repositório Git configurado (GitHub, GitLab, Bitbucket, etc.)
- Git instalado na VPS

### 📝 Passo a Passo

#### 1. Preparar Repositório (se ainda não tiver)

**No seu computador local:**

```bash
# Se ainda não inicializou Git no projeto
cd /caminho/do/seu/projeto
git init
git add .
git commit -m "Primeiro commit - projeto pronto para deploy"

# Criar repositório no GitHub/GitLab
# Depois adicionar remote:
git remote add origin https://github.com/seu-usuario/calculadora-reajuste.git
git push -u origin main
```

#### 2. Na VPS - Clonar o Repositório

```bash
# Conectar na VPS
ssh seu-usuario@seu-ip-vps

# Criar diretório (se não existir)
sudo mkdir -p /www/recalcula_preco
sudo chown -R $USER:$USER /www/recalcula_preco
cd /www/recalcula_preco

# Clonar o repositório
git clone https://github.com/seu-usuario/calculadora-reajuste.git .

# OU se já tiver o diretório com arquivos antigos:
git clone https://github.com/seu-usuario/calculadora-reajuste.git temp
mv temp/* .
mv temp/.git .
rmdir temp
```

#### 3. Verificar Arquivos

```bash
# Verificar se os arquivos foram baixados
ls -la

# Deve mostrar:
# - server.js
# - package.json
# - frontend/
# - etc.
```

#### 4. Atualizar no Futuro

```bash
# Na VPS, dentro do diretório do projeto
cd /www/recalcula_preco
git pull origin main

# Depois executar deploy
./deploy.sh
```

### 🔐 Git com Autenticação

#### Usando Token (GitHub)

```bash
# Na VPS, ao clonar:
git clone https://SEU_TOKEN@github.com/seu-usuario/calculadora-reajuste.git .
```

**Gerar token no GitHub:**
1. GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token
3. Copiar token
4. Usar no comando acima

#### Usando SSH Key

```bash
# Na VPS, gerar chave SSH (se não tiver)
ssh-keygen -t ed25519 -C "vps@hostinger"

# Copiar chave pública
cat ~/.ssh/id_ed25519.pub

# Adicionar no GitHub/GitLab:
# Settings → SSH Keys → Add SSH Key
```

---

## 📦 Opção 2: SCP (Secure Copy)

### ✅ Vantagens
- ✅ Rápido e direto
- ✅ Via terminal (sem interface gráfica)
- ✅ Bom para upload único

### ⚠️ Desvantagens
- ⚠️ Atualizações futuras precisam fazer upload completo novamente
- ⚠️ Não mantém histórico

### 📝 Passo a Passo

#### 1. Preparar Arquivos Localmente

```bash
# No seu computador local
cd /caminho/do/seu/projeto

# Verificar o que será enviado
ls -la
```

#### 2. Fazer Upload com SCP

**Do seu computador local:**

```bash
# Upload completo do diretório
scp -r /caminho/local/calculadora-reajuste/* seu-usuario@seu-ip-vps:/www/recalcula_preco/

# OU se quiser incluir arquivos ocultos (.env.example, etc.):
scp -r /caminho/local/calculadora-reajuste/. seu-usuario@seu-ip-vps:/www/recalcula_preco/
```

**Exemplo real:**
```bash
# Se seu projeto está em ~/projetos/calculadora-reajuste
scp -r ~/projetos/calculadora-reajuste/* fernando@192.168.1.100:/www/recalcula_preco/
```

#### 3. Com Porta Customizada

```bash
# Se a VPS usa porta SSH diferente (não 22)
scp -P 2222 -r /caminho/local/calculadora-reajuste/* usuario@vps:/www/recalcula_preco/
```

#### 4. Excluir node_modules (Opcional)

```bash
# Upload sem node_modules (mais rápido)
scp -r --exclude='node_modules' \
    --exclude='.git' \
    /caminho/local/calculadora-reajuste/* \
    usuario@vps:/www/recalcula_preco/
```

**OU usar rsync (melhor para excluir arquivos):**

```bash
# Instalar rsync (se não tiver)
# macOS: já vem instalado
# Linux: sudo apt install rsync

# Upload excluindo node_modules e .git
rsync -avz --exclude='node_modules' \
          --exclude='.git' \
          --exclude='.env' \
          /caminho/local/calculadora-reajuste/ \
          usuario@vps:/www/recalcula_preco/
```

### 🔐 SCP com Chave SSH

```bash
# Usar chave SSH específica
scp -i ~/.ssh/id_rsa -r projeto/* usuario@vps:/www/recalcula_preco/
```

---

## 🖥️ Opção 3: SFTP (Interface Gráfica)

### ✅ Vantagens
- ✅ Interface visual (arrastar e soltar)
- ✅ Fácil para iniciantes
- ✅ Ver estrutura de arquivos

### ⚠️ Desvantagens
- ⚠️ Mais lento que SCP
- ⚠️ Atualizações futuras precisam fazer upload completo

### 📝 Passo a Passo

#### 1. Escolher Cliente SFTP

**Opções populares:**
- **FileZilla** (Windows, macOS, Linux) - Gratuito
- **WinSCP** (Windows) - Gratuito
- **Cyberduck** (macOS, Windows) - Gratuito
- **Transmit** (macOS) - Pago

#### 2. Configurar Conexão (FileZilla)

1. **Abrir FileZilla**
2. **Clicar em "Arquivo" → "Gerenciador de Sites"**
3. **Clicar em "Novo Site"**
4. **Preencher:**
   - **Protocolo:** SFTP - SSH File Transfer Protocol
   - **Host:** IP da VPS (ex: `192.168.1.100`) ou domínio
   - **Porta:** 22 (ou porta customizada)
   - **Tipo de login:** Normal
   - **Usuário:** seu-usuario
   - **Senha:** sua-senha
5. **Clicar em "Conectar"**

#### 3. Fazer Upload

1. **Lado esquerdo (Local):**
   - Navegar até a pasta do projeto local
   - Selecionar todos os arquivos

2. **Lado direito (VPS):**
   - Navegar até `/www/recalcula_preco`
   - Se não existir, criar a pasta

3. **Arrastar e soltar:**
   - Arrastar arquivos do lado esquerdo para o direito
   - Aguardar upload completar

#### 4. Excluir Arquivos Desnecessários

**Antes de fazer upload, excluir localmente:**
- `node_modules/` (será instalado na VPS)
- `.git/` (se não usar Git)
- `.env` (será criado na VPS)

**OU configurar no FileZilla:**
- Editar → Configurações → Transferências
- Marcar "Ocultar arquivos de sistema"
- Adicionar filtros para `node_modules`, `.git`

---

## 🔍 Comparação das Opções

| Característica | Git | SCP | SFTP |
|---------------|-----|-----|------|
| **Facilidade** | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| **Velocidade** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Atualizações** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| **Requisitos** | Repositório Git | Terminal | Cliente SFTP |
| **Recomendado para** | Projetos em desenvolvimento | Upload único rápido | Iniciantes |

---

## ✅ Recomendação

### Para Primeiro Deploy:

**Use Git** se:
- ✅ Já tem repositório configurado
- ✅ Quer facilitar atualizações futuras
- ✅ Quer manter histórico

**Use SCP** se:
- ✅ Quer fazer upload rápido agora
- ✅ Não tem repositório Git
- ✅ Confortável com terminal

**Use SFTP** se:
- ✅ Prefere interface gráfica
- ✅ Não se sente confortável com terminal
- ✅ Primeira vez fazendo deploy

### Para Atualizações Futuras:

**Sempre use Git** - muito mais fácil:
```bash
cd /www/recalcula_preco
git pull
./deploy.sh
```

---

## 🛠️ Solução de Problemas

### Problema 1: "Permission Denied" no SCP/SFTP

**Causa:** Permissões incorretas no diretório de destino

**Solução:**
```bash
# Na VPS
sudo mkdir -p /www/recalcula_preco
sudo chown -R $USER:$USER /www/recalcula_preco
sudo chmod 755 /www/recalcula_preco
```

### Problema 2: Upload Muito Lento

**Soluções:**
- Excluir `node_modules` (instalar na VPS depois)
- Usar `rsync` ao invés de `scp`
- Comprimir antes de enviar:
  ```bash
  # Local
  tar -czf projeto.tar.gz calculadora-reajuste/
  scp projeto.tar.gz usuario@vps:/tmp/
  
# Na VPS
cd /www/recalcula_preco
  tar -xzf /tmp/projeto.tar.gz
  ```

### Problema 3: Arquivo .env Não Foi Enviado

**Causa:** `.env` está no `.gitignore` (correto!)

**Solução:**
```bash
# Na VPS, criar .env a partir do exemplo
cd /www/recalcula_preco
cp .env.example .env
nano .env  # Editar com suas credenciais
```

### Problema 4: Git Clone Falha

**Causa:** Repositório privado sem autenticação

**Solução:**
```bash
# Usar token ou SSH key (veja seção "Git com Autenticação" acima)
```

---

## 📋 Checklist Pós-Upload

Após fazer upload, verificar:

- [ ] Todos os arquivos foram enviados
- [ ] Estrutura de pastas está correta
- [ ] Arquivo `.env.example` está presente
- [ ] Arquivo `package.json` está presente
- [ ] Pasta `frontend/` está presente
- [ ] Permissões estão corretas (`ls -la`)
- [ ] Arquivo `.env` será criado (não enviar o real!)

---

## 🎯 Próximos Passos

Após fazer upload:

1. ✅ Configurar `.env` (veja passo 3)
2. ✅ Executar `./deploy.sh` (veja passo 4)
3. ✅ Verificar se aplicação está rodando

---

## 💡 Dicas Extras

### Upload Incremental com rsync

```bash
# Sincronizar apenas arquivos modificados
rsync -avz --progress \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='.env' \
    /caminho/local/calculadora-reajuste/ \
    usuario@vps:/www/recalcula_preco/
```

### Script de Upload Automatizado

Criar script `upload.sh` local:

```bash
#!/bin/bash
# upload.sh

rsync -avz --progress \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='.env' \
    --exclude='logs' \
    ./ \
    usuario@vps:/www/recalcula_preco/

echo "✅ Upload concluído!"
echo "Agora na VPS, execute: ./deploy.sh"
```

**Uso:**
```bash
chmod +x upload.sh
./upload.sh
```

---

Pronto! Agora você sabe como fazer upload dos arquivos para a VPS! 🚀

