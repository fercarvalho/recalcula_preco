import { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Modal from './Modal';
import { mostrarAlert } from '../utils/modals';
import { saveAuth } from '../services/auth';
import './RegistroModal.css';

interface RegistroModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterSuccess: () => void;
}

const RegistroModal = ({ isOpen, onClose, onRegisterSuccess }: RegistroModalProps) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !email.trim() || !senha.trim() || !confirmarSenha.trim()) {
      await mostrarAlert('Erro', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (username.trim().length < 3) {
      await mostrarAlert('Erro', 'O nome de usuário deve ter pelo menos 3 caracteres.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      await mostrarAlert('Erro', 'Por favor, insira um email válido.');
      return;
    }

    if (senha.length < 6) {
      await mostrarAlert('Erro', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (senha !== confirmarSenha) {
      await mostrarAlert('Erro', 'As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || window.location.origin;
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username.trim(), email: email.trim().toLowerCase(), senha }),
      });

      if (!response.ok) {
        let errorMessage = 'Erro ao criar usuário';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Erro ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      saveAuth(data.token, data.user);
      await mostrarAlert('Sucesso', `Usuário "${data.user.username}" criado com sucesso!`);
      setUsername('');
      setEmail('');
      setSenha('');
      setConfirmarSenha('');
      onClose();
      onRegisterSuccess();
    } catch (error: any) {
      console.error('Erro no registro:', error);
      await mostrarAlert('Erro', error.message || 'Erro ao criar usuário. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Criar Nova Conta"
      size="small"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary" disabled={loading}>
            Cancelar
          </button>
          <button onClick={handleSubmit} className="btn-primary" disabled={loading}>
            {loading ? 'Criando...' : 'Criar Conta'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="registro-form">
        <div className="form-group">
          <label htmlFor="username-registro">Nome de Usuário <span className="required">*</span>:</label>
          <input
            id="username-registro"
            type="text"
            className="form-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Digite o nome de usuário (mínimo 3 caracteres)"
            autoFocus
            disabled={loading}
            required
            minLength={3}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email-registro">Email <span className="required">*</span>:</label>
          <input
            id="email-registro"
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Digite seu email"
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="senha-registro">Senha <span className="required">*</span>:</label>
          <div className="password-input-wrapper">
            <input
              id="senha-registro"
              type={showSenha ? 'text' : 'password'}
              className="form-input"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite a senha (mínimo 6 caracteres)"
              disabled={loading}
              required
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
          <label htmlFor="confirmar-senha-registro">Confirmar Senha <span className="required">*</span>:</label>
          <div className="password-input-wrapper">
            <input
              id="confirmar-senha-registro"
              type={showConfirmarSenha ? 'text' : 'password'}
              className="form-input"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              placeholder="Digite a senha novamente"
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

export default RegistroModal;

