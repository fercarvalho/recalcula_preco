# 📦 Como Importar Banco de Dados Local para VPS

Este guia explica como fazer backup do banco local e restaurar na VPS.

---

## 🎯 Método Recomendado: pg_dump + pg_restore

### Passo 1: Fazer Dump do Banco Local

**No seu computador local:**

```bash
# Fazer dump do banco local
pg_dump -U fernandocarvalho -d calculadora_reajuste -h localhost > backup_banco.sql

# OU se preferir formato customizado (mais eficiente):
pg_dump -U fernandocarvalho -d calculadora_reajuste -h localhost -F c -f backup_banco.dump

# OU formato comprimido:
pg_dump -U fernandocarvalho -d calculadora_reajuste -h localhost -F c -Z 9 -f backup_banco.dump
```

**Parâmetros:**
- `-U`: usuário do banco
- `-d`: nome do banco
- `-h`: host (localhost)
- `-F c`: formato customizado (binário, mais eficiente)
- `-Z 9`: compressão máxima
- `-f`: arquivo de saída

**Se pedir senha:** Digite a senha do banco local (`xokjev-Dexne6-vivqez`)

---

### Passo 2: Transferir Arquivo para VPS

**Opção A: Usando SCP (do seu computador local)**

```bash
# Transferir arquivo .sql
scp backup_banco.sql seu-usuario@seu-ip-vps:/tmp/

# OU se usar formato customizado:
scp backup_banco.dump seu-usuario@seu-ip-vps:/tmp/
```

**Opção B: Usando SFTP (FileZilla)**

1. Abrir FileZilla
2. Conectar na VPS
3. Arrastar `backup_banco.sql` ou `backup_banco.dump` para `/tmp/` na VPS

---

### Passo 3: Restaurar na VPS

**Na VPS:**

```bash
# Se usou formato .sql:
psql -U fernandocarvalho -d calculadora_reajuste -h localhost < /tmp/backup_banco.sql

# OU se usou formato customizado (.dump):
pg_restore -U fernandocarvalho -d calculadora_reajuste -h localhost /tmp/backup_banco.dump

# Se pedir senha, digite: Korjup-qahwev-9tydbe
```

**⚠️ IMPORTANTE:** 
- O banco `calculadora_reajuste` deve já existir na VPS
- O usuário `fernandocarvalho` deve ter permissões no banco

---

## 🔄 Método Alternativo: Direto via psql

### Passo 1: Fazer Dump Local

```bash
# No seu computador local
pg_dump -U fernandocarvalho -d calculadora_reajuste -h localhost > backup.sql
```

### Passo 2: Enviar e Restaurar em Um Comando

```bash
# Do seu computador local, enviar e restaurar direto
pg_dump -U fernandocarvalho -d calculadora_reajuste -h localhost | \
  ssh seu-usuario@seu-ip-vps \
  "psql -U fernandocarvalho -d calculadora_reajuste -h localhost"
```

**Vantagem:** Não precisa salvar arquivo intermediário

---

## 📋 Passo a Passo Completo

### 1. No Computador Local

```bash
# 1. Fazer dump
pg_dump -U fernandocarvalho \
        -d calculadora_reajuste \
        -h localhost \
        -F c \
        -Z 9 \
        -f backup_banco.dump

# 2. Verificar se arquivo foi criado
ls -lh backup_banco.dump
```

### 2. Transferir para VPS

```bash
# Usando SCP
scp backup_banco.dump seu-usuario@seu-ip-vps:/tmp/
```

### 3. Na VPS

```bash
# 1. Verificar se arquivo chegou
ls -lh /tmp/backup_banco.dump

# 2. Restaurar banco
pg_restore -U fernandocarvalho \
           -d calculadora_reajuste \
           -h localhost \
           --clean \
           --if-exists \
           /tmp/backup_banco.dump

# 3. Verificar se restaurou
psql -U fernandocarvalho -d calculadora_reajuste -h localhost -c "\dt"

# 4. Limpar arquivo temporário
rm /tmp/backup_banco.dump
```

