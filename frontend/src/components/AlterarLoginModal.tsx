import { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Modal from './Modal';
import { mostrarAlert } from '../utils/modals';
import { getUser, saveAuth, getToken } from '../services/auth';
import './AlterarLoginModal.css';

interface AlterarLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AlterarLoginModal = ({ isOpen, onClose }: AlterarLoginModalProps) => {
  const [novoLogin, setNovoLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const user = getUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!novoLogin.trim()) {
      await mostrarAlert('Erro', 'O novo login não pode estar vazio.');
      return;
    }

    if (novoLogin.trim() === user?.username) {
      await mostrarAlert('Atenção', 'O novo login deve ser diferente do atual.');
      return;
    }

    if (!senha.trim()) {
      await mostrarAlert('Erro', 'Por favor, informe sua senha atual para confirmar a alteração.');
      return;
    }

    setLoading(true);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || window.location.origin;
      const token = getToken();

      const response = await fetch(`${API_BASE}/api/auth/alterar-login`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          novoLogin: novoLogin.trim(),
          senha,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Erro ao alterar login';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Erro ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Atualizar token e usuário no localStorage
      if (data.token && data.user) {
        saveAuth(data.token, data.user);
      }

      await mostrarAlert('Sucesso', 'Login alterado com sucesso!');
      setNovoLogin('');
      setSenha('');
      onClose();
      // Recarregar a página para atualizar o header
      window.location.reload();
    } catch (error: any) {
      console.error('Erro ao alterar login:', error);
      await mostrarAlert('Erro', error.message || 'Erro ao alterar login. Verifique sua senha e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Alterar Login"
      size="small"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary" disabled={loading}>
            Cancelar
          </button>
          <button onClick={handleSubmit} className="btn-primary" disabled={loading}>
            {loading ? 'Alterando...' : 'Alterar Login'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="alterar-login-form">
        <div className="form-group">
          <label htmlFor="login-atual">Login Atual:</label>
          <input
            id="login-atual"
            type="text"
            className="form-input"
            value={user?.username || ''}
            disabled
          />
        </div>

        <div className="form-group">
          <label htmlFor="novo-login">Novo Login <span className="required">*</span>:</label>
          <input
            id="novo-login"
            type="text"
            className="form-input"
            value={novoLogin}
            onChange={(e) => setNovoLogin(e.target.value)}
            placeholder="Digite o novo login"
            autoFocus
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="senha-confirmacao">Senha Atual (confirmação) <span className="required">*</span>:</label>
          <div className="password-input-wrapper">
            <input
              id="senha-confirmacao"
              type={showSenha ? 'text' : 'password'}
              className="form-input"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite sua senha atual"
              disabled={loading}
              required
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
          <small className="form-help">
            É necessário informar sua senha atual para confirmar a alteração
          </small>
        </div>
      </form>
    </Modal>
  );
};

export default AlterarLoginModal;

