import axios from 'axios';
import type { Item, ItensPorCategoria, Categoria } from '../types';
import type { Plataforma } from '../utils/plataformas';
import { getAuthHeaders, clearAuth } from './auth';

const API_BASE = import.meta.env.VITE_API_BASE || window.location.origin;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use(
  (config) => {
    const authHeaders = getAuthHeaders();
    if (authHeaders.Authorization) {
      config.headers.Authorization = authHeaders.Authorization;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Só redirecionar para login se for erro de autenticação (401)
    // Erros 403 podem ser de pagamento requerido, que não devem redirecionar
    if (error.response?.status === 401) {
      clearAuth();
      window.location.href = '/';
    }
    // Para 403, apenas rejeitar a promise sem redirecionar
    return Promise.reject(error);
  }
);

export const apiService = {
  // Itens
  async obterTodosItens(): Promise<ItensPorCategoria> {
    const response = await api.get<ItensPorCategoria>('/api/itens');
    return response.data;
  },

  async obterItensPorCategoria(categoria: string): Promise<Item[]> {
    const response = await api.get<Item[]>(`/api/itens/categoria/${encodeURIComponent(categoria)}`);
    return response.data;
  },

  async criarItem(categoria: string, nome: string, valor: number): Promise<Item> {
    const response = await api.post<Item>('/api/itens', { categoria, nome, valor });
    return response.data;
  },

  async atualizarItem(id: number, nome?: string, valor?: number, categoria?: string): Promise<Item> {
    const response = await api.put<Item>(`/api/itens/${id}`, { nome, valor, categoria });
    return response.data;
  },

  async atualizarValorNovo(id: number, valorNovo: number | null): Promise<Item> {
    const response = await api.put<Item>(`/api/itens/${id}`, { valorNovo });
    return response.data;
  },

  async deletarItem(id: number): Promise<void> {
    await api.delete(`/api/itens/${id}`);
  },

  async salvarBackupValor(id: number, valorBackup: number): Promise<void> {
    await api.post(`/api/itens/${id}/backup`, { valorBackup });
  },

  async resetarValores(): Promise<{ message: string; itensAtualizados: number }> {
    const response = await api.post<{ message: string; itensAtualizados: number }>('/api/resetar-valores');
    return response.data;
  },

  // Categorias
  async obterCategorias(): Promise<string[]> {
    const response = await api.get<string[]>('/api/categorias');
    return response.data;
  },

  async criarCategoria(nome: string, icone?: string | null): Promise<Categoria> {
    const response = await api.post<Categoria>('/api/categorias', { nome, icone: icone || null });
    return response.data;
  },

  async renomearCategoria(nomeAntigo: string, nomeNovo: string): Promise<void> {
    await api.put(`/api/categorias/${encodeURIComponent(nomeAntigo)}`, { nomeNovo });
  },

  async atualizarIconeCategoria(nome: string, icone: string): Promise<void> {
    await api.put(`/api/categorias/${encodeURIComponent(nome)}/icone`, { icone });
  },

  async obterIconeCategoria(nome: string): Promise<string | null> {
    const response = await api.get<{ icone: string | null }>(`/api/categorias/${encodeURIComponent(nome)}/icone`);
    return response.data.icone;
  },

  async deletarCategoria(nome: string): Promise<void> {
    await api.delete(`/api/categorias/${encodeURIComponent(nome)}`);
  },

  async atualizarOrdemCategorias(categorias: string[]): Promise<void> {
    await api.put('/api/categorias/ordem', { categorias });
  },

  async atualizarOrdemItens(categoria: string, itensIds: number[]): Promise<void> {
    await api.put(`/api/itens/categoria/${encodeURIComponent(categoria)}/ordem`, { itensIds });
  },

  // Stripe
  async criarCheckoutAnual(): Promise<{ sessionId: string; url: string }> {
    const response = await api.post<{ sessionId: string; url: string }>('/api/stripe/checkout/anual');
    return response.data;
  },

  async criarCheckoutUnico(): Promise<{ sessionId: string; url: string }> {
    const response = await api.post<{ sessionId: string; url: string }>('/api/stripe/checkout/unico');
    return response.data;
  },

  async verificarStatusPagamento(): Promise<{
    temAcesso: boolean;
    tipo: 'anual' | 'unico' | null;
    assinatura: {
      status: string;
      plano_tipo: string;
      current_period_end: string | null;
      cancel_at_period_end: boolean;
    } | null;
  }> {
    const response = await api.get<{
      temAcesso: boolean;
      tipo: 'anual' | 'unico' | null;
      assinatura: {
        status: string;
        plano_tipo: string;
        current_period_end: string | null;
        cancel_at_period_end: boolean;
      } | null;
    }>('/api/stripe/status');
    return response.data;
  },

  async cancelarAssinatura(cancelarImediatamente: boolean = false): Promise<void> {
    await api.post('/api/stripe/cancelar-assinatura', { cancelarImediatamente });
  },

  async criarSessaoCustomerPortal(): Promise<{ url: string }> {
    const response = await api.post<{ url: string }>('/api/stripe/customer-portal');
    return response.data;
  },

  // Plataformas
  async obterPlataformas(): Promise<Plataforma[]> {
    const response = await api.get<Plataforma[]>('/api/plataformas');
    return response.data;
  },

  async criarPlataforma(nome: string, taxa: number): Promise<Plataforma> {
    const response = await api.post<Plataforma>('/api/plataformas', { nome, taxa });
    return response.data;
  },

  async atualizarPlataforma(id: number, nome: string, taxa: number): Promise<Plataforma> {
    const response = await api.put<Plataforma>(`/api/plataformas/${id}`, { nome, taxa });
    return response.data;
  },

  async deletarPlataforma(id: number): Promise<void> {
    await api.delete(`/api/plataformas/${id}`);
  },

  async atualizarOrdemPlataformas(plataformasIds: number[]): Promise<void> {
    await api.put('/api/plataformas/ordem', { plataformasIds });
  },

  // Tutorial
  async verificarStatusTutorial(): Promise<{ completed: boolean }> {
    const response = await api.get<{ completed: boolean }>('/api/tutorial/status');
    return response.data;
  },

  async marcarTutorialCompleto(): Promise<void> {
    await api.post('/api/tutorial/complete');
  },

  async resetarTutorial(): Promise<void> {
    await api.post('/api/tutorial/reset');
  },

  // Funções
  async obterFuncoes(): Promise<any[]> {
    const response = await api.get('/api/funcoes');
    return response.data;
  },

  async criarFuncao(funcao: any): Promise<any> {
    const response = await api.post('/api/funcoes', funcao);
    return response.data;
  },

  async atualizarFuncao(id: number, funcao: any): Promise<any> {
    const response = await api.put(`/api/funcoes/${id}`, funcao);
    return response.data;
  },

  async deletarFuncao(id: number): Promise<void> {
    await api.delete(`/api/funcoes/${id}`);
  },

  // Configurações do Menu
  async obterConfiguracoesMenu(): Promise<Array<{ id: string; nome: string; ativa: boolean; ordem: number }>> {
    const response = await api.get<Array<{ id: string; nome: string; ativa: boolean; ordem: number }>>('/api/configuracoes-menu');
    return response.data;
  },

  async atualizarConfiguracoesMenu(configuracoes: Array<{ id: string; ativa: boolean }>): Promise<Array<{ id: string; nome: string; ativa: boolean; ordem: number }>> {
    const response = await api.put<Array<{ id: string; nome: string; ativa: boolean; ordem: number }>>('/api/configuracoes-menu', { configuracoes });
    return response.data;
  },
};

