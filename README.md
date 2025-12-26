# 🍔 Recalcula Preço

Sistema completo de gestão de preços para restaurantes e lanchonetes que trabalham com múltiplas plataformas de delivery. Facilita o cálculo de reajustes, gerenciamento de cardápios e criação de estratégias de precificação harmoniosas.

## 📖 Sobre o Projeto

Este projeto é uma homenagem ao **Vira-Latas Hotdogs e Lanches**, lanchonete do meu pai localizada em Tupã, interior de São Paulo. Foi criado para resolver um problema real: a dificuldade de gerenciar preços em múltiplas plataformas de delivery, cada uma com suas próprias taxas e formas de cálculo.

**Feito com ❤️ por Fernando Carvalho**

- 📧 Email: contato@fercarvalho.com
- 📱 Instagram: [@cadeofer](https://instagram.com/cadeofer)

## ✨ Funcionalidades Principais

### 🧮 Calculadora de Reajustes
- Aplicação de reajustes fixos ou percentuais em todos os produtos
- Cálculo automático considerando taxas de múltiplas plataformas de delivery
- Backup automático dos valores originais
- Reversão de reajustes quando necessário

### 📋 Gerenciamento de Cardápios
- Organização de produtos por categorias personalizadas
- Drag & drop para reordenar itens e categorias
- Cardápios públicos personalizados com URL única (`/username/cardapio`)
- Exportação de cardápios em PDF
- Suporte a ícones personalizados por categoria

### 💳 Sistema de Pagamentos
- Integração completa com Stripe
- Planos de assinatura mensais e anuais
- Pagamentos únicos
- Checkout transparente
- Sistema de cupons e descontos
- Webhooks para sincronização automática

### 👤 Autenticação e Segurança
- Sistema de registro e login com JWT
- Validação de email obrigatória
- Recuperação de senha por email
- Hash de senhas com bcrypt
- Middleware de autenticação
- Suporte a múltiplos usuários por email

### 🎨 Personalização
- Temas claro/escuro
- Cores personalizadas por usuário
- Logo personalizado do estabelecimento
- Configurações de branding

### 🤖 Funcionalidades com IA (Beta)
- **Modo Estúdio**: Processamento de fotos com inteligência artificial
- Integração com Google Gemini API
- Histórico de processamentos

### 📊 Painel Administrativo
- Gerenciamento completo de usuários
- Estatísticas e relatórios
- Gerenciamento de planos e benefícios
- Configuração da landing page
- Gerenciamento de FAQ
- Sistema de roadmap
- Gerenciamento de rodapé e links
- Feedbacks de funcionalidades beta

### 🌐 Landing Page Dinâmica
- Seções configuráveis via painel admin
- Gerenciamento de funções e benefícios
- FAQ dinâmico
- Exibição de planos e preços
- Sistema de roadmap público

### 🍪 Conformidade LGPD
- Banner de cookies configurável
- Categorias de cookies personalizáveis
- Política de Privacidade
- Termos de Uso
- Modais para visualização de documentos legais

### 📱 Outras Funcionalidades
- Tutorial de onboarding interativo
- Sistema de feedback para funcionalidades beta
- Estatísticas de uso
- Histórico de atividades
- Gerenciamento de plataformas de delivery
- Sistema de sessões e login tracking

## 🛠️ Stack Tecnológica

### Frontend
- **React 19** com TypeScript
- **Vite** para build e desenvolvimento
- **React Icons** para ícones
- **Recharts** para gráficos
- **html2canvas** e **jsPDF** para exportação
- **Axios** para requisições HTTP
- **Stripe.js** para integração de pagamentos

### Backend
- **Node.js** com Express
- **PostgreSQL** como banco de dados
- **JWT** para autenticação
- **bcrypt** para hash de senhas
- **Nodemailer** para envio de emails
- **Stripe** SDK para pagamentos

### Infraestrutura
- **PM2** para gerenciamento de processos
- **Nginx** como reverse proxy (opcional)
- Suporte a VPS (testado na Hostinger)

## 📋 Pré-requisitos

- Node.js 18+ 
- PostgreSQL 12+
- Conta no Stripe (para pagamentos)
- Conta no Google Gemini (para Modo Estúdio - opcional)
- Servidor SMTP configurado (para envio de emails)

## 🚀 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/calculadora-reajuste.git
cd calculadora-reajuste
```

### 2. Instale as dependências

```bash
# Dependências do backend
npm install

# Dependências do frontend
cd frontend
npm install
cd ..
```

### 3. Configure o PostgreSQL

Certifique-se de que o PostgreSQL está instalado e rodando. Veja o arquivo `CONFIGURACAO_POSTGRESQL.md` para instruções detalhadas.

Crie o banco de dados:

```bash
psql -U postgres
CREATE DATABASE calculadora_reajuste;
\q
```

### 4. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=calculadora_reajuste
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui

# JWT
JWT_SECRET=seu_jwt_secret_super_seguro_aqui

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_app
EMAIL_FROM=noreply@seudominio.com

# Google Gemini API (para Modo Estúdio - opcional)
GOOGLE_GEMINI_API_KEY=sua_chave_api_aqui

# Frontend
VITE_API_BASE=http://localhost:3000
```

### 5. Inicialize o banco de dados

O banco de dados será inicializado automaticamente na primeira execução do servidor. As tabelas e dados padrão serão criados automaticamente.

### 6. Inicie o servidor

**Desenvolvimento:**

```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**Produção:**

```bash
# Build do frontend
npm run build:frontend

# Iniciar servidor
npm start
```

O servidor estará rodando em `http://localhost:3000`

## 📚 Documentação Adicional

O projeto inclui vários arquivos de documentação:

- `CONFIGURACAO_POSTGRESQL.md` - Configuração do PostgreSQL
- `INTEGRACAO_STRIPE.md` - Guia completo de integração com Stripe
- `CONFIGURAR_SMTP.md` - Configuração de email
- `DEPLOY_VPS.md` - Guia de deploy no VPS
- `GUIA_CHECKOUT_TRANSPARENTE_STRIPE.md` - Checkout transparente
- `GUIA_CUPONS_DESCONTO_STRIPE.md` - Sistema de cupons
- E muitos outros...

## 🏗️ Estrutura do Projeto

```
calculadora-reajuste/
├── frontend/              # Aplicação React
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── pages/         # Páginas
│   │   ├── services/      # Serviços de API
│   │   ├── utils/         # Utilitários
│   │   └── types/         # Tipos TypeScript
│   └── public/            # Arquivos estáticos
├── middleware/            # Middlewares do Express
│   ├── auth.js           # Autenticação JWT
│   └── logging.js        # Logging
├── services/             # Serviços do backend
│   ├── email.js          # Serviço de email
│   └── stripe.js         # Integração Stripe
├── database.js           # Funções do banco de dados
├── server.js             # Servidor Express principal
└── package.json          # Dependências do projeto
```

## 🔌 API Endpoints Principais

### Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Fazer login
- `GET /api/auth/me` - Obter dados do usuário atual
- `GET /api/auth/validar-email/:token` - Validar email
- `POST /api/auth/recuperar-senha` - Solicitar recuperação de senha
- `POST /api/auth/resetar-senha` - Redefinir senha

### Itens e Categorias
- `GET /api/itens` - Obter todos os itens
- `POST /api/itens` - Criar novo item
- `PUT /api/itens/:id` - Atualizar item
- `DELETE /api/itens/:id` - Deletar item
- `GET /api/categorias` - Obter categorias
- `POST /api/categorias` - Criar categoria

### Pagamentos (Stripe)
- `POST /api/stripe/create-checkout-session` - Criar sessão de checkout
- `POST /api/stripe/webhook` - Webhook do Stripe
- `GET /api/stripe/planos` - Obter planos disponíveis

### Cardápio Público
- `GET /api/cardapio/:username` - Obter cardápio público

### Admin
- `GET /api/admin/usuarios` - Listar usuários
- `GET /api/admin/estatisticas` - Estatísticas gerais
- `GET /api/admin/planos` - Gerenciar planos
- E muitos outros endpoints administrativos...

## 🔒 Segurança

- Senhas hasheadas com bcrypt
- Tokens JWT para autenticação
- Validação de email obrigatória
- Middleware de autenticação em rotas protegidas
- Sanitização de inputs
- Proteção contra SQL injection (usando prepared statements)
- Headers de segurança configurados

## 📄 Licença

Este projeto está licenciado sob a **Licença MIT - Uso Educacional e Não Comercial**.

### ✅ O que você PODE fazer:
- ✅ Usar para fins educacionais e de aprendizado
- ✅ Estudar o código e arquitetura
- ✅ Usar como referência ou inspiração para criar projetos **novos e originais**
- ✅ Aplicar conceitos e padrões aprendidos em seus próprios projetos comerciais (desde que sejam criações originais)

### ❌ O que você NÃO PODE fazer:
- ❌ Reproduzir, copiar ou distribuir este software para fins comerciais
- ❌ Fazer modificações mínimas e usar comercialmente
- ❌ Vender ou licenciar este software ou partes dele
- ❌ Criar produtos comerciais que sejam substancialmente similares

**Para uso comercial deste código, entre em contato para licenciamento:**
📧 Email: contato@fercarvalho.com

Veja o arquivo [LICENSE](LICENSE) para os termos completos da licença.

## 🤝 Contribuindo

Este é um projeto pessoal, mas sugestões e feedback são sempre bem-vindos!

## 📝 Changelog

### Versão Atual
- ✅ Sistema completo de autenticação
- ✅ Integração com Stripe
- ✅ Cardápios públicos
- ✅ Modo Estúdio com IA
- ✅ Painel administrativo completo
- ✅ Landing page dinâmica
- ✅ Conformidade LGPD
- ✅ Sistema de planos e assinaturas
- ✅ E muito mais...

---

**Desenvolvido com ❤️ para facilitar a vida de empreendedores do setor alimentício**
