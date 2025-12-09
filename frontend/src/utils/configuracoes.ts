import { getUser } from '../services/auth';

export interface ConfiguracoesAdmin {
  corPrimaria: string;
  corSecundaria: string;
  corFundo: string;
  logoUrl: string | null;
}

const getConfigKey = (userId?: number | null): string => {
  if (userId) {
    return `calculadora_admin_config_${userId}`;
  }
  // Fallback para compatibilidade com versão antiga
  return 'calculadora_admin_config';
};

export const carregarConfiguracoes = (userId?: number | null): ConfiguracoesAdmin => {
  // Se não foi passado userId, tentar obter do usuário atual
  if (!userId) {
    const user = getUser();
    userId = user?.id;
  }
  
  const key = getConfigKey(userId);
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      const config = JSON.parse(saved);
      // Garantir que logoUrl seja null se estiver vazio ou undefined
      if (config.logoUrl === '' || config.logoUrl === undefined) {
        config.logoUrl = null;
      }
      return config;
    } catch {
      // Fallback para valores padrão
    }
  }
  return {
    corPrimaria: '#FF6B35',
    corSecundaria: '#2a2a2a',
    corFundo: '#1a1a1a',
    logoUrl: null,
  };
};

export const aplicarConfiguracoes = (config: ConfiguracoesAdmin, userId?: number | null) => {
  const root = document.documentElement;
  root.style.setProperty('--cor-primaria', config.corPrimaria);
  root.style.setProperty('--cor-secundaria', config.corSecundaria);
  root.style.setProperty('--cor-fundo', config.corFundo);
  
  const logoImg = document.querySelector('.logo') as HTMLImageElement;
  if (logoImg) {
    if (config.logoUrl) {
      // Se houver logo customizada, usar ela
      logoImg.src = config.logoUrl;
    } else {
      // Se não houver logo customizada, verificar se é viralatas
      const user = getUser();
      logoImg.src = user?.username === 'viralatas' ? '/logo.png' : '/logo_nova.png';
    }
  }
  
  // Disparar evento para atualizar o Header
  window.dispatchEvent(new CustomEvent('config-updated', { detail: { config, userId } }));
};

