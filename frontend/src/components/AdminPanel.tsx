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
import { FaUser, FaEdit, FaTrash, FaShieldAlt, FaChevronRight, FaChevronDown, FaFolder, FaEye, FaEyeSlash, FaPlus, FaTimes, FaCog, FaBars, FaCreditCard, FaQuestionCircle, FaLink } from 'react-icons/fa';
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

const AdminPanel = ({ isOpen, onClose, onCarregarUsuarioNoSistema }: AdminPanelProps) => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<number | null>(null);
  const [usuarioDetalhes, setUsuarioDetalhes] = useState<UsuarioDetalhes | null>(null);
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    if (isOpen) {
      carregarUsuarios();
    }
  }, [isOpen]);

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

  if (!isOpen) return null;

  return (
    <>
      <GerenciamentoFuncoes
        isOpen={showGerenciamentoFuncoes}
        onClose={handleCloseGerenciamentoFuncoes}
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
              <div>
                <h4 style={{ marginBottom: '8px', fontSize: '16px', fontWeight: '500' }}>
                  <FaCog /> Gerenciar Funções da Landing Page
                </h4>
                <div style={{ borderBottom: '1px solid #e9ecef', marginBottom: '12px' }}></div>
                <p style={{ marginBottom: '12px', color: '#666', fontSize: '14px' }}>
                  Gerencie as funções exibidas na landing page. Configure quais funções estão ativas e quais são de IA.
                </p>
                <button 
                  onClick={() => setShowGerenciamentoFuncoes(true)}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'flex-start', textAlign: 'left' }}
                >
                  <FaCog /> Gerenciar Funções
                </button>
              </div>
              <div>
                <h4 style={{ marginBottom: '8px', fontSize: '16px', fontWeight: '500' }}>
                  <FaBars /> Gerenciar Menu
                </h4>
                <div style={{ borderBottom: '1px solid #e9ecef', marginBottom: '12px' }}></div>
                <p style={{ marginBottom: '12px', color: '#666', fontSize: '14px' }}>
                  Escolha quais seções da landing page aparecem no menu de navegação do header.
                </p>
              <button 
                onClick={() => setShowGerenciamentoMenu(true)}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'flex-start', textAlign: 'left' }}
              >
                <FaBars /> Gerenciar Menu
              </button>
              </div>
              <div>
                <h4 style={{ marginBottom: '8px', fontSize: '16px', fontWeight: '500' }}>
                  <FaCreditCard /> Gerenciar Planos
                </h4>
                <div style={{ borderBottom: '1px solid #e9ecef', marginBottom: '12px' }}></div>
                <p style={{ marginBottom: '12px', color: '#666', fontSize: '14px' }}>
                  Gerencie os planos de pagamento: valores, benefícios, descontos, tipo de pagamento e outras configurações.
                </p>
                <button 
                  onClick={() => setShowGerenciamentoPlanos(true)}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'flex-start', textAlign: 'left' }}
                >
                  <FaCreditCard /> Gerenciar Planos
                </button>
              </div>
              <div>
                <h4 style={{ marginBottom: '8px', fontSize: '16px', fontWeight: '500' }}>
                  <FaQuestionCircle /> Gerenciar FAQ
                </h4>
                <div style={{ borderBottom: '1px solid #e9ecef', marginBottom: '12px' }}></div>
                <p style={{ marginBottom: '12px', color: '#666', fontSize: '14px' }}>
                  Gerencie as perguntas frequentes (FAQ) exibidas na landing page.
                </p>
                <button
                  onClick={() => setShowGerenciamentoFAQ(true)}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'flex-start', textAlign: 'left' }}
                >
                  <FaQuestionCircle /> Gerenciar FAQ
                </button>
                
                <div style={{ marginTop: '20px', marginBottom: '30px' }}>
                  <h4 style={{ marginBottom: '8px', fontSize: '16px', fontWeight: '500' }}>
                    <FaLink /> Gerenciar Rodapé
                  </h4>
                  <div style={{ borderBottom: '1px solid #e9ecef', marginBottom: '12px' }}></div>
                  <p style={{ marginBottom: '12px', color: '#666', fontSize: '14px' }}>
                    Gerencie as colunas e links do rodapé da landing page.
                  </p>
                  <button
                    onClick={() => setShowGerenciamentoRodape(true)}
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'flex-start', textAlign: 'left' }}
                  >
                    <FaLink /> Gerenciar Rodapé
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-usuarios-list">
            <h3>Usuários do Sistema</h3>
            <div className="usuarios-list">
              {usuarios.map(usuario => (
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
                        onClick={() => handleEditarUsuario(usuario)}
                        title="Editar usuário"
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="btn-icon danger"
                        onClick={() => handleDeletarUsuario(usuario)}
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
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            required
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

