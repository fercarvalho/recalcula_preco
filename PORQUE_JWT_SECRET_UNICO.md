# 🔐 Por Que Cada Projeto Precisa de um JWT_SECRET Único?

## 🎯 Resumo Rápido

O `JWT_SECRET` é como uma **chave mestra** que seu servidor usa para:
1. **Assinar** tokens JWT quando um usuário faz login
2. **Verificar** se um token é válido quando o usuário faz requisições

Se dois projetos compartilharem a mesma chave, um projeto pode **forjar tokens** do outro! 🚨

---

## 🔍 Como Funciona o JWT?

### 1. Quando o Usuário Faz Login

```
Usuário → Login → Servidor
                    ↓
              Servidor cria um token JWT
              usando o JWT_SECRET
                    ↓
              Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
                    ↓
              Usuário recebe o token
```

**Exemplo no código:**
```javascript
// middleware/auth.js
const token = jwt.sign({ userId: 123 }, JWT_SECRET, { expiresIn: '7d' });
// Token gerado: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 2. Quando o Usuário Faz uma Requisição

```
Usuário → Envia token → Servidor
                            ↓
                      Servidor verifica o token
                      usando o JWT_SECRET
                            ↓
                      Se válido: permite acesso
                      Se inválido: bloqueia acesso
```

**Exemplo no código:**
```javascript
// middleware/auth.js
jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
        // Token inválido - bloqueia acesso
        return res.status(403).json({ error: 'Token inválido' });
    }
    // Token válido - permite acesso
    req.userId = decoded.userId;
});
```

---

## ⚠️ O Problema: Compartilhar a Mesma Chave

### Cenário Perigoso

Imagine que você tem **2 projetos** na mesma VPS:

```
Projeto 1 (Calculadora Reajuste)
├── JWT_SECRET = "chave_compartilhada_123"
└── Usuário: joao@email.com (ID: 1)

Projeto 2 (Outro Sistema)
├── JWT_SECRET = "chave_compartilhada_123"  ← MESMA CHAVE!
└── Usuário: maria@email.com (ID: 1)
```

### O Que Pode Acontecer?

#### 🚨 Ataque 1: Forjar Tokens Entre Projetos

1. **Usuário faz login no Projeto 1**
   - Recebe token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Token contém: `{ userId: 1 }` (João)

2. **Usuário usa o MESMO token no Projeto 2**
   - Como ambos usam a mesma chave, o Projeto 2 **aceita o token**!
   - O usuário do Projeto 1 agora tem acesso ao Projeto 2! 🚨

3. **Resultado:**
   - Usuário do Projeto 1 pode acessar dados do Projeto 2
   - Violação de segurança grave!

#### 🚨 Ataque 2: Criar Tokens Falsos

Se alguém descobrir a chave compartilhada:

1. **Atacante gera um token falso:**
   ```javascript
   const tokenFalso = jwt.sign(
       { userId: 999 },  // Qualquer ID
       "chave_compartilhada_123"  // Chave compartilhada
   );
   ```

2. **Atacante usa o token em AMBOS os projetos:**
   - Projeto 1 aceita ✅
   - Projeto 2 aceita ✅
   - Atacante tem acesso total! 🚨

---

## ✅ A Solução: Chaves Únicas

### Cenário Seguro

```
Projeto 1 (Calculadora Reajuste)
├── JWT_SECRET = "chave_unica_projeto_1_abc123..."
└── Usuário: joao@email.com (ID: 1)

Projeto 2 (Outro Sistema)
├── JWT_SECRET = "chave_unica_projeto_2_def456..."  ← CHAVE DIFERENTE!
└── Usuário: maria@email.com (ID: 1)
```

### Por Que Funciona?

1. **Token do Projeto 1:**
   - Assinado com: `chave_unica_projeto_1_abc123...`
   - Token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

2. **Tentativa de usar no Projeto 2:**
   - Projeto 2 verifica com: `chave_unica_projeto_2_def456...`
   - ❌ **Token inválido!** Chaves diferentes!
   - Acesso negado ✅

3. **Resultado:**
   - Cada projeto só aceita seus próprios tokens
   - Isolamento total entre projetos ✅

---

## 🔒 Analogia do Mundo Real

### Chaves de Casa

**❌ Compartilhar a mesma chave:**
```
Casa 1 ──┐
         ├──> Chave: "ABC123" (mesma chave!)
Casa 2 ──┘

