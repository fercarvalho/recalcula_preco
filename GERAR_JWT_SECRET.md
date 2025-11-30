# 🔐 Como Gerar JWT_SECRET para Cada Projeto

O `JWT_SECRET` é uma chave secreta usada para assinar e verificar tokens JWT. **Cada projeto deve ter uma chave única e segura**.

---

## 🎯 Métodos para Gerar JWT_SECRET

### Método 1: OpenSSL (Recomendado - Linux/macOS)

```bash
# Gerar uma chave hexadecimal de 64 caracteres (32 bytes)
openssl rand -hex 32
```

**Exemplo de saída:**
```
a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

**Para usar no .env:**
```env
JWT_SECRET=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

---

### Método 2: OpenSSL Base64 (Alternativa)

```bash
# Gerar uma chave em base64 (44 caracteres)
openssl rand -base64 32
```

**Exemplo de saída:**
```
K8mN9pQ2rT5vX7yZ0aB3cD6eF9gH2jK5mN8pQ1rT4vX7yZ0aB3cD6eF9g==
```

---

### Método 3: Node.js (Qualquer sistema)

```bash
# No terminal, execute:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Exemplo de saída:**
```
f9e8d7c6b5a4938271605049382716050493827160504938271605049382716
```

---

### Método 4: Node.js Base64

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

### Método 5: Online (Não recomendado para produção)

⚠️ **Use apenas para testes!** Não use geradores online para produção.

- https://generate-secret.vercel.app/32
- https://randomkeygen.com/

---

## 📝 Passo a Passo para Cada Projeto

### 1. Gerar a Chave

```bash
# Na sua máquina local ou na VPS
openssl rand -hex 32
```

**Copie a chave gerada!**

### 2. Adicionar ao .env do Projeto

```bash
# No diretório do projeto
cd /www/recalcula_preço  # ou /www/recalcula_preco

# Editar o arquivo .env
nano .env
```

Adicione ou atualize a linha:
```env
JWT_SECRET=sua_chave_gerada_aqui
```

**Exemplo:**
```env
JWT_SECRET=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

### 3. Salvar e Reiniciar

```bash
# Salvar o arquivo (Ctrl+X, depois Y, depois Enter no nano)

# Reiniciar a aplicação
pm2 restart calculadora-reajuste
```

---

## ⚠️ Importante

### ✅ Boas Práticas

1. **Use uma chave diferente para cada projeto**
   - Projeto 1: `JWT_SECRET=chave_1_abc123...`
   - Projeto 2: `JWT_SECRET=chave_2_def456...`
   - Projeto 3: `JWT_SECRET=chave_3_ghi789...`

2. **Use chaves longas e aleatórias**
   - Mínimo: 32 caracteres (16 bytes)
   - Recomendado: 64 caracteres (32 bytes) ou mais

3. **Nunca compartilhe a chave**
   - Não commite no Git (já está no `.gitignore`)
   - Não compartilhe entre projetos
   - Não use a mesma chave em desenvolvimento e produção

4. **Mantenha a chave segura**
   - Armazene apenas no arquivo `.env`
   - Use permissões adequadas: `chmod 600 .env`

### ❌ O que NÃO fazer

- ❌ Usar palavras simples como "minhasenha123"
- ❌ Reutilizar a mesma chave em múltiplos projetos
- ❌ Commitar a chave no Git
- ❌ Compartilhar a chave entre ambientes (dev/prod)
- ❌ Usar chaves curtas (menos de 32 caracteres)

---

## 🔄 Gerar Múltiplas Chaves de Uma Vez

Se você precisa gerar chaves para vários projetos:

```bash
# Gerar 3 chaves diferentes
echo "Projeto 1:"
openssl rand -hex 32
echo ""
echo "Projeto 2:"
openssl rand -hex 32
echo ""
echo "Projeto 3:"
openssl rand -hex 32
```

---

## 🧪 Verificar se a Chave Está Configurada

### Verificar no código

```bash
# Verificar se a variável está sendo lida
cd /www/recalcula_preço
grep JWT_SECRET .env
```

### Testar no servidor

```bash
# Verificar variáveis de ambiente do PM2
pm2 env 0 | grep JWT_SECRET
```

---

## 📋 Checklist

- [ ] Gerei uma chave única usando `openssl rand -hex 32`
- [ ] Adicionei a chave no arquivo `.env` do projeto
- [ ] Verifiquei que a chave tem pelo menos 32 caracteres
- [ ] Usei uma chave diferente para cada projeto
- [ ] Reiniciei a aplicação após adicionar a chave
- [ ] Verifiquei que o arquivo `.env` não está no Git

---

## 🆘 Problemas Comuns

### "Token inválido" após mudar a chave

**Causa:** Tokens antigos foram gerados com a chave antiga.

**Solução:** Usuários precisam fazer login novamente para gerar novos tokens.

### "JWT_SECRET não definido"

**Causa:** A variável não está no arquivo `.env` ou o servidor não foi reiniciado.

**Solução:**
```bash
# Verificar se está no .env
grep JWT_SECRET .env

# Se não estiver, adicionar
echo "JWT_SECRET=$(openssl rand -hex 32)" >> .env

# Reiniciar
pm2 restart calculadora-reajuste
```

---

## 💡 Dica Extra

Você pode criar um script para gerar e adicionar automaticamente:

```bash
#!/bin/bash
# gerar-jwt-secret.sh

JWT_SECRET=$(openssl rand -hex 32)
echo "JWT_SECRET=$JWT_SECRET" >> .env
echo "✅ JWT_SECRET gerado e adicionado ao .env:"
echo "$JWT_SECRET"
```

**Uso:**
```bash
chmod +x gerar-jwt-secret.sh
./gerar-jwt-secret.sh
```

---

Pronto! Agora você sabe como gerar um `JWT_SECRET` único e seguro para cada projeto! 🔐

