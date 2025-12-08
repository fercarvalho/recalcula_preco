import { useState, useEffect, useCallback } from 'react';
import Modal from './Modal';
import { mostrarAlert, mostrarConfirm } from '../utils/modals';
import { getToken } from '../services/auth';
import AdicionarCategoriaModal from './AdicionarCategoriaModal';
import SelecionarIconeModal from './SelecionarIconeModal';
import GerenciamentoFuncoes from './GerenciamentoFuncoes';
import GerenciamentoMenu from './GerenciamentoMenu';
import GerenciamentoPlanos from './GerenciamentoPlanos';
import GerenciamentoFAQ from './GerenciamentoFAQ';
import GerenciamentoRodape from './GerenciamentoRodape';
import GerenciamentoSessoes from './GerenciamentoSessoes';
import OrganizarFuncoesModal from './OrganizarFuncoesModal';
import EstatisticasUsuarios from './EstatisticasUsuarios';
import EstatisticasGerais from './EstatisticasGerais';
import GerenciamentoFeedbacksBeta from './GerenciamentoFeedbacksBeta';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { FaUser, FaEdit, FaTrash, FaShieldAlt, FaChevronRight, FaChevronDown, FaFolder, FaEye, FaEyeSlash, FaPlus, FaTimes, FaCog, FaBars, FaCreditCard, FaQuestionCircle, FaLink, FaLayerGroup, FaGripVertical, FaSearch, FaSortAlphaDown, FaSortAlphaUp, FaSort, FaChartLine, FaComments } from 'react-icons/fa';
import * as FaIcons from 'react-icons/fa';
import './AdminPanel.css';

interface Usuario {
  id: number;
  username: string;
  email?: string;
  is_admin: boolean;
  created_at: string;
}

interface UsuarioDetalhes {
  usuario: Usuario;
  itens: { [categoria: string]: any[] };
  categorias: string[];
}

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onCarregarUsuarioNoSistema?: (usuarioId: number) => Promise<void>;
}

// Estrutura dos botões de gerenciamento com ordem
interface GerenciamentoButton {
  id: string;
  titulo: string;
  descricao: string;
  icone: React.ReactNode;
  onClick: () => void;
  ordem: number;
}

