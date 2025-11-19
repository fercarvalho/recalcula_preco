import { useState, useEffect } from 'react';
import Modal from './Modal';
import { mostrarAlert, mostrarConfirm } from '../utils/modals';
import { getToken } from '../services/auth';
import { FaUser, FaEdit, FaTrash, FaShieldAlt, FaChevronRight, FaChevronDown, FaFolder, FaEye, FaEyeSlash } from 'react-icons/fa';
import './AdminPanel.css';

interface Usuario {
  id: number;
  username: string;
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
}

const AdminPanel = ({ isOpen, onClose }: AdminPanelProps) => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<number | null>(null);
  const [usuarioDetalhes, setUsuarioDetalhes] = useState<UsuarioDetalhes | null>(null);
  const [loading, setLoading] = useState(false);
  const [showEditarUsuario, setShowEditarUsuario] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [categoriasExpandidas, setCategoriasExpandidas] = useState<Set<string>>(new Set());

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

  const handleSelecionarUsuario = (usuarioId: number) => {
    if (usuarioSelecionado === usuarioId) {
      setUsuarioSelecionado(null);
      setUsuarioDetalhes(null);
    } else {
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
        const data = await response.json();
        throw new Error(data.error || 'Erro ao deletar usuário');
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

  if (!isOpen) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Painel de Administração"
        size="large"
      >
        <div className="admin-panel">
          <div className="admin-usuarios-list">
            <h3>Usuários do Sistema</h3>
            <div className="usuarios-list">
              {usuarios.map(usuario => (
                <div
                  key={usuario.id}
                  className={`usuario-item ${usuarioSelecionado === usuario.id ? 'selected' : ''}`}
                  onClick={() => handleSelecionarUsuario(usuario.id)}
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
                      {usuarioSelecionado === usuario.id ? <FaChevronDown /> : <FaChevronRight />}
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
                    <h4>
                      <FaFolder /> Categorias ({usuarioDetalhes.categorias.length})
                    </h4>
                    <div className="categorias-list">
                      {usuarioDetalhes.categorias.map(categoria => (
                        <div key={categoria} className="categoria-item">
                          <button
                            className="categoria-toggle"
                            onClick={() => toggleCategoria(categoria)}
                          >
                            {categoriasExpandidas.has(categoria) ? <FaChevronDown /> : <FaChevronRight />}
                            {categoria}
                          </button>
                          {categoriasExpandidas.has(categoria) && usuarioDetalhes.itens[categoria] && (
                            <div className="itens-list">
                              {usuarioDetalhes.itens[categoria].map((item: any) => (
                                <div key={item.id} className="item-row">
                                  <span>{item.nome}</span>
                                  <span>R$ {item.valor.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
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
  const [senha, setSenha] = useState('');
  const [isAdmin, setIsAdmin] = useState(usuario.is_admin);
  const [loading, setLoading] = useState(false);
  const [showSenha, setShowSenha] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUsername(usuario.username);
      setSenha('');
      setIsAdmin(usuario.is_admin);
    }
  }, [isOpen, usuario]);

  const handleSalvar = async () => {
    if (!username.trim()) {
      await mostrarAlert('Erro', 'O nome de usuário não pode estar vazio.');
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
          senha: senha || undefined,
          is_admin: isAdmin,
        }),
      });

      if (response.ok) {
        await mostrarAlert('Sucesso', 'Usuário atualizado com sucesso!');
        onUsuarioAtualizado();
        onClose();
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao atualizar usuário');
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
          <label htmlFor="username-edit">Nome de Usuário:</label>
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

export default AdminPanel;

