import { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Modal from './Modal';
import { mostrarAlert } from '../utils/modals';
import './ResetarSenhaModal.css';

interface ResetarSenhaModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  onSuccess: () => void;
}

const ResetarSenhaModal = ({ isOpen, onClose, token, onSuccess }: ResetarSenhaModalProps) => {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (isOpen && token) {
      validarToken();
    }
  }, [isOpen, token]);

  const validarToken = async () => {
    setValidating(true);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || window.location.origin;
      const response = await fetch(`${API_BASE}/api/auth/validar-token/${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Token inválido ou expirado');
      }

      setUsername(data.username);
      setValidating(false);
    } catch (error: any) {
      console.error('Erro ao validar token:', error);
      await mostrarAlert('Erro', error.message || 'Token inválido ou expirado. Solicite um novo link de recuperação.');
      onClose();
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!novaSenha.trim() || !confirmarSenha.trim()) {
      await mostrarAlert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    if (novaSenha.length < 6) {
      await mostrarAlert('Erro', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      await mostrarAlert('Erro', 'As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || window.location.origin;
      const response = await fetch(`${API_BASE}/api/auth/resetar-senha`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          novaSenha,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao resetar senha');
      }

      await mostrarAlert('Sucesso', 'Senha redefinida com sucesso! Você já pode fazer login com sua nova senha.');
      setNovaSenha('');
      setConfirmarSenha('');
      onClose();
      onSuccess();
    } catch (error: any) {
      console.error('Erro ao resetar senha:', error);
      await mostrarAlert('Erro', error.message || 'Erro ao resetar senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Validando Token"
        size="small"
      >
        <div className="validating-message">
          <p>Validando token de recuperação...</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Redefinir Senha"
      size="small"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary" disabled={loading}>
            Cancelar
          </button>
          <button onClick={handleSubmit} className="btn-primary" disabled={loading}>
            {loading ? 'Redefinindo...' : 'Redefinir Senha'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="resetar-senha-form">
        <div className="form-group">
          <p className="form-description">
            Olá, <strong>{username}</strong>! Digite sua nova senha abaixo.
          </p>
        </div>
        <div className="form-group">
          <label htmlFor="nova-senha-reset">Nova Senha <span className="required">*</span>:</label>
          <div className="password-input-wrapper">
            <input
              id="nova-senha-reset"
              type={showNovaSenha ? 'text' : 'password'}
              className="form-input"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="Digite a nova senha (mínimo 6 caracteres)"
              autoFocus
              disabled={loading}
              required
              minLength={6}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowNovaSenha(!showNovaSenha)}
              disabled={loading}
              tabIndex={-1}
            >
              {showNovaSenha ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="confirmar-senha-reset">Confirmar Nova Senha <span className="required">*</span>:</label>
          <div className="password-input-wrapper">
            <input
              id="confirmar-senha-reset"
              type={showConfirmarSenha ? 'text' : 'password'}
              className="form-input"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              placeholder="Digite a nova senha novamente"
              disabled={loading}
              required
              minLength={6}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmarSenha(!showConfirmarSenha)}
              disabled={loading}
              tabIndex={-1}
            >
              {showConfirmarSenha ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default ResetarSenhaModal;