const AdminPanel = ({ isOpen, onClose, onCarregarUsuarioNoSistema }: AdminPanelProps) => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<number | null>(null);
  const [usuarioDetalhes, setUsuarioDetalhes] = useState<UsuarioDetalhes | null>(null);
  const [loading, setLoading] = useState(false);
  const [buscaUsuario, setBuscaUsuario] = useState<string>('');
  const [ordemUsuarios, setOrdemUsuarios] = useState<'nenhuma' | 'crescente' | 'decrescente'>('nenhuma');
  const [showEditarUsuario, setShowEditarUsuario] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [categoriasExpandidas, setCategoriasExpandidas] = useState<Set<string>>(new Set());
  const [showEditarItem, setShowEditarItem] = useState(false);
  const [itemEditando, setItemEditando] = useState<any | null>(null);
  const [showAdicionarItem, setShowAdicionarItem] = useState(false);
  const [categoriaParaItem, setCategoriaParaItem] = useState<string>('');
  const [showAdicionarCategoria, setShowAdicionarCategoria] = useState(false);
  const [showEditarCategoria, setShowEditarCategoria] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState<string>('');
  const [showGerenciamentoFuncoes, setShowGerenciamentoFuncoes] = useState(false);
  const [showGerenciamentoMenu, setShowGerenciamentoMenu] = useState(false);
  const [showGerenciamentoPlanos, setShowGerenciamentoPlanos] = useState(false);
  const [showGerenciamentoFAQ, setShowGerenciamentoFAQ] = useState(false);
  const [showGerenciamentoRodape, setShowGerenciamentoRodape] = useState(false);
  const [showGerenciamentoSessoes, setShowGerenciamentoSessoes] = useState(false);
  const [showOrganizarFuncoes, setShowOrganizarFuncoes] = useState(false);
  const [showEstatisticasUsuarios, setShowEstatisticasUsuarios] = useState(false);
  const [usuarioEstatisticasId, setUsuarioEstatisticasId] = useState<number | null>(null);
  const [usuarioEstatisticasNome, setUsuarioEstatisticasNome] = useState<string>('');
  const [showEstatisticasGerais, setShowEstatisticasGerais] = useState(false);
  const [showGerenciamentoFeedbacksBeta, setShowGerenciamentoFeedbacksBeta] = useState(false);

  const [botoesGerenciamento, setBotoesGerenciamento] = useState<GerenciamentoButton[]>([
    { id: 'funcoes', titulo: 'Gerenciar Funções da Landing Page', descricao: 'Gerencie as funções exibidas na landing page. Configure quais funções estão ativas e quais são de IA.', icone: <FaCog />, onClick: () => setShowGerenciamentoFuncoes(true), ordem: 1 },
    { id: 'menu', titulo: 'Gerenciar Menu', descricao: 'Escolha quais seções da landing page aparecem no menu de navegação do header.', icone: <FaBars />, onClick: () => setShowGerenciamentoMenu(true), ordem: 2 },
    { id: 'sessoes', titulo: 'Gerenciar Sessões da Landing Page', descricao: 'Gerencie quais sessões da landing page devem ser exibidas. Lembre-se: todas as sessões com funções são uma sessão só.', icone: <FaLayerGroup />, onClick: () => setShowGerenciamentoSessoes(true), ordem: 3 },
    { id: 'planos', titulo: 'Gerenciar Planos', descricao: 'Gerencie os planos de pagamento: valores, benefícios, descontos, tipo de pagamento e outras configurações.', icone: <FaCreditCard />, onClick: () => setShowGerenciamentoPlanos(true), ordem: 4 },
    { id: 'faq', titulo: 'Gerenciar FAQ', descricao: 'Gerencie as perguntas frequentes (FAQ) exibidas na landing page.', icone: <FaQuestionCircle />, onClick: () => setShowGerenciamentoFAQ(true), ordem: 5 },
    { id: 'rodape', titulo: 'Gerenciar Rodapé', descricao: 'Gerencie as colunas e links do rodapé da landing page.', icone: <FaLink />, onClick: () => setShowGerenciamentoRodape(true), ordem: 6 },
    { id: 'feedbacks-beta', titulo: 'Feedbacks Beta', descricao: 'Visualize todos os feedbacks enviados pelos usuários sobre as funções em beta.', icone: <FaComments />, onClick: () => setShowGerenciamentoFeedbacksBeta(true), ordem: 7 },
  ]);

  // Mapa de IDs para títulos dos botões (para exibição no botão)
  const titulosBotoes: Record<string, string> = {
    'funcoes': 'Gerenciar Funções',
    'menu': 'Gerenciar Menu',
    'sessoes': 'Gerenciar Sessões',
    'planos': 'Gerenciar Planos',
    'faq': 'Gerenciar FAQ',
    'rodape': 'Gerenciar Rodapé',
  };

  useEffect(() => {
    if (isOpen) {
      carregarUsuarios();
      carregarOrdemBotoesGerenciamento();
    }
  }, [isOpen]);

  const carregarOrdemBotoesGerenciamento = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || window.location.origin;
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/admin/ordem-gerenciamentos`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.ordem && Array.isArray(data.ordem)) {
          // Reordenar botões baseado na ordem salva
          const ordemMap = new Map(data.ordem.map((id: string, index: number) => [id, index + 1]));
          setBotoesGerenciamento(prev => {
            const novosBotoes = [...prev];
            novosBotoes.sort((a, b) => {
              const ordemA = ordemMap.get(a.id) ?? a.ordem ?? 0;
              const ordemB = ordemMap.get(b.id) ?? b.ordem ?? 0;
              return Number(ordemA) - Number(ordemB);
            });
            // Atualizar ordem dos botões
            return novosBotoes.map((botao, index) => ({ ...botao, ordem: index + 1 }));
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar ordem dos botões de gerenciamento:', error);
      // Continuar com ordem padrão em caso de erro
    }
  };

  const carregarUsuarios = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || window.location.origin;
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/admin/usuarios`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsuarios(data);
      } else {
        throw new Error('Erro ao carregar usuários');
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      await mostrarAlert('Erro', 'Erro ao carregar lista de usuários.');
    }
  };

  const carregarDetalhesUsuario = async (usuarioId: number) => {
    setLoading(true);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || window.location.origin;
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/admin/usuarios/${usuarioId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Dados recebidos:', data);
        setUsuarioDetalhes(data);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || 'Erro ao carregar detalhes do usuário');
      }
    } catch (error: any) {
      console.error('Erro ao carregar detalhes:', error);
      await mostrarAlert('Erro', error.message || 'Erro ao carregar detalhes do usuário.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelecionarUsuario = async (usuarioId: number) => {
    // Se já está selecionado, apenas deseleciona
    if (usuarioSelecionado === usuarioId) {
      setUsuarioSelecionado(null);
      setUsuarioDetalhes(null);
      return;
    }

    // Se tem a função de carregar no sistema, carrega diretamente
    if (onCarregarUsuarioNoSistema) {
      await onCarregarUsuarioNoSistema(usuarioId);
      onClose();
    } else {
      // Caso contrário, apenas expande os detalhes (comportamento antigo)
      setUsuarioSelecionado(usuarioId);
      carregarDetalhesUsuario(usuarioId);
    }
  };

  const handleEditarUsuario = (usuario: Usuario) => {
    setUsuarioEditando(usuario);
    setShowEditarUsuario(true);
  };

  const handleDeletarUsuario = async (usuario: Usuario) => {
    const confirmado = await mostrarConfirm(
      'Deletar Usuário',
      `Tem certeza que deseja deletar o usuário "${usuario.username}"? Esta ação não pode ser desfeita e todos os dados do usuário serão perdidos.`
    );

    if (!confirmado) return;

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || window.location.origin;
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/admin/usuarios/${usuario.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await mostrarAlert('Sucesso', 'Usuário deletado com sucesso!');
        await carregarUsuarios();
        if (usuarioSelecionado === usuario.id) {
          setUsuarioSelecionado(null);
          setUsuarioDetalhes(null);
        }
      } else {
        let errorMessage = 'Erro ao deletar usuário';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Erro ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Erro ao deletar usuário:', error);
      await mostrarAlert('Erro', error.message || 'Erro ao deletar usuário.');
    }
  };

  const toggleCategoria = (categoria: string) => {
    setCategoriasExpandidas(prev => {
      const novo = new Set(prev);
      if (novo.has(categoria)) {
        novo.delete(categoria);
      } else {
        novo.add(categoria);
      }
      return novo;
    });
  };

  const handleEditarItem = (item: any) => {
    setItemEditando(item);
    setShowEditarItem(true);
  };

  const handleDeletarItem = async (item: any) => {
    if (!usuarioSelecionado) return;
    
    const confirmado = await mostrarConfirm(
      'Deletar Item',
      `Tem certeza que deseja deletar o item "${item.nome}"?`
    );

    if (!confirmado) return;

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || window.location.origin;
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/admin/usuarios/${usuarioSelecionado}/itens/${item.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await mostrarAlert('Sucesso', 'Item deletado com sucesso!');
        await carregarDetalhesUsuario(usuarioSelecionado);
      } else {
        let errorMessage = 'Erro ao deletar item';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Erro ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Erro ao deletar item:', error);
      await mostrarAlert('Erro', error.message || 'Erro ao deletar item.');
    }
  };

  const handleAdicionarItem = (categoria?: string) => {
    setCategoriaParaItem(categoria || '');
    setShowAdicionarItem(true);
  };

  const handleEditarCategoria = (categoria: string) => {
    setCategoriaEditando(categoria);
    setShowEditarCategoria(true);
  };

  const handleDeletarCategoria = async (categoria: string) => {
    if (!usuarioSelecionado) return;
    
    const confirmado = await mostrarConfirm(
      'Deletar Categoria',
      `Tem certeza que deseja deletar a categoria "${categoria}"? Todos os itens desta categoria também serão deletados.`
    );

    if (!confirmado) return;

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || window.location.origin;
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/admin/usuarios/${usuarioSelecionado}/categorias/${encodeURIComponent(categoria)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await mostrarAlert('Sucesso', 'Categoria deletada com sucesso!');
        await carregarDetalhesUsuario(usuarioSelecionado);
      } else {
        let errorMessage = 'Erro ao deletar categoria';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Erro ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Erro ao deletar categoria:', error);
      await mostrarAlert('Erro', error.message || 'Erro ao deletar categoria.');
    }
  };

  const handleSalvarCategoria = async (nome: string, icone: string | null) => {
    if (!usuarioSelecionado) return;

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || window.location.origin;
      const token = getToken();
      
      if (categoriaEditando) {
        // Editar categoria existente
        const response = await fetch(`${API_BASE}/api/admin/usuarios/${usuarioSelecionado}/categorias/${encodeURIComponent(categoriaEditando)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            novoNome: nome !== categoriaEditando ? nome : undefined,
            icone: icone,
          }),
        });

        if (response.ok) {
          await mostrarAlert('Sucesso', 'Categoria atualizada com sucesso!');
          await carregarDetalhesUsuario(usuarioSelecionado);
          setShowEditarCategoria(false);
          setCategoriaEditando('');
        } else {
          let errorMessage = 'Erro ao atualizar categoria';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            errorMessage = `Erro ${response.status}: ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }
      } else {
        // Criar nova categoria
        const response = await fetch(`${API_BASE}/api/admin/usuarios/${usuarioSelecionado}/categorias`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            nome: nome,
            icone: icone,
          }),
        });

        if (response.ok) {
          await mostrarAlert('Sucesso', 'Categoria criada com sucesso!');
          await carregarDetalhesUsuario(usuarioSelecionado);
          setShowAdicionarCategoria(false);
        } else {
          let errorMessage = 'Erro ao criar categoria';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            errorMessage = `Erro ${response.status}: ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }
      }
    } catch (error: any) {
      console.error('Erro ao salvar categoria:', error);
      await mostrarAlert('Erro', error.message || 'Erro ao salvar categoria.');
    }
  };

  const obterIconeCategoria = (_categoria: string): string | null => {
    // Por enquanto retornar null, pode ser implementado depois se necessário
    return null;
  };

  const handleCloseGerenciamentoFuncoes = useCallback(() => {
    setShowGerenciamentoFuncoes(false);
  }, []);

  const handleCloseGerenciamentoMenu = useCallback(() => {
    setShowGerenciamentoMenu(false);
  }, []);

  const handleCloseGerenciamentoPlanos = useCallback(() => {
    setShowGerenciamentoPlanos(false);
  }, []);

  const handleCloseGerenciamentoFAQ = useCallback(() => {
    setShowGerenciamentoFAQ(false);
  }, []);

  const handleCloseGerenciamentoRodape = useCallback(() => {
    setShowGerenciamentoRodape(false);
  }, []);

  const handleCloseGerenciamentoSessoes = useCallback(() => {
    setShowGerenciamentoSessoes(false);
  }, []);

  // Drag and drop para reordenar botões de gerenciamento
  const handleReorderBotoes = async (novosBotoes: GerenciamentoButton[]) => {
    // Atualizar ordem localmente
    const botoesComOrdemAtualizada = novosBotoes.map((botao, index) => ({
      ...botao,
      ordem: index + 1
    }));
    setBotoesGerenciamento(botoesComOrdemAtualizada);

    try {
      // Salvar ordem no servidor
      const API_BASE = import.meta.env.VITE_API_BASE || window.location.origin;
      const token = getToken();
      const ordem = botoesComOrdemAtualizada.map(b => b.id);
      
      const response = await fetch(`${API_BASE}/api/admin/ordem-gerenciamentos`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ ordem }),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar ordem dos botões');
      }
    } catch (error) {
      console.error('Erro ao salvar ordem dos botões:', error);
      await mostrarAlert('Erro', 'Erro ao salvar ordem dos botões. Tente novamente.');
      // Recarregar ordem original em caso de erro
      await carregarOrdemBotoesGerenciamento();
    }
  };

  // Garantir que todos os botões tenham ID para o drag and drop
  const botoesComIds = botoesGerenciamento.map((b, index) => ({
    ...b,
    id: b.id || `botao-${index}`
  }));

  const {
    handleDragStart: handleDragStartBotao,
    handleDragEnd: handleDragEndBotao,
    handleDragOver: handleDragOverBotao,
    handleDrop: handleDropBotao,
    handleDragLeave: handleDragLeaveBotao,
  } = useDragAndDrop(botoesComIds, handleReorderBotoes);

  if (!isOpen) return null;

  return (
    <>
      <GerenciamentoFuncoes
        isOpen={showGerenciamentoFuncoes}
        onClose={handleCloseGerenciamentoFuncoes}
        onOpenOrganizar={() => setShowOrganizarFuncoes(true)}
      />
      <OrganizarFuncoesModal
        isOpen={showOrganizarFuncoes}
        onClose={() => setShowOrganizarFuncoes(false)}
        onUpdate={async () => {
          // Disparar evento para atualizar funções
          window.dispatchEvent(new CustomEvent('funcoes-updated'));
        }}
      />
      <GerenciamentoMenu
        isOpen={showGerenciamentoMenu}
        onClose={handleCloseGerenciamentoMenu}
      />
      <GerenciamentoPlanos
        isOpen={showGerenciamentoPlanos}
        onClose={handleCloseGerenciamentoPlanos}
      />
      <GerenciamentoFAQ
        isOpen={showGerenciamentoFAQ}
        onClose={handleCloseGerenciamentoFAQ}
      />
      <GerenciamentoRodape
        isOpen={showGerenciamentoRodape}
        onClose={handleCloseGerenciamentoRodape}
      />
      <GerenciamentoSessoes
        isOpen={showGerenciamentoSessoes}
        onClose={handleCloseGerenciamentoSessoes}
      />
      <EstatisticasUsuarios
        isOpen={showEstatisticasUsuarios}
        onClose={() => {
          setShowEstatisticasUsuarios(false);
          setUsuarioEstatisticasId(null);
          setUsuarioEstatisticasNome('');
        }}
        usuarioId={usuarioEstatisticasId || undefined}
        username={usuarioEstatisticasNome}
      />

      <EstatisticasGerais
        isOpen={showEstatisticasGerais}
        onClose={() => setShowEstatisticasGerais(false)}
      />
      <GerenciamentoFeedbacksBeta
        isOpen={showGerenciamentoFeedbacksBeta}
        onClose={() => setShowGerenciamentoFeedbacksBeta(false)}
      />
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Painel de Administração"
        size="large"
      >
        <div className="admin-panel">
          <div className="admin-section" style={{ marginBottom: '30px', paddingBottom: '30px', borderBottom: 'none' }}>
            <h3>Gerenciamento da Landing Page</h3>
            <div className="admin-buttons-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {botoesComIds.map((botao) => {
                const botaoId = botao.id;
                return (
                  <div
                    key={botaoId}
                    className="admin-botao-item"
                    draggable
                    onDragStart={(e) => handleDragStartBotao(e, botaoId, 'item')}
                    onDragEnd={handleDragEndBotao}
                    onDragOver={(e) => handleDragOverBotao(e, botaoId)}
                    onDrop={(e) => handleDropBotao(e, botaoId)}
                    onDragLeave={handleDragLeaveBotao}
                    style={{ position: 'relative' }}
                  >
                    <div className="admin-botao-drag-handle" style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', cursor: 'grab', color: '#999', zIndex: 1 }}>
                      <FaGripVertical />
                    </div>
                    <div style={{ paddingLeft: '30px' }}>
                      <h4 style={{ marginBottom: '8px', fontSize: '16px', fontWeight: '500' }}>
                        {botao.icone} {botao.titulo}
                      </h4>
                      <div style={{ borderBottom: '1px solid #e9ecef', marginBottom: '12px' }}></div>
                      <p style={{ marginBottom: '12px', color: '#666', fontSize: '14px' }}>
                        {botao.descricao}
                      </p>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          botao.onClick();
                        }}
                        className="btn-primary"
                        style={{ width: '100%', justifyContent: 'flex-start', textAlign: 'left' }}
                      >
                        {botao.icone} {titulosBotoes[botao.id] || botao.titulo.replace('Gerenciar ', '')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="admin-usuarios-list">
            <h3 style={{ marginBottom: '15px' }}>Usuários do Sistema</h3>
            <div style={{ marginBottom: '15px' }}>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Botão Estatísticas Gerais clicado, showEstatisticasGerais:', showEstatisticasGerais);
                  setShowEstatisticasGerais(true);
                  console.log('Estado atualizado para true');
                }}
                className="btn-primary"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '0.9rem',
                  padding: '10px 16px',
                  marginBottom: '15px'
                }}
              >
                <FaChartLine /> Estatísticas Gerais
              </button>
            </div>
            <div className="admin-busca-usuario" style={{ marginBottom: '15px' }}>
              <div style={{ position: 'relative' }}>
                <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                <input
                  type="text"
                  placeholder="Buscar por nome ou email..."
                  value={buscaUsuario}
                  onChange={(e) => setBuscaUsuario(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 40px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--cor-primaria, #FF6B35)'}
                  onBlur={(e) => e.target.style.borderColor = '#ddd'}
                />
              </div>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <button
                onClick={() => {
                  if (ordemUsuarios === 'nenhuma') {
                    setOrdemUsuarios('crescente');
                  } else if (ordemUsuarios === 'crescente') {
                    setOrdemUsuarios('decrescente');
                  } else {
                    setOrdemUsuarios('nenhuma');
                  }
                }}
                className="btn-secondary"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '0.875rem',
                  padding: '8px 12px'
                }}
                title={
                  ordemUsuarios === 'nenhuma' 
                    ? 'Ordenar alfabeticamente (A-Z)'
                    : ordemUsuarios === 'crescente'
                    ? 'Ordenar alfabeticamente (Z-A)'
                    : 'Remover ordenação'
                }
              >
                {ordemUsuarios === 'nenhuma' && (
                  <>
                    <FaSort /> Ordenar Lista
                  </>
                )}
                {ordemUsuarios === 'crescente' && (
                  <>
                    <FaSortAlphaDown /> A-Z
                  </>
                )}
                {ordemUsuarios === 'decrescente' && (
                  <>
                    <FaSortAlphaUp /> Z-A
                  </>
                )}
              </button>
            </div>
            <div className="usuarios-list">
              {usuarios
                .filter(usuario => {
                  if (!buscaUsuario.trim()) return true;
                  const termo = buscaUsuario.toLowerCase().trim();
                  const nome = usuario.username?.toLowerCase() || '';
                  const email = usuario.email?.toLowerCase() || '';
                  return nome.includes(termo) || email.includes(termo);
                })
                .sort((a, b) => {
                  if (ordemUsuarios === 'nenhuma') return 0;
                  const nomeA = a.username?.toLowerCase() || '';
                  const nomeB = b.username?.toLowerCase() || '';
                  if (ordemUsuarios === 'crescente') {
                    return nomeA.localeCompare(nomeB, 'pt-BR');
                  } else {
                    return nomeB.localeCompare(nomeA, 'pt-BR');
                  }
                })
                .map(usuario => (
                <div
                  key={usuario.id}
                  className={`usuario-item ${usuarioSelecionado === usuario.id ? 'selected' : ''} ${onCarregarUsuarioNoSistema ? 'clickable' : ''}`}
                  onClick={() => handleSelecionarUsuario(usuario.id)}
                  title={onCarregarUsuarioNoSistema ? `Clique para carregar os dados de "${usuario.username}" no sistema` : undefined}
                >
                  <div className="usuario-item-header">
                    <div className="usuario-info">
                      <FaUser />
                      <span className="usuario-nome">{usuario.username}</span>
                      {usuario.is_admin && (
                        <span className="badge-admin">
                          <FaShieldAlt /> Admin
                        </span>
                      )}
                    </div>
                    <div className="usuario-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUsuarioEstatisticasId(usuario.id);
                          setUsuarioEstatisticasNome(usuario.username);
                          setShowEstatisticasUsuarios(true);
                        }}
                        title="Ver estatísticas"
                        style={{ color: 'var(--cor-primaria, #FF6B35)' }}
                      >
                        <FaChartLine />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (usuarioSelecionado === usuario.id) {
                            setUsuarioSelecionado(null);
                            setUsuarioDetalhes(null);
                          } else {
                            setUsuarioSelecionado(usuario.id);
                            carregarDetalhesUsuario(usuario.id);
                          }
                        }}
                        title="Ver detalhes do usuário"
                      >
                        <FaEye />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditarUsuario(usuario);
                        }}
                        title="Editar usuário"
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="btn-icon danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletarUsuario(usuario);
                        }}
                        title="Deletar usuário"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {usuarioSelecionado && usuarioDetalhes && (
            <div className="admin-usuario-detalhes">
              <h3>Dados de {usuarioDetalhes.usuario.username}</h3>
              {loading ? (
                <div className="loading">Carregando...</div>
              ) : (
                <div className="detalhes-content">
                  <div className="detalhes-section">
                    <div className="detalhes-section-header">
                      <h4>
                        <FaFolder /> Categorias ({usuarioDetalhes.categorias.length})
                      </h4>
                      <button
                        className="btn-icon btn-add"
                        onClick={() => setShowAdicionarCategoria(true)}
                        title="Adicionar categoria"
                      >
                        <FaPlus /> Adicionar Categoria
                      </button>
                    </div>
                    <div className="categorias-list">
                      {usuarioDetalhes.categorias.map(categoria => {
                        const icone = obterIconeCategoria(categoria);
                        const IconComponent = icone ? (FaIcons as any)[icone] : FaFolder;
                        return (
                          <div key={categoria} className="categoria-item">
                            <div className="categoria-header">
                              <button
                                className="categoria-toggle"
                                onClick={() => toggleCategoria(categoria)}
                              >
                                {categoriasExpandidas.has(categoria) ? <FaChevronDown /> : <FaChevronRight />}
                                {icone && IconComponent ? <IconComponent /> : <FaFolder />}
                                {categoria}
                              </button>
                              <div className="categoria-actions" onClick={(e) => e.stopPropagation()}>
                                <button
                                  className="btn-icon"
                                  onClick={() => handleEditarCategoria(categoria)}
                                  title="Editar categoria"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  className="btn-icon danger"
                                  onClick={() => handleDeletarCategoria(categoria)}
                                  title="Deletar categoria"
                                >
                                  <FaTrash />
                                </button>
                                <button
                                  className="btn-icon"
                                  onClick={() => handleAdicionarItem(categoria)}
                                  title="Adicionar item nesta categoria"
                                >
                                  <FaPlus />
                                </button>
                              </div>
                            </div>
                            {categoriasExpandidas.has(categoria) && usuarioDetalhes.itens[categoria] && (
                              <div className="itens-list">
                                {usuarioDetalhes.itens[categoria].map((item: any) => (
                                  <div key={item.id} className="item-row">
                                    <span>{item.nome}</span>
                                    <span>R$ {item.valor.toFixed(2)}</span>
                                    <div className="item-actions">
                                      <button
                                        className="btn-icon"
                                        onClick={() => handleEditarItem(item)}
                                        title="Editar item"
                                      >
                                        <FaEdit />
                                      </button>
                                      <button
                                        className="btn-icon danger"
                                        onClick={() => handleDeletarItem(item)}
                                        title="Deletar item"
                                      >
                                        <FaTrash />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                                {usuarioDetalhes.itens[categoria].length === 0 && (
                                  <div className="item-row empty">
                                    <span>Nenhum item nesta categoria</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {showEditarUsuario && usuarioEditando && (
        <EditarUsuarioModal
          isOpen={showEditarUsuario}
          onClose={() => {
            setShowEditarUsuario(false);
            setUsuarioEditando(null);
          }}
          usuario={usuarioEditando}
          onUsuarioAtualizado={() => {
            carregarUsuarios();
            if (usuarioSelecionado === usuarioEditando.id) {
              carregarDetalhesUsuario(usuarioEditando.id);
            }
          }}
        />
      )}

      {showEditarItem && itemEditando && (
        <AdminEditarItemModal
          isOpen={showEditarItem}
          item={itemEditando}
          categorias={usuarioDetalhes?.categorias || []}
          categoriaAtual={itemEditando?.categoria}
          usuarioId={usuarioSelecionado!}
          onClose={() => {
            setShowEditarItem(false);
            setItemEditando(null);
          }}
          onSave={async () => {
            await carregarDetalhesUsuario(usuarioSelecionado!);
          }}
        />
      )}

      {showAdicionarItem && (
        <AdminEditarItemModal
          isOpen={showAdicionarItem}
          item={null}
          categorias={usuarioDetalhes?.categorias || []}
          categoriaAtual={categoriaParaItem}
          usuarioId={usuarioSelecionado!}
          modoAdicionar={true}
          onClose={() => {
            setShowAdicionarItem(false);
            setCategoriaParaItem('');
          }}
          onSave={async () => {
            await carregarDetalhesUsuario(usuarioSelecionado!);
          }}
        />
      )}

      {showAdicionarCategoria && (
        <AdicionarCategoriaModal
          isOpen={showAdicionarCategoria}
          onClose={() => setShowAdicionarCategoria(false)}
          onSave={handleSalvarCategoria}
        />
      )}

      {showEditarCategoria && (
        <EditarCategoriaModal
          isOpen={showEditarCategoria}
          categoriaNome={categoriaEditando}
          onClose={() => {
            setShowEditarCategoria(false);
            setCategoriaEditando('');
          }}
          onSave={handleSalvarCategoria}
        />
      )}
    </>
  );
};

interface EditarUsuarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  usuario: Usuario;
  onUsuarioAtualizado: () => void;
}

const EditarUsuarioModal = ({ isOpen, onClose, usuario, onUsuarioAtualizado }: EditarUsuarioModalProps) => {
  const [username, setUsername] = useState(usuario.username);
  const [email, setEmail] = useState(usuario.email || '');
  const [senha, setSenha] = useState('');
  const [isAdmin, setIsAdmin] = useState(usuario.is_admin);
  const [loading, setLoading] = useState(false);
  const [showSenha, setShowSenha] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUsername(usuario.username);
      setEmail(usuario.email || '');
      setSenha('');
      setIsAdmin(usuario.is_admin);
    }
  }, [isOpen, usuario]);

  const handleSalvar = async () => {
    if (!username.trim()) {
      await mostrarAlert('Erro', 'O nome de usuário não pode estar vazio.');
      return;
    }

    if (username.trim().length < 3) {
      await mostrarAlert('Erro', 'O nome de usuário deve ter pelo menos 3 caracteres.');
      return;
    }

    // Validar que não tenha espaços ou acentos
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username.trim())) {
      await mostrarAlert('Erro', 'O nome de usuário não pode conter espaços ou acentos. Use apenas letras, números, underscore (_) ou hífen (-).');
      return;
    }

    if (!email.trim()) {
      await mostrarAlert('Erro', 'O email é obrigatório.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      await mostrarAlert('Erro', 'Por favor, insira um email válido.');
      return;
    }

    if (senha && senha.length < 6) {
      await mostrarAlert('Erro', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || window.location.origin;
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/admin/usuarios/${usuario.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim().toLowerCase(),
          senha: senha || undefined,
          is_admin: isAdmin,
        }),
      });

      if (response.ok) {
        await mostrarAlert('Sucesso', 'Usuário atualizado com sucesso!');
        onUsuarioAtualizado();
        onClose();
      } else {
        let errorMessage = 'Erro ao atualizar usuário';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Erro ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      await mostrarAlert('Erro', error.message || 'Erro ao atualizar usuário.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Usuário"
      size="small"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary" disabled={loading}>
            Cancelar
          </button>
          <button onClick={handleSalvar} className="btn-primary" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </>
      }
    >
      <div className="editar-usuario-form">
        <div className="form-group">
          <label htmlFor="username-edit">Nome de Usuário <span className="required">*</span>:</label>
          <input
            id="username-edit"
            type="text"
            className="form-input"
            value={username}
            onChange={(e) => {
              // Remover espaços e caracteres acentuados em tempo real
              const value = e.target.value.replace(/[\s\u00C0-\u017F]/g, '');
              // Permitir apenas letras, números, underscore e hífen
              const sanitized = value.replace(/[^a-zA-Z0-9_-]/g, '');
              setUsername(sanitized);
            }}
            disabled={loading}
            required
            pattern="[a-zA-Z0-9_-]+"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email-edit">Email <span className="required">*</span>:</label>
          <input
            id="email-edit"
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Digite o email"
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="senha-edit">Nova Senha (deixe em branco para não alterar):</label>
          <div className="password-input-wrapper">
            <input
              id="senha-edit"
              type={showSenha ? 'text' : 'password'}
              className="form-input"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite a nova senha"
              disabled={loading}
              minLength={6}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowSenha(!showSenha)}
              disabled={loading}
              tabIndex={-1}
            >
              {showSenha ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
              disabled={loading}
            />
            <span>Administrador</span>
          </label>
        </div>
      </div>
    </Modal>
  );
};

interface AdminEditarItemModalProps {
  isOpen: boolean;
  item: any | null;
  categorias: string[];
  categoriaAtual?: string;
  usuarioId: number;
  modoAdicionar?: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
}

const AdminEditarItemModal = ({
  isOpen,
  item,
  categorias,
  categoriaAtual,
  usuarioId,
  modoAdicionar = false,
  onClose,
  onSave,
}: AdminEditarItemModalProps) => {
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState('');
  const [categoria, setCategoria] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (modoAdicionar) {
        setNome('');
        setValor('');
        setCategoria(categoriaAtual || categorias[0] || '');
      } else if (item) {
        setNome(item.nome || '');
        setValor(item.valor?.toString() || '');
        setCategoria(item.categoria || categoriaAtual || categorias[0] || '');
      }
    }
  }, [isOpen, item, modoAdicionar, categoriaAtual, categorias]);

  const handleSalvar = async () => {
    if (!nome.trim()) {
      await mostrarAlert('Erro', 'O nome do item é obrigatório.');
      return;
    }

    if (!valor || parseFloat(valor) < 0) {
      await mostrarAlert('Erro', 'O valor do item é obrigatório e deve ser maior ou igual a zero.');
      return;
    }

    if (!categoria) {
      await mostrarAlert('Erro', 'Selecione uma categoria.');
      return;
    }

    setLoading(true);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || window.location.origin;
      const token = getToken();

      if (modoAdicionar) {
        const response = await fetch(`${API_BASE}/api/admin/usuarios/${usuarioId}/itens`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            nome: nome.trim(),
            valor: parseFloat(valor),
            categoria: categoria,
          }),
        });

        if (response.ok) {
          await mostrarAlert('Sucesso', 'Item criado com sucesso!');
          await onSave();
          onClose();
        } else {
          let errorMessage = 'Erro ao criar item';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            errorMessage = `Erro ${response.status}: ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }
      } else if (item) {
        const response = await fetch(`${API_BASE}/api/admin/usuarios/${usuarioId}/itens/${item.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            nome: nome.trim(),
            valor: parseFloat(valor),
            categoria: categoria,
          }),
        });

        if (response.ok) {
          await mostrarAlert('Sucesso', 'Item atualizado com sucesso!');
          await onSave();
          onClose();
        } else {
          let errorMessage = 'Erro ao atualizar item';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            errorMessage = `Erro ${response.status}: ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }
      }
    } catch (error: any) {
      console.error('Erro ao salvar item:', error);
      await mostrarAlert('Erro', error.message || 'Erro ao salvar item.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modoAdicionar ? 'Adicionar Item' : 'Editar Item'}
      size="small"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary" disabled={loading}>
            Cancelar
          </button>
          <button onClick={handleSalvar} className="btn-primary" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </>
      }
    >
      <div className="editar-item-form">
        <div className="form-group">
          <label htmlFor="item-nome">Nome do Item:</label>
          <input
            id="item-nome"
            type="text"
            className="form-input"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Digite o nome do item"
            autoFocus
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="item-valor">Valor (R$):</label>
          <input
            id="item-valor"
            type="number"
            step="0.01"
            min="0"
            className="form-input"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="0.00"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="item-categoria">Categoria:</label>
          <select
            id="item-categoria"
            className="form-input"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            disabled={loading}
          >
            <option value="">Selecione uma categoria</option>
            {categorias.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>
    </Modal>
  );
};

