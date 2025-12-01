import { useState } from 'react';
import Modal from './Modal';
import { mostrarAlert } from '../utils/modals';
import './EsqueciSenhaModal.css';

interface EsqueciSenhaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EsqueciSenhaModal = ({ isOpen, onClose }: EsqueciSenhaModalProps) => {
  const [emailOuUsername, setEmailOuUsername] = useState('');
  const [username, setUsername] = useState('');
  const [mostrarUsername, setMostrarUsername] = useState(false);
  const [usuariosDisponiveis, setUsuariosDisponiveis] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailOuUsername.trim() && !username.trim()) {
      await mostrarAlert('Erro', 'Por favor, informe seu email ou nome de usuário.');
      return;
    }

    // Se mostrarUsername estiver ativo, username é obrigatório
    if (mostrarUsername && !username.trim()) {
      await mostrarAlert('Erro', 'Por favor, informe o nome de usuário.');
      return;
    }

    setLoading(true);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || window.location.origin;
      
      // Preparar dados para enviar
      const body: { email?: string; username?: string } = {};
      
      // Se mostrarUsername está ativo, enviar ambos (email + username)
      if (mostrarUsername && username.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(emailOuUsername.trim())) {
          body.email = emailOuUsername.trim().toLowerCase();
        }
        body.username = username.trim();
      }
      // Se não, verificar se é email ou username
      else if (emailOuUsername.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(emailOuUsername.trim())) {
          body.email = emailOuUsername.trim().toLowerCase();
        } else {
          body.username = emailOuUsername.trim();
        }
      }

      const response = await fetch(`${API_BASE}/api/auth/recuperar-senha`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        // Se for erro de múltiplos usuários, mostrar campo de username
        if (data.error === 'MULTIPLE_USERS') {
          setMostrarUsername(true);
          setUsuariosDisponiveis(data.usuarios || []);
          await mostrarAlert(
            'Atenção',
            data.message || 'Este email está associado a múltiplas contas. Por favor, informe também o nome de usuário.'
          );
          setLoading(false);
          return;
        }
        
        throw new Error(data.error || data.message || 'Erro ao solicitar recuperação de senha');
      }

      await mostrarAlert(
        'Sucesso',
        'Se o email/nome de usuário estiver cadastrado, você receberá um link de recuperação de senha em breve. Verifique sua caixa de entrada e spam.'
      );
      setEmailOuUsername('');
      setUsername('');
      setMostrarUsername(false);
      setUsuariosDisponiveis([]);
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
            Digite seu email ou nome de usuário cadastrado. Se estiver cadastrado, você receberá um link para redefinir sua senha.
          </p>
        </div>
        <div className="form-group">
          <label htmlFor="email-username-recuperacao">
            {mostrarUsername ? 'Email (já preenchido):' : 'Email ou Nome de Usuário:'}
          </label>
          <input
            id="email-username-recuperacao"
            type="text"
            className="form-input"
            value={emailOuUsername}
            onChange={(e) => setEmailOuUsername(e.target.value)}
            placeholder={mostrarUsername ? emailOuUsername : "Digite seu email ou nome de usuário"}
            autoFocus={!mostrarUsername}
            disabled={loading || mostrarUsername}
            required={!mostrarUsername}
          />
        </div>
        {mostrarUsername && (
          <div className="form-group">
            <label htmlFor="username-recuperacao">Nome de Usuário:</label>
            <input
              id="username-recuperacao"
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Digite o nome de usuário"
              autoFocus
              disabled={loading}
              required
            />
            {usuariosDisponiveis.length > 0 && (
              <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                Contas encontradas: {usuariosDisponiveis.join(', ')}
              </p>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
};

export default EsqueciSenhaModal;

