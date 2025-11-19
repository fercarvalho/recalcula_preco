import { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Modal from './Modal';
import { mostrarAlert } from '../utils/modals';
import { getUser, saveAuth, getToken } from '../services/auth';
import './AlterarEmailModal.css';

interface AlterarEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AlterarEmailModal = ({ isOpen, onClose }: AlterarEmailModalProps) => {
  const [novoEmail, setNovoEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const user = getUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!novoEmail.trim()) {
      await mostrarAlert('Erro', 'O novo email não pode estar vazio.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(novoEmail.trim())) {
      await mostrarAlert('Erro', 'Por favor, insira um email válido.');
      return;
    }

    if (novoEmail.trim().toLowerCase() === user?.email?.toLowerCase()) {
      await mostrarAlert('Atenção', 'O novo email deve ser diferente do atual.');
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

      const response = await fetch(`${API_BASE}/api/auth/alterar-email`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          novoEmail: novoEmail.trim().toLowerCase(),
          senha,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao alterar email');
      }

      // Atualizar usuário no localStorage
      if (data.user && user) {
        const updatedUser = { ...user, email: data.user.email };
        saveAuth(token || '', updatedUser);
      }

      await mostrarAlert('Sucesso', 'Email alterado com sucesso!');
      setNovoEmail('');
      setSenha('');
      onClose();
      // Recarregar a página para atualizar o header
      window.location.reload();
    } catch (error: any) {
      console.error('Erro ao alterar email:', error);
      await mostrarAlert('Erro', error.message || 'Erro ao alterar email. Verifique sua senha e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Alterar Email"
      size="small"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary" disabled={loading}>
            Cancelar
          </button>
          <button onClick={handleSubmit} className="btn-primary" disabled={loading}>
            {loading ? 'Alterando...' : 'Alterar Email'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="alterar-email-form">
        <div className="form-group">
          <label htmlFor="email-atual">Email Atual:</label>
          <input
            id="email-atual"
            type="email"
            className="form-input"
            value={user?.email || ''}
            disabled
          />
        </div>

        <div className="form-group">
          <label htmlFor="novo-email">Novo Email <span className="required">*</span>:</label>
          <input
            id="novo-email"
            type="email"
            className="form-input"
            value={novoEmail}
            onChange={(e) => setNovoEmail(e.target.value)}
            placeholder="Digite o novo email"
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

export default AlterarEmailModal;

