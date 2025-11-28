import { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Modal from './Modal';
import { mostrarAlert } from '../utils/modals';
import { getToken } from '../services/auth';
import './AlterarSenhaModal.css';

interface AlterarSenhaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AlterarSenhaModal = ({ isOpen, onClose }: AlterarSenhaModalProps) => {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!senhaAtual.trim()) {
      await mostrarAlert('Erro', 'Por favor, informe sua senha atual.');
      return;
    }

    if (!novaSenha.trim()) {
      await mostrarAlert('Erro', 'Por favor, informe a nova senha.');
      return;
    }

    if (novaSenha.length < 6) {
      await mostrarAlert('Erro', 'A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      await mostrarAlert('Erro', 'As senhas não coincidem.');
      return;
    }

    if (senhaAtual === novaSenha) {
      await mostrarAlert('Atenção', 'A nova senha deve ser diferente da senha atual.');
      return;
    }

    setLoading(true);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || window.location.origin;
      const token = getToken();

      const response = await fetch(`${API_BASE}/api/auth/alterar-senha`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          senhaAtual,
          novaSenha,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Erro ao alterar senha';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Erro ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      await response.json();

      await mostrarAlert('Sucesso', 'Senha alterada com sucesso!');
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      onClose();
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      await mostrarAlert('Erro', error.message || 'Erro ao alterar senha. Verifique sua senha atual e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Alterar Senha"
      size="small"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary" disabled={loading}>
            Cancelar
          </button>
          <button onClick={handleSubmit} className="btn-primary" disabled={loading}>
            {loading ? 'Alterando...' : 'Alterar Senha'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="alterar-senha-form">
        <div className="form-group">
          <label htmlFor="senha-atual">Senha Atual <span className="required">*</span>:</label>
          <div className="password-input-wrapper">
            <input
              id="senha-atual"
              type={showSenhaAtual ? 'text' : 'password'}
              className="form-input"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              placeholder="Digite sua senha atual"
              autoFocus
              disabled={loading}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowSenhaAtual(!showSenhaAtual)}
              disabled={loading}
              tabIndex={-1}
            >
              {showSenhaAtual ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="nova-senha">Nova Senha <span className="required">*</span>:</label>
          <div className="password-input-wrapper">
            <input
              id="nova-senha"
              type={showNovaSenha ? 'text' : 'password'}
              className="form-input"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="Digite a nova senha (mínimo 6 caracteres)"
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
          <label htmlFor="confirmar-senha">Confirmar Nova Senha <span className="required">*</span>:</label>
          <div className="password-input-wrapper">
            <input
              id="confirmar-senha"
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

export default AlterarSenhaModal;

