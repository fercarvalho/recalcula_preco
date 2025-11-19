import axios from 'axios';
import type { Item, ItensPorCategoria, Categoria } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE || window.location.origin;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
};

