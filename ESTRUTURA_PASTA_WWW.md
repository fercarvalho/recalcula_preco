# 📁 Estrutura de Pastas na VPS: Ter Múltiplos Projetos em /www

## 🎯 Resposta Rápida

**✅ NÃO há problema** em ter diferentes projetos na pasta `/www`, desde que você siga boas práticas de organização e segurança.

---

## ✅ Vantagens de Usar /www

### 1. **Padrão da Indústria**
- `/www` ou `/var/www` é o padrão tradicional para hospedar aplicações web
- Muitos servidores web (Apache, Nginx) esperam encontrar sites aqui
- Facilita para outros desenvolvedores entenderem a estrutura

### 2. **Organização Centralizada**
- Todos os projetos web em um só lugar
- Fácil de encontrar e gerenciar
- Conveniente para backups

### 3. **Compatibilidade com Painéis**
- Painéis como cPanel, Plesk, etc. usam `/www` ou `/var/www`
- Facilita integração com ferramentas de gerenciamento

### 4. **Permissões Padrão**
- Geralmente já tem permissões corretas configuradas
- Usuário `www-data` ou similar já tem acesso

---

## ⚠️ Considerações Importantes

### 1. **Isolamento de Permissões**

**❌ Problema:**
Se todos os projetos estiverem no mesmo diretório com as mesmas permissões, um projeto pode acessar arquivos de outro.

**✅ Solução:**
```bash
# Cada projeto com seu próprio usuário/grupo
/www/
├── projeto1/  (dono: usuario1)
├── projeto2/  (dono: usuario2)
└── recalcula_preco/  (dono: seu-usuario)
```

**Configurar permissões:**
```bash
# Dar permissão apenas ao dono do projeto
sudo chown -R seu-usuario:seu-usuario /www/recalcula_preco
sudo chmod 755 /www/recalcula_preco
sudo chmod 600 /www/recalcula_preco/.env  # Arquivo sensível
```

### 2. **Isolamento de Processos**

**✅ Boa Prática:**
Cada projeto deve rodar com seu próprio processo PM2:

```bash
# Projeto 1
pm2 start /www/projeto1/server.js --name projeto1

# Projeto 2  
pm2 start /www/projeto2/server.js --name projeto2

# Calculadora Reajuste
pm2 start /www/recalcula_preco/server.js --name calculadora-reajuste
```

### 3. **Variáveis de Ambiente**

**✅ Boa Prática:**
Cada projeto deve ter seu próprio `.env`:

```
/www/
├── projeto1/.env  (variáveis do projeto 1)
├── projeto2/.env  (variáveis do projeto 2)
└── recalcula_preco/.env  (variáveis deste projeto)
```

**❌ NUNCA:**
- Compartilhar o mesmo `.env` entre projetos
- Ter variáveis de um projeto acessíveis por outro

### 4. **Banco de Dados**

**✅ Boa Prática:**
Cada projeto com seu próprio banco:

```sql
-- Banco do Projeto 1
CREATE DATABASE projeto1_db;

-- Banco do Projeto 2
CREATE DATABASE projeto2_db;

-- Banco da Calculadora
CREATE DATABASE calculadora_reajuste;
```

---

## 🏗️ Estrutura Recomendada

### Opção 1: Diretórios Separados (Recomendado)

```
/www/
├── projeto1/
│   ├── server.js
│   ├── .env
│   ├── package.json
│   └── ...
├── projeto2/
│   ├── server.js
│   ├── .env
│   ├── package.json
│   └── ...
└── recalcula_preco/
    ├── server.js
    ├── .env
    ├── package.json
    └── ...
```

**Vantagens:**
- ✅ Organização clara
- ✅ Fácil de gerenciar
- ✅ Cada projeto isolado

### Opção 2: Por Domínio/Subdomínio

```
/www/
├── dominio1.com/
│   └── projeto1/
├── dominio2.com/
│   └── projeto2/
└── calculadora.dominio.com/
    └── recalcula_preco/
```

**Vantagens:**
- ✅ Organizado por domínio
- ✅ Útil se cada projeto tem domínio diferente

### Opção 3: Por Tipo de Aplicação

```
/www/
├── apis/
│   ├── api-projeto1/
│   └── api-projeto2/
├── sites/
│   ├── site-projeto1/
│   └── site-projeto2/
└── calculadoras/
    └── recalcula_preco/
```

**Vantagens:**
- ✅ Organizado por categoria
- ✅ Útil para muitos projetos

---

## 🔒 Segurança: Checklist

### ✅ O Que Fazer

1. **Permissões Corretas**
   ```bash
   # Cada projeto com seu dono
   sudo chown -R usuario:usuario /www/recalcula_preco
   sudo chmod 755 /www/recalcula_preco
   sudo chmod 600 /www/recalcula_preco/.env
   ```

2. **Arquivos Sensíveis Protegidos**
   ```bash
   # .env não deve ser acessível por outros
   chmod 600 .env
   
   # node_modules não precisa de permissões especiais
   chmod -R 755 node_modules
   ```

3. **PM2 Isolado**
   ```bash
   # Cada projeto com nome único no PM2
   pm2 start ecosystem.config.js --name calculadora-reajuste
   ```