Problema: Quem tem a chave pode abrir AMBAS as casas!
```

**✅ Chaves diferentes:**
```
Casa 1 ──> Chave: "ABC123" (única)
Casa 2 ──> Chave: "XYZ789" (diferente)

Solução: Cada chave só abre sua própria casa!
```

---

## 📊 Comparação Visual

### ❌ Cenário Inseguro (Mesma Chave)

```
┌─────────────────┐         ┌─────────────────┐
│  Projeto 1      │         │  Projeto 2      │
│                 │         │                 │
│ JWT_SECRET:     │         │ JWT_SECRET:     │
│ "chave_123"    │─────────│ "chave_123"    │ ← MESMA!
│                 │         │                 │
│ Token válido    │─────────│ Token válido    │ ← ACEITA!
│ em ambos! 🚨    │         │ em ambos! 🚨    │
└─────────────────┘         └─────────────────┘
```

### ✅ Cenário Seguro (Chaves Diferentes)

```
┌─────────────────┐         ┌─────────────────┐
│  Projeto 1      │         │  Projeto 2      │
│                 │         │                 │
│ JWT_SECRET:     │         │ JWT_SECRET:     │
│ "chave_abc"    │         │ "chave_xyz"    │ ← DIFERENTE!
│                 │         │                 │
│ Token válido    │         │ Token válido    │
│ apenas aqui ✅  │         │ apenas aqui ✅  │
└─────────────────┘         └─────────────────┘
```

---

## 🎯 Resumo dos Motivos

### 1. **Isolamento de Segurança**
- Cada projeto só aceita seus próprios tokens
- Previne acesso cruzado entre projetos

### 2. **Contenção de Danos**
- Se uma chave for comprometida, apenas UM projeto é afetado
- Outros projetos continuam seguros

### 3. **Conformidade e Boas Práticas**
- Seguir padrões de segurança da indústria
- Cada aplicação deve ter suas próprias credenciais

### 4. **Auditoria e Rastreamento**
- Mais fácil identificar qual projeto teve problema
- Logs e monitoramento mais claros

### 5. **Flexibilidade**
- Pode alterar a chave de um projeto sem afetar outros
- Pode rotacionar chaves independentemente

---

## 🔐 Outras Boas Práticas Relacionadas

### 1. Banco de Dados Único
- ✅ Cada projeto tem seu próprio banco
- ❌ Não compartilhar banco entre projetos

### 2. Portas/Portas Diferentes
- ✅ Cada projeto em porta diferente (ou domínio)
- ❌ Não usar a mesma porta

### 3. Variáveis de Ambiente Isoladas
- ✅ Cada projeto tem seu próprio `.env`
- ❌ Não compartilhar arquivo `.env`

### 4. Usuários do Banco Diferentes
- ✅ Cada projeto tem seu próprio usuário PostgreSQL
- ❌ Não usar o mesmo usuário

---

## 💡 Exemplo Prático

### Situação Real

Você tem 3 projetos na VPS:

```
Projeto A: Sistema de Vendas
Projeto B: Calculadora Reajuste (este projeto)
Projeto C: Blog Pessoal
```

### ❌ Se todos usarem a mesma chave:

1. Usuário do Projeto A faz login
2. Recebe token do Projeto A
3. Usa o mesmo token no Projeto B
4. **Projeto B aceita!** 🚨
5. Usuário do Projeto A agora tem acesso ao Projeto B!

### ✅ Com chaves diferentes:

1. Usuário do Projeto A faz login
2. Recebe token do Projeto A (assinado com chave A)
3. Tenta usar no Projeto B
4. **Projeto B rejeita!** ✅ (chave diferente)
5. Usuário precisa fazer login separado em cada projeto

---

## 🎓 Conclusão

**Cada projeto precisa de um JWT_SECRET único porque:**

1. 🔒 **Segurança:** Previne acesso cruzado entre projetos
2. 🛡️ **Isolamento:** Contém danos se uma chave for comprometida
3. ✅ **Boas Práticas:** Padrão da indústria
4. 🔍 **Rastreabilidade:** Facilita auditoria e debugging
5. 🔄 **Flexibilidade:** Permite mudanças independentes

**É como ter chaves diferentes para cada porta da sua casa - cada uma só abre sua própria porta!** 🗝️

---

## 📚 Referências

- [JWT.io - JSON Web Tokens](https://jwt.io/)
- [OWASP - JSON Web Token Security](https://owasp.org/www-community/vulnerabilities/JSON_Web_Token_(JWT)_Misconfiguration)
- [RFC 7519 - JSON Web Token](https://tools.ietf.org/html/rfc7519)

