export interface Plataforma {
  id: number;
  nome: string;
  taxa: number;
}

const PLATAFORMAS_STORAGE_KEY = 'calculadora_plataformas';

export const carregarPlataformas = (): Plataforma[] => {
  const saved = localStorage.getItem(PLATAFORMAS_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }
  return [];
};

export const calcularPrecoComPlataforma = (precoBase: number, taxaPlataforma: number): number => {
  // Calcular o preço que deve ser cobrado para que, após a taxa, resulte no preço base
  // Se a plataforma cobra X%, então: precoFinal * (1 - taxa/100) = precoBase
  // Portanto: precoFinal = precoBase / (1 - taxa/100)
  if (taxaPlataforma === 0) return precoBase;
  return precoBase / (1 - taxaPlataforma / 100);
};