---

## ⚠️ Avisos Importantes

### 1. **Backup Antes de Restaurar**

Se já tiver dados na VPS, faça backup primeiro:

```bash
# Na VPS, antes de restaurar
pg_dump -U fernandocarvalho -d calculadora_reajuste -h localhost > backup_vps_antes.sql
```

### 2. **Limpar Dados Existentes (Opcional)**

Se quiser substituir completamente:

```bash
# Na VPS, limpar banco antes de restaurar
psql -U fernandocarvalho -d calculadora_reajuste -h localhost -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

**OU usar flag `--clean` no pg_restore:**
```bash
pg_restore -U fernandocarvalho -d calculadora_reajuste -h localhost --clean /tmp/backup_banco.dump
```

### 3. **Verificar Permissões**

Certifique-se de que o usuário tem permissões:

```bash
# Na VPS
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE calculadora_reajuste TO fernandocarvalho;"
```

---

## 🧪 Verificar se Funcionou

### Na VPS, após restaurar:

```bash
# 1. Conectar no banco
psql -U fernandocarvalho -d calculadora_reajuste -h localhost

# 2. Verificar tabelas
\dt

# 3. Contar registros
SELECT COUNT(*) FROM usuarios;
SELECT COUNT(*) FROM itens;
SELECT COUNT(*) FROM categorias;

# 4. Ver alguns dados
SELECT * FROM usuarios LIMIT 5;

# 5. Sair
\q
```

---

## 🆘 Solução de Problemas

### Erro: "permission denied"

**Causa:** Usuário não tem permissão

**Solução:**
```bash
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE calculadora_reajuste TO fernandocarvalho;"
```

### Erro: "database does not exist"

**Causa:** Banco não foi criado

**Solução:**
```bash
sudo -u postgres psql -c "CREATE DATABASE calculadora_reajuste;"
```

### Erro: "authentication failed"

**Causa:** Senha incorreta

**Solução:** Verificar senha no `.env` da VPS

### Erro: "relation already exists"

**Causa:** Tabelas já existem

**Solução:** Usar `--clean` no pg_restore:
```bash
pg_restore -U fernandocarvalho -d calculadora_reajuste -h localhost --clean /tmp/backup_banco.dump
```

---

## 📊 Comparação de Formatos

| Formato | Extensão | Vantagens | Desvantagens |
|--------|----------|-----------|--------------|
| **SQL** | `.sql` | Legível, editável | Arquivo maior |
| **Custom** | `.dump` | Compacto, rápido | Binário, não editável |
| **Tar** | `.tar` | Múltiplos arquivos | Mais complexo |

**Recomendado:** Formato customizado (`.dump`) com compressão

---

## 🚀 Script Automatizado

Criar script `importar_banco.sh`:

```bash
#!/bin/bash
# importar_banco.sh

echo "📦 Fazendo dump do banco local..."
pg_dump -U fernandocarvalho \
        -d calculadora_reajuste \
        -h localhost \
        -F c \
        -Z 9 \
        -f backup_banco.dump

echo "📤 Enviando para VPS..."
scp backup_banco.dump seu-usuario@seu-ip-vps:/tmp/

echo "📥 Restaurando na VPS..."
ssh seu-usuario@seu-ip-vps \
    "pg_restore -U fernandocarvalho -d calculadora_reajuste -h localhost --clean /tmp/backup_banco.dump && rm /tmp/backup_banco.dump"

echo "✅ Importação concluída!"
```

**Uso:**
```bash
chmod +x importar_banco.sh
./importar_banco.sh
```

---

## ✅ Checklist

- [ ] Banco `calculadora_reajuste` criado na VPS
- [ ] Usuário `fernandocarvalho` existe na VPS
- [ ] Usuário tem permissões no banco
- [ ] Dump feito do banco local
- [ ] Arquivo transferido para VPS
- [ ] Banco restaurado na VPS
- [ ] Dados verificados

---

Pronto! Agora você sabe como importar seu banco local para a VPS! 🚀