interface EditarCategoriaModalProps {
  isOpen: boolean;
  categoriaNome: string;
  onClose: () => void;
  onSave: (nome: string, icone: string | null) => Promise<void>;
}

const EditarCategoriaModal = ({ isOpen, categoriaNome, onClose, onSave }: EditarCategoriaModalProps) => {
  const [nome, setNome] = useState(categoriaNome);
  const [icone, setIcone] = useState<string | null>(null);
  const [showIconeModal, setShowIconeModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNome(categoriaNome);
      setIcone(null);
    }
  }, [isOpen, categoriaNome]);

  const handleSalvar = async () => {
    if (!nome.trim()) {
      await mostrarAlert('Erro', 'O nome da categoria não pode estar vazio.');
      return;
    }
    await onSave(nome.trim(), icone);
  };

  const renderIcone = () => {
    if (!icone) {
      return <FaFolder />;
    }
    const IconComponent = (FaIcons as any)[icone];
    if (!IconComponent) {
      return <FaFolder />;
    }
    return <IconComponent />;
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Editar Categoria"
        size="small"
        footer={
          <>
            <button onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button onClick={handleSalvar} className="btn-primary">
              Salvar
            </button>
          </>
        }
      >
        <div className="editar-categoria-form">
          <div className="form-group">
            <label htmlFor="categoria-nome-edit">Nome da Categoria:</label>
            <input
              id="categoria-nome-edit"
              type="text"
              className="form-input"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Digite o nome da categoria"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Ícone:</label>
            <div className="icone-selector">
              <button
                type="button"
                className="btn-icone-preview"
                onClick={() => setShowIconeModal(true)}
              >
                {renderIcone()}
                <span>Selecionar Ícone</span>
              </button>
              {icone && (
                <button
                  type="button"
                  className="btn-icone-remove"
                  onClick={() => setIcone(null)}
                >
                  <FaTimes /> Remover
                </button>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {showIconeModal && (
        <SelecionarIconeModal
          isOpen={showIconeModal}
          iconeAtual={icone || null}
          onClose={() => setShowIconeModal(false)}
          onSelect={(iconeSelecionado) => {
            setIcone(iconeSelecionado);
            setShowIconeModal(false);
          }}
        />
      )}
    </>
  );
};

export default AdminPanel;

