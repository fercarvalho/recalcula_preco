import { sessionStorageService, type Plataforma } from '../services/sessionStorage';

export const calcularPrecoComPlataforma = (precoBase: number, taxaPlataforma: number): number => {
  // Calcular o preço que deve ser cobrado para que, após a taxa, resulte no preço base
  // Se a plataforma cobra X%, então: precoFinal * (1 - taxa/100) = precoBase
  // Portanto: precoFinal = precoBase / (1 - taxa/100)
  if (taxaPlataforma === 0) return precoBase;
  return precoBase / (1 - taxaPlataforma / 100);
};

// Funções auxiliares para compatibilidade com código existente
export const carregarPlataformasSync = (): Plataforma[] => {
  return sessionStorageService.obterPlataformas();
};

export const carregarPlataformas = async (): Promise<Plataforma[]> => {
  return sessionStorageService.obterPlataformas();
};

export const salvarPlataformas = async (plataformas: Plataforma[]): Promise<void> => {
  sessionStorageService.salvarPlataformas(plataformas);
  window.dispatchEvent(new CustomEvent('plataformas-updated', { detail: plataformas }));
};

export const limparCachePlataformas = (): void => {
  // Não há cache em sessionStorage, mas mantemos a função para compatibilidade
};

