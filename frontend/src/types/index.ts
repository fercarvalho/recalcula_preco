export interface Item {
  id: number;
  nome: string;
  valor: number;
  valorNovo: number | null;
  valorBackup: number;
  ordem: number;
}

export interface ItensPorCategoria {
  [categoria: string]: Item[];
}

export interface Categoria {
  nome: string;
  ordem: number;
}

export type TipoReajuste = 'fixo' | 'percentual';

export interface Plataforma {
  id?: number;
  nome: string;
  taxa: number;
}

export interface ModalState {
  isOpen: boolean;
  type: 'alert' | 'confirm' | 'prompt' | 'selecao-categoria' | 'editar-item' | 'painel-admin' | 'plataformas' | 'plataforma-form' | 'plataforma-editar' | null;
  data?: any;
}