4. **Banco de Dados Separado**
   ```sql
   -- Cada projeto com seu banco
   CREATE DATABASE calculadora_reajuste;
   ```

5. **Variáveis de Ambiente Únicas**
   ```bash
   # Cada projeto com seu .env
   /www/projeto1/.env
   /www/projeto2/.env
   /www/recalcula_preco/.env
   ```

### ❌ O Que NÃO Fazer

1. **❌ Compartilhar .env**
   ```bash
   # ERRADO!
   /www/.env  # Todos os projetos usando o mesmo
   ```

2. **❌ Permissões Muito Abertas**
   ```bash
   # ERRADO!
   chmod 777 /www  # Qualquer um pode modificar
   ```

3. **❌ Mesmo Usuário para Tudo**
   ```bash
   # ERRADO!
   # Todos os projetos rodando como root
   ```

4. **❌ Compartilhar Banco de Dados**
   ```sql
   -- ERRADO!
   -- Todos os projetos usando o mesmo banco
   ```

---

## 🎯 Configuração do Nginx

### Múltiplos Projetos em /www

Cada projeto pode ter sua própria configuração:

```bash
# Projeto 1
/etc/nginx/sites-available/projeto1
  → server_name: projeto1.seudominio.com
  → proxy_pass: http://localhost:3001

# Projeto 2
/etc/nginx/sites-available/projeto2
  → server_name: projeto2.seudominio.com
  → proxy_pass: http://localhost:3002

# Calculadora Reajuste
/etc/nginx/sites-available/calculadora-reajuste
  → server_name: calculadora.seudominio.com
  → proxy_pass: http://localhost:3003
```

**Cada um isolado e funcionando independentemente!**

---

## 📊 Comparação: /www vs /home

### Usando /www (Recomendado para Web)

```
/www/
├── projeto1/
├── projeto2/
└── recalcula_preco/
```

**Vantagens:**
- ✅ Padrão da indústria
- ✅ Fácil para servidores web encontrarem
- ✅ Organização centralizada
- ✅ Compatível com painéis

**Desvantagens:**
- ⚠️ Precisa de `sudo` para criar (geralmente)
- ⚠️ Pode precisar ajustar permissões

### Usando /home

```
/home/seu-usuario/
├── projetos/
│   ├── projeto1/
│   ├── projeto2/
│   └── recalcula_reajuste/
```

**Vantagens:**
- ✅ Não precisa de `sudo` (geralmente)
- ✅ Mais fácil de gerenciar permissões
- ✅ Isolado por usuário

**Desvantagens:**
- ⚠️ Menos padrão para aplicações web
- ⚠️ Pode precisar configurar Nginx diferente

---

## ✅ Recomendação Final

### Para sua situação (Hostinger VPS):

**✅ USE `/www`** - É a melhor opção porque:

1. **Padrão da indústria** - Outros desenvolvedores entenderão
2. **Compatível com Nginx** - Configuração mais simples
3. **Organização clara** - Todos os projetos web em um lugar
4. **Fácil de fazer backup** - Um diretório centralizado

### Estrutura Sugerida:

```
/www/
├── projeto1/          # Seu primeiro projeto
├── projeto2/          # Seu segundo projeto
└── recalcula_preco/   # Este projeto (ou recalcula_preco)
    ├── server.js
    ├── .env
    ├── package.json
    └── ...
```

### Checklist de Segurança:

- [ ] Cada projeto com permissões próprias
- [ ] Cada projeto com seu próprio `.env`
- [ ] Cada projeto com seu próprio banco de dados
- [ ] Cada projeto com instância PM2 separada
- [ ] Arquivo `.env` com permissão 600
- [ ] Nginx configurado para cada projeto separadamente

---

## 🆘 Problemas Comuns e Soluções

### Problema 1: "Permission Denied"

**Causa:** Permissões incorretas

**Solução:**
```bash
sudo chown -R $USER:$USER /www/recalcula_preco
sudo chmod 755 /www/recalcula_preco
```

### Problema 2: Projetos Acessando Arquivos de Outros

**Causa:** Permissões muito abertas

**Solução:**
```bash
# Restringir permissões
chmod 750 /www/recalcula_preco
chmod 600 /www/recalcula_preco/.env
```

### Problema 3: Conflito de Portas

**Causa:** Dois projetos usando a mesma porta

**Solução:**
```bash
# Cada projeto em porta diferente
Projeto 1: PORT=3001
Projeto 2: PORT=3002
Calculadora: PORT=3003
```

---

## 🎓 Conclusão

**✅ NÃO há problema** em ter múltiplos projetos em `/www`, desde que:

1. ✅ Cada projeto tenha suas próprias permissões
2. ✅ Cada projeto tenha seu próprio `.env`
3. ✅ Cada projeto tenha seu próprio banco de dados
4. ✅ Cada projeto rode em processo/porta separada
5. ✅ Arquivos sensíveis estejam protegidos

**A chave é o ISOLAMENTO - cada projeto deve ser independente!** 🔒

---

## 📚 Referências

- [Linux Filesystem Hierarchy Standard](https://en.wikipedia.org/wiki/Filesystem_Hierarchy_Standard)
- [Nginx Server Blocks](https://nginx.org/en/docs/http/server_names.html)
- [PM2 Process Management](https://pm2.keymetrics.io/docs/usage/process-management/)

