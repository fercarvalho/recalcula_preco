#!/bin/bash

# ============================================
# Script de Deploy - Calculadora Reajuste
# ============================================
# Este script automatiza o processo de deploy
# na VPS da Hostinger
# ============================================

set -e  # Para o script se houver erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deploy - Calculadora Reajuste${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Verificar se está na raiz do projeto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erro: Execute este script na raiz do projeto${NC}"
    exit 1
fi

# Verificar se o arquivo .env existe
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env não encontrado${NC}"
    echo -e "${YELLOW}   Criando a partir do .env.example...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ Arquivo .env criado.${NC}"
        echo -e "${YELLOW}⚠️  IMPORTANTE: Edite o arquivo .env com suas configurações antes de continuar!${NC}"
        exit 1
    else
        echo -e "${RED}❌ Arquivo .env.example não encontrado${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Arquivo .env encontrado${NC}"
echo ""

# 1. Instalar dependências do backend
echo -e "${YELLOW}📦 Instalando dependências do backend...${NC}"
npm install --production
echo -e "${GREEN}✅ Dependências do backend instaladas${NC}"
echo ""

# 2. Build do frontend
echo -e "${YELLOW}🏗️  Fazendo build do frontend...${NC}"
cd frontend
npm install
npm run build
cd ..
echo -e "${GREEN}✅ Build do frontend concluído${NC}"
echo ""

# 3. Criar diretório de logs se não existir
if [ ! -d "logs" ]; then
    echo -e "${YELLOW}📁 Criando diretório de logs...${NC}"
    mkdir -p logs
    echo -e "${GREEN}✅ Diretório de logs criado${NC}"
    echo ""
fi

# 4. Parar aplicação PM2 se estiver rodando
echo -e "${YELLOW}🛑 Parando aplicação PM2 (se estiver rodando)...${NC}"
pm2 stop calculadora-reajuste 2>/dev/null || true
pm2 delete calculadora-reajuste 2>/dev/null || true
echo -e "${GREEN}✅ Aplicação parada${NC}"
echo ""

# 5. Iniciar aplicação com PM2
echo -e "${YELLOW}🚀 Iniciando aplicação com PM2...${NC}"
pm2 start ecosystem.config.js
pm2 save
echo -e "${GREEN}✅ Aplicação iniciada${NC}"
echo ""

# 6. Mostrar status
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deploy concluído com sucesso!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}📊 Status da aplicação:${NC}"
pm2 status
echo ""
echo -e "${YELLOW}📝 Logs em tempo real:${NC}"
echo -e "   ${GREEN}pm2 logs calculadora-reajuste${NC}"
echo ""
echo -e "${YELLOW}🔄 Comandos úteis:${NC}"
echo -e "   ${GREEN}pm2 restart calculadora-reajuste${NC}  - Reiniciar aplicação"
echo -e "   ${GREEN}pm2 stop calculadora-reajuste${NC}     - Parar aplicação"
echo -e "   ${GREEN}pm2 monit${NC}                         - Monitorar recursos"
echo ""

