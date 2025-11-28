import { useState } from 'react';
import Modal from './Modal';
import { mostrarAlert } from '../utils/modals';
import './EsqueciSenhaModal.css';

interface EsqueciSenhaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EsqueciSenhaModal = ({ isOpen, onClose }: EsqueciSenhaModalProps) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      await mostrarAlert('Erro', 'Por favor, informe seu email.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      await mostrarAlert('Erro', 'Por favor, insira um email válido.');
      return;
    }

    setLoading(true);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || window.location.origin;
      const response = await fetch(`${API_BASE}/api/auth/recuperar-senha`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (!response.ok) {
        let errorMessage = 'Erro ao solicitar recuperação de senha';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Erro ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      await response.json();

      await mostrarAlert(
        'Sucesso',
        'Se o email estiver cadastrado, você receberá um link de recuperação de senha em breve. Verifique sua caixa de entrada e spam.'
      );
      setEmail('');
      onClose();
    } catch (error: any) {
      console.error('Erro ao solicitar recuperação:', error);
      await mostrarAlert('Erro', error.message || 'Erro ao solicitar recuperação de senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Recuperar Senha"
      size="small"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary" disabled={loading}>
            Cancelar
          </button>
          <button onClick={handleSubmit} className="btn-primary" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar Link'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="esqueci-senha-form">
        <div className="form-group">
          <p className="form-description">
            Digite seu email cadastrado. Se o email estiver cadastrado, você receberá um link para redefinir sua senha.
          </p>
        </div>
        <div className="form-group">
          <label htmlFor="email-recuperacao">Email:</label>
          <input
            id="email-recuperacao"
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Digite seu email"
            autoFocus
            disabled={loading}
            required
          />
        </div>
      </form>
    </Modal>
  );
};

export default EsqueciSenhaModal;

