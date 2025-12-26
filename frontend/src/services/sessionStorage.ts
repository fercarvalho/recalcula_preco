import type { Item, ItensPorCategoria, Categoria } from '../types';

export interface Plataforma {
  id: number;
  nome: string;
  taxa: number;
  tipoCalculo?: 'percentual' | 'valor';
  periodoCalculo?: '1mes' | '3meses';
  ordem?: number;
}

export interface ConfiguracoesDemo {
  corPrimaria: string;
  corSecundaria: string;
  corFundo: string;
  logoUrl: string | null;
}

const STORAGE_KEYS = {
  ITENS: 'demo_itens',
  PLATAFORMAS: 'demo_plataformas',
  CONFIGURACOES: 'demo_configuracoes',
};

export const sessionStorageService = {
  // ========== ITENS ==========
  obterTodosItens(): ItensPorCategoria {
    const saved = sessionStorage.getItem(STORAGE_KEYS.ITENS);
    return saved ? JSON.parse(saved) : {};
  },

  salvarItens(itens: ItensPorCategoria): void {
    sessionStorage.setItem(STORAGE_KEYS.ITENS, JSON.stringify(itens));
  },

  criarItem(categoria: string, nome: string, valor: number): Item {
    const itens = this.obterTodosItens();
    const novoId = Date.now();
    const novoItem: Item = {
      id: novoId,
      nome,
      valor,
      valorNovo: null,
      valorBackup: valor,
      categoria,
      ordem: 0,
    };

    if (!itens[categoria]) {
      itens[categoria] = [];
    }
    itens[categoria].push(novoItem);
    this.salvarItens(itens);
    return novoItem;
  },

  atualizarItem(id: number, updates: Partial<Item>): Item {
    const itens = this.obterTodosItens();
    let itemAtualizado: Item | null = null;
    let categoriaAntiga: string | null = null;
    let indexItem: number = -1;

    // Encontrar o item
    for (const categoria in itens) {
      const index = itens[categoria].findIndex(item => item.id === id);
      if (index !== -1) {
        categoriaAntiga = categoria;
        indexItem = index;
        break;
      }
    }

    if (categoriaAntiga === null || indexItem === -1) {
      throw new Error('Item não encontrado');
    }

    itemAtualizado = { ...itens[categoriaAntiga][indexItem], ...updates };

    // Se a categoria mudou, mover o item para a nova categoria
    if (updates.categoria && updates.categoria !== categoriaAntiga) {
      // Remover da categoria antiga
      itens[categoriaAntiga].splice(indexItem, 1);
      
      // Adicionar à nova categoria
      if (!itens[updates.categoria]) {
        itens[updates.categoria] = [];
      }
      itens[updates.categoria].push(itemAtualizado);
    } else {
      // Apenas atualizar na mesma categoria
      itens[categoriaAntiga][indexItem] = itemAtualizado;
    }

    this.salvarItens(itens);
    return itemAtualizado;
  },

  deletarItem(id: number): void {
    const itens = this.obterTodosItens();
    for (const categoria in itens) {
      itens[categoria] = itens[categoria].filter(item => item.id !== id);
    }
    this.salvarItens(itens);
  },

  atualizarValorNovo(id: number, valorNovo: number): void {
    const itens = this.obterTodosItens();
    for (const categoria in itens) {
      const item = itens[categoria].find(i => i.id === id);
      if (item) {
        if (item.valorBackup === null || item.valorBackup === undefined) {
          item.valorBackup = item.valorNovo !== null ? item.valorNovo : item.valor;
        }
        item.valorNovo = valorNovo;
        this.salvarItens(itens);
        return;
      }
    }
  },

  salvarBackupValor(id: number, valorBackup: number): void {
    const itens = this.obterTodosItens();
    for (const categoria in itens) {
      const item = itens[categoria].find(i => i.id === id);
      if (item) {
        item.valorBackup = valorBackup;
        this.salvarItens(itens);
        return;
      }
    }
  },

  resetarValores(): void {
    const itens = this.obterTodosItens();
    for (const categoria in itens) {
      itens[categoria].forEach(item => {
        item.valorNovo = null;
        item.valorBackup = item.valor;
      });
    }
    this.salvarItens(itens);
  },

  // ========== CATEGORIAS ==========
  obterCategorias(): string[] {
    const itens = this.obterTodosItens();
    return Object.keys(itens);
  },

  criarCategoria(nome: string, icone?: string | null): void {
    const itens = this.obterTodosItens();
    if (!itens[nome]) {
      itens[nome] = [];
      this.salvarItens(itens);
    }
  },

  deletarCategoria(nome: string): void {
    const itens = this.obterTodosItens();
    delete itens[nome];
    this.salvarItens(itens);
  },

  renomearCategoria(nomeAntigo: string, nomeNovo: string): void {
    const itens = this.obterTodosItens();
    if (itens[nomeAntigo]) {
      itens[nomeNovo] = itens[nomeAntigo];
      delete itens[nomeAntigo];
      // Atualizar categoria nos itens
      itens[nomeNovo].forEach(item => {
        item.categoria = nomeNovo;
      });
      this.salvarItens(itens);
    }
  },

  // ========== PLATAFORMAS ==========
  obterPlataformas(): Plataforma[] {
    const saved = sessionStorage.getItem(STORAGE_KEYS.PLATAFORMAS);
    return saved ? JSON.parse(saved) : [];
  },

  salvarPlataformas(plataformas: Plataforma[]): void {
    sessionStorage.setItem(STORAGE_KEYS.PLATAFORMAS, JSON.stringify(plataformas));
  },

  criarPlataforma(nome: string, taxa: number, tipoCalculo?: string, periodoCalculo?: string): Plataforma {
    const plataformas = this.obterPlataformas();
    const novaPlataforma: Plataforma = {
      id: Date.now(),
      nome,
      taxa,
      tipoCalculo: (tipoCalculo as 'percentual' | 'valor') || 'percentual',
      periodoCalculo: (periodoCalculo as '1mes' | '3meses') || '1mes',
    };
    plataformas.push(novaPlataforma);
    this.salvarPlataformas(plataformas);
    return novaPlataforma;
  },

  atualizarPlataforma(id: number, updates: Partial<Plataforma>): Plataforma {
    const plataformas = this.obterPlataformas();
    const index = plataformas.findIndex(p => p.id === id);
    if (index !== -1) {
      plataformas[index] = { ...plataformas[index], ...updates };
      this.salvarPlataformas(plataformas);
      return plataformas[index];
    }
    throw new Error('Plataforma não encontrada');
  },

  deletarPlataforma(id: number): void {
    const plataformas = this.obterPlataformas();
    const filtradas = plataformas.filter(p => p.id !== id);
    this.salvarPlataformas(filtradas);
  },

  // ========== CONFIGURAÇÕES (CORES) ==========
  obterConfiguracoes(): ConfiguracoesDemo {
    const saved = sessionStorage.getItem(STORAGE_KEYS.CONFIGURACOES);
    if (saved) {
      try {
        return JSON.parse(saved);
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
  },

  salvarConfiguracoes(config: ConfiguracoesDemo): void {
    sessionStorage.setItem(STORAGE_KEYS.CONFIGURACOES, JSON.stringify(config));
  },
};

