import { useState, useEffect } from 'react';
import Modal from './Modal';
import { apiService } from '../services/api';
import { mostrarAlert } from '../utils/modals';
import { FaEnvelope, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import './ValidarEmailModal.css';

interface ValidarEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onValidado?: () => void;
}

const ValidarEmailModal = ({ isOpen, onClose, onValidado }: ValidarEmailModalProps) => {
  const [reenviando, setReenviando] = useState(false);

  const handleReenviar = async () => {
    try {
      setReenviando(true);
      await apiService.reenviarEmailValidacao();
      await mostrarAlert('Sucesso', 'Email de validação reenviado! Verifique sua caixa de entrada.');
    } catch (error: any) {
      console.error('Erro ao reenviar email:', error);
      await mostrarAlert('Erro', error.response?.data?.error || 'Erro ao reenviar email de validação.');
    } finally {
      setReenviando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Validação de Email Necessária"
      size="medium"
      footer={
        <>
          <button onClick={handleReenviar} className="btn-secondary" disabled={reenviando}>
            <FaEnvelope /> {reenviando ? 'Reenviando...' : 'Reenviar Email'}
          </button>
          <button onClick={onClose} className="btn-primary">
            Entendi
          </button>
        </>
      }
    >
      <div className="validar-email-container">
        <div className="validar-email-icon">
          <FaExclamationTriangle />
        </div>
        <h3>Email não validado</h3>
        <p>
          Para continuar usando o sistema após adquirir um plano, você precisa validar seu email.
        </p>
        <p>
          Um email de validação foi enviado para você quando criou sua conta. Verifique sua caixa de entrada (e a pasta de spam).
        </p>
        <div className="validar-email-info">
          <p><strong>O que fazer:</strong></p>
          <ol>
            <li>Verifique sua caixa de entrada</li>
            <li>Clique no link de validação no email</li>
            <li>Se não recebeu o email, clique em "Reenviar Email" abaixo</li>
          </ol>
        </div>
        <p className="validar-email-note">
          <strong>Nota:</strong> O link de validação expira em 7 dias.
        </p>
      </div>
    </Modal>
  );
};

export default ValidarEmailModal;

