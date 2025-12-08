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
  async criarCheckoutAnual(priceId?: string): Promise<{ sessionId: string; url: string }> {
    const response = await api.post<{ sessionId: string; url: string }>('/api/stripe/checkout/anual', { priceId });
    return response.data;
  },

  async criarCheckoutUnico(priceId?: string): Promise<{ sessionId: string; url: string }> {
    const response = await api.post<{ sessionId: string; url: string }>('/api/stripe/checkout/unico', { priceId });
    return response.data;
  },

  async verificarStatusPagamento(): Promise<{
    temAcesso: boolean;
    tipo: 'anual' | 'unico' | 'vitalicio' | null;
    emailNaoValidado?: boolean;
    assinatura: {
      status: string;
      plano_tipo: string;
      current_period_end: string | null;
      cancel_at_period_end: boolean;
    } | null;
  }> {
    const response = await api.get<{
      temAcesso: boolean;
      tipo: 'anual' | 'unico' | 'vitalicio' | null;
      emailNaoValidado?: boolean;
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

  async atualizarOrdemMenu(secaoIds: string[]): Promise<void> {
    await api.put('/api/configuracoes-menu/ordem', { secaoIds });
  },

  // Planos
  async obterPlanos(): Promise<Array<{
    id: number;
    nome: string;
    tipo: string;
    valor: number;
    valor_parcelado: number | null;
    frase_reforco: string | null;
    valor_total: number | null;
    periodo: string | null;
    desconto_percentual: number;
    desconto_valor: number;
    mais_popular: boolean;
    mostrar_valor_total: boolean;
    mostrar_valor_parcelado: boolean;
    ativo: boolean;
    ordem: number;
    beneficios: string[];
    stripe_price_id: string | null;
  }>> {
    const response = await api.get('/api/planos');
    return response.data;
  },

  async obterPlanosAdmin(): Promise<Array<{
    id: number;
    nome: string;
    tipo: string;
    valor: number;
    valor_parcelado: number | null;
    valor_total: number | null;
    periodo: string | null;
    desconto_percentual: number;
    desconto_valor: number;
    mais_popular: boolean;
    mostrar_valor_total: boolean;
    mostrar_valor_parcelado: boolean;
    ativo: boolean;
    ordem: number;
    beneficios: string[];
    frase_reforco: string | null;
  }>> {
    const response = await api.get('/api/admin/planos');
    return response.data;
  },

  async obterPlanoPorId(id: number): Promise<{
    id: number;
    nome: string;
    tipo: string;
    valor: number;
    valor_parcelado: number | null;
    valor_total: number | null;
    periodo: string | null;
    desconto_percentual: number;
    desconto_valor: number;
    mais_popular: boolean;
    mostrar_valor_total: boolean;
    mostrar_valor_parcelado: boolean;
    ativo: boolean;
    ordem: number;
    beneficios: string[];
  }> {
    const response = await api.get(`/api/admin/planos/${id}`);
    return response.data;
  },

  async criarPlano(plano: {
    nome: string;
    tipo: string;
    valor: number;
    valor_parcelado?: number | null;
    valor_total?: number | null;
    periodo?: string | null;
    desconto_percentual?: number;
    desconto_valor?: number;
    mais_popular?: boolean;
    mostrar_valor_total?: boolean;
    mostrar_valor_parcelado?: boolean;
    ativo?: boolean;
    ordem?: number;
    beneficios?: string[];
  }): Promise<any> {
    const response = await api.post('/api/admin/planos', plano);
    return response.data;
  },

  async atualizarPlano(id: number, plano: {
    nome: string;
    tipo: string;
    valor: number;
    valor_parcelado?: number | null;
    valor_total?: number | null;
    periodo?: string | null;
    desconto_percentual?: number;
    desconto_valor?: number;
    mais_popular?: boolean;
    mostrar_valor_total?: boolean;
    mostrar_valor_parcelado?: boolean;
    ativo?: boolean;
    ordem?: number;
    beneficios?: string[];
  }): Promise<any> {
    const response = await api.put(`/api/admin/planos/${id}`, plano);
    return response.data;
  },

  async deletarPlano(id: number): Promise<void> {
    await api.delete(`/api/admin/planos/${id}`);
  },

  // ========== BENEFÍCIOS ==========
  async atualizarBeneficio(id: number, texto: string, eh_aviso?: boolean, em_beta?: boolean): Promise<{
    id: number;
    texto: string;
    eh_aviso: boolean;
    em_beta: boolean;
  }> {
    const response = await api.put(`/api/admin/beneficios/${id}`, { texto, eh_aviso, em_beta });
    return response.data;
  },

  async deletarBeneficio(id: number): Promise<void> {
    await api.delete(`/api/admin/beneficios/${id}`);
  },

  async removerBeneficioDoPlano(planoId: number, beneficioId: number): Promise<void> {
    await api.delete(`/api/admin/planos/${planoId}/beneficios/${beneficioId}`);
  },

  async obterTodosBeneficios(): Promise<Array<{
    id: number;
    texto: string;
    eh_aviso: boolean;
    em_beta: boolean;
  }>> {
    const response = await api.get('/api/admin/beneficios');
    return response.data;
  },

  async atualizarOrdemPlanos(planosIds: number[]): Promise<void> {
    await api.put('/api/admin/planos/ordem', { planosIds });
  },

  async atualizarOrdemBeneficios(planoId: number, beneficiosIds: number[]): Promise<void> {
    await api.put(`/api/admin/planos/${planoId}/beneficios/ordem`, { beneficiosIds });
  },

  // ========== FAQ ==========
  async obterFAQ(): Promise<Array<{
    id: number;
    pergunta: string;
    resposta: string;
    ordem: number;
  }>> {
    const response = await api.get('/api/faq');
    return response.data;
  },

  async obterFAQAdmin(): Promise<Array<{
    id: number;
    pergunta: string;
    resposta: string;
    ordem: number;
  }>> {
    const response = await api.get('/api/admin/faq');
    return response.data;
  },

  async obterFAQPorId(id: number): Promise<{
    id: number;
    pergunta: string;
    resposta: string;
    ordem: number;
  }> {
    const response = await api.get(`/api/admin/faq/${id}`);
    return response.data;
  },

  async criarFAQ(pergunta: string, resposta: string, ordem?: number): Promise<{
    id: number;
    pergunta: string;
    resposta: string;
    ordem: number;
  }> {
    const response = await api.post('/api/admin/faq', { pergunta, resposta, ordem });
    return response.data;
  },

  async atualizarFAQ(id: number, pergunta: string, resposta: string): Promise<{
    id: number;
    pergunta: string;
    resposta: string;
    ordem: number;
  }> {
    const response = await api.put(`/api/admin/faq/${id}`, { pergunta, resposta });
    return response.data;
  },

  async deletarFAQ(id: number): Promise<void> {
    await api.delete(`/api/admin/faq/${id}`);
  },

  async atualizarOrdemFAQ(faqIds: number[]): Promise<void> {
    await api.put('/api/admin/faq/ordem', { faqIds });
  },

  // ========== Rodapé ==========
  async obterRodapeLinks(): Promise<Array<{
    id: number;
    texto: string;
    link: string;
    coluna: string;
    ordem: number;
    eh_link: boolean;
  }>> {
    const response = await api.get('/api/rodape');
    return response.data;
  },

  async obterRodapeLinksAdmin(): Promise<Array<{
    id: number;
    texto: string;
    link: string;
    coluna: string;
    ordem: number;
    eh_link: boolean;
  }>> {
    const response = await api.get('/api/admin/rodape');
    return response.data;
  },

  async obterColunasRodape(): Promise<string[]> {
    const response = await api.get('/api/admin/rodape/colunas');
    return response.data;
  },

  async atualizarOrdemColunasRodape(nomesColunas: string[]): Promise<void> {
    await api.put('/api/admin/rodape/colunas/ordem', { nomesColunas });
  },

  async obterRodapeLinkPorId(id: number): Promise<{
    id: number;
    texto: string;
    link: string;
    coluna: string;
    ordem: number;
    eh_link: boolean;
  }> {
    const response = await api.get(`/api/admin/rodape/${id}`);
    return response.data;
  },

  async criarRodapeLink(texto: string, link: string, coluna: string, ordem?: number, eh_link?: boolean): Promise<{
    id: number;
    texto: string;
    link: string;
    coluna: string;
    ordem: number;
    eh_link: boolean;
  }> {
    const response = await api.post('/api/admin/rodape', { texto, link, coluna, ordem, eh_link });
    return response.data;
  },

  async atualizarRodapeLink(id: number, texto: string, link: string, coluna: string, eh_link?: boolean): Promise<{
    id: number;
    texto: string;
    link: string;
    coluna: string;
    ordem: number;
    eh_link: boolean;
  }> {
    // Garantir que eh_link seja sempre enviado como booleano
    const payload = {
      texto,
      link,
      coluna,
      eh_link: eh_link !== undefined ? Boolean(eh_link) : true
    };
    const response = await api.put(`/api/admin/rodape/${id}`, payload);
    return response.data;
  },

  async deletarRodapeLink(id: number): Promise<void> {
    await api.delete(`/api/admin/rodape/${id}`);
  },

  async atualizarOrdemRodapeLinks(linkIds: number[]): Promise<void> {
    await api.put('/api/admin/rodape/ordem', { linkIds });
  },

  // ========== Configurações de Sessões da Landing Page ==========
  async obterConfiguracoesSessoes(): Promise<Array<{ id: string; nome: string; ativa: boolean; ordem: number }>> {
    const response = await api.get<Array<{ id: string; nome: string; ativa: boolean; ordem: number }>>('/api/configuracoes-sessoes');
    return response.data;
  },

  async atualizarConfiguracoesSessoes(configuracoes: Array<{ id: string; ativa: boolean }>): Promise<Array<{ id: string; nome: string; ativa: boolean; ordem: number }>> {
    const response = await api.put<Array<{ id: string; nome: string; ativa: boolean; ordem: number }>>('/api/configuracoes-sessoes', { configuracoes });
    return response.data;
  },

  async atualizarOrdemSessoes(sessaoIds: string[]): Promise<void> {
    await api.put('/api/configuracoes-sessoes/ordem', { sessaoIds });
  },
  // Estatísticas
  async registrarAtividade(): Promise<void> {
    await api.post('/api/auth/activity');
  },
  async obterEstatisticasUsuario(): Promise<any> {
    const response = await api.get('/api/auth/stats');
    return response.data;
  },
  async obterEstatisticasUsuarioPorId(usuarioId: number): Promise<any> {
    const response = await api.get(`/api/admin/user-stats/${usuarioId}`);
    return response.data;
  },
  async obterEstatisticasTodosUsuarios(): Promise<any[]> {
    const response = await api.get('/api/admin/user-stats');
    return response.data;
  },
  async obterEstatisticasGerais(): Promise<any> {
    const response = await api.get('/api/admin/stats-gerais');
    return response.data;
  },
  async finalizarSessao(): Promise<void> {
    await api.post('/api/auth/logout');
  },
  // Validação de email
  async validarEmail(token: string): Promise<any> {
    const response = await api.get(`/api/auth/validar-email/${token}`);
    return response.data;
  },
  async reenviarEmailValidacao(): Promise<void> {
    await api.post('/api/auth/reenviar-email-validacao');
  },
  // Dados do usuário
  async obterDadosUsuario(): Promise<any> {
    const response = await api.get('/api/auth/dados');
    return response.data;
  },
  async atualizarDadosUsuario(dados: any): Promise<any> {
    const response = await api.put('/api/auth/alterar-dados', dados);
    return response.data;
  },
  async uploadFotoPerfil(fotoBase64: string): Promise<any> {
    const response = await api.post('/api/auth/upload-foto', { fotoBase64 });
    return response.data;
  },

  // Cardápio
  async atualizarCardapioPublico(cardapioPublico: boolean): Promise<any> {
    const response = await api.put('/api/auth/cardapio-publico', { cardapio_publico: cardapioPublico });
    return response.data;
  },

  async atualizarCardapioCompartilhar(cardapioCompartilhar: boolean): Promise<any> {
    const response = await api.put('/api/auth/cardapio-compartilhar', { cardapio_compartilhar: cardapioCompartilhar });
    return response.data;
  },

  // Feedback Beta
  async verificarFeedbackBeta(): Promise<{
    deveMostrar: boolean;
    feedbackEnviado: boolean;
    temFuncoesBeta: boolean;
  }> {
    const response = await api.get('/api/auth/feedback-beta/verificar');
    return response.data;
  },

  async criarFeedbackBeta(dados: {
    funcao_id?: number | null;
    funcao_titulo?: string | null;
    avaliacao: number;
    comentario?: string | null;
    sugestoes?: string | null;
  }): Promise<any> {
    const response = await api.post('/api/auth/feedback-beta', dados);
    return response.data;
  },

  // Admin - Feedbacks Beta
  async obterFeedbacksBeta(): Promise<any[]> {
    const response = await api.get('/api/admin/feedbacks-beta');
    return response.data;
  },
};

