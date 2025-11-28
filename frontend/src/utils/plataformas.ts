import { getUser } from '../services/auth';
import { apiService } from '../services/api';

export interface Plataforma {
  id: number;
  nome: string;
  taxa: number;
  ordem?: number;
}

const getPlataformasKey = (userId?: number | null): string => {
  if (userId) {
    return `calculadora_plataformas_${userId}`;
  }
  // Fallback para compatibilidade com versão antiga
  return 'calculadora_plataformas';
};

// Cache em memória para evitar múltiplas chamadas à API
let plataformasCache: Plataforma[] | null = null;
let cacheUserId: number | null = null;

export const carregarPlataformas = async (userId?: number | null): Promise<Plataforma[]> => {
  // Se não foi passado userId, tentar obter do usuário atual
  if (!userId) {
    const user = getUser();
    userId = user?.id;
  }
  
  // Se não há usuário, retornar array vazio (sem tentar API)
  if (!userId) {
    return [];
  }
  
  // Se o cache é válido, retornar do cache
  if (plataformasCache !== null && cacheUserId === userId) {
    return plataformasCache;
  }
  
  // Primeiro tentar localStorage (mais rápido e não requer autenticação)
  const key = getPlataformasKey(userId);
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      const plataformas = JSON.parse(saved);
      // Atualizar cache
      plataformasCache = plataformas;
      cacheUserId = userId;
      // Retornar imediatamente do localStorage
      // Tentar atualizar do servidor em background (não bloquear)
      apiService.obterPlataformas().then(plataformasApi => {
        if (plataformasApi && plataformasApi.length >= 0) {
          plataformasCache = plataformasApi;
          cacheUserId = userId;
          localStorage.setItem(key, JSON.stringify(plataformasApi));
          window.dispatchEvent(new CustomEvent('plataformas-updated', { detail: plataformasApi }));
        }
      }).catch(() => {
        // Ignorar erro silenciosamente - já temos dados do localStorage
      });
      return plataformas;
    } catch {
      // Se falhar ao parsear, continuar para tentar API
    }
  }
  
  // Se não há dados no localStorage, tentar API
  try {
    const plataformas = await apiService.obterPlataformas();
    plataformasCache = plataformas;
    cacheUserId = userId;
    
    // Salvar no localStorage como backup
    localStorage.setItem(key, JSON.stringify(plataformas));
    
    return plataformas;
  } catch (error) {
    console.error('Erro ao carregar plataformas da API:', error);
    // Retornar array vazio se API falhar e não houver localStorage
    return [];
  }
};

// Versão síncrona para compatibilidade (usa cache ou localStorage)
export const carregarPlataformasSync = (userId?: number | null): Plataforma[] => {
  if (!userId) {
    const user = getUser();
    userId = user?.id;
  }
  
  if (!userId) {
    return [];
  }
  
  // Se há cache válido, usar
  if (plataformasCache !== null && cacheUserId === userId) {
    return plataformasCache;
  }
  
  // Caso contrário, tentar localStorage
  const key = getPlataformasKey(userId);
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }
  return [];
};

export const salvarPlataformas = async (plataformas: Plataforma[], userId?: number | null): Promise<void> => {
  // Se não foi passado userId, tentar obter do usuário atual
  if (!userId) {
    const user = getUser();
    userId = user?.id;
  }
  
  if (!userId) {
    return;
  }
  
  // Salvar no localStorage como backup
  const key = getPlataformasKey(userId);
  localStorage.setItem(key, JSON.stringify(plataformas));
  
  // Atualizar cache
  plataformasCache = plataformas;
  cacheUserId = userId;
  
  // Disparar evento customizado para atualizar outros componentes
  window.dispatchEvent(new CustomEvent('plataformas-updated', { detail: plataformas }));
};

// Limpar cache (útil quando plataformas são modificadas)
export const limparCachePlataformas = (): void => {
  plataformasCache = null;
  cacheUserId = null;
};

export const calcularPrecoComPlataforma = (precoBase: number, taxaPlataforma: number): number => {
  // Calcular o preço que deve ser cobrado para que, após a taxa, resulte no preço base
  // Se a plataforma cobra X%, então: precoFinal * (1 - taxa/100) = precoBase
  // Portanto: precoFinal = precoBase / (1 - taxa/100)
  if (taxaPlataforma === 0) return precoBase;
  return precoBase / (1 - taxaPlataforma / 100);
};

