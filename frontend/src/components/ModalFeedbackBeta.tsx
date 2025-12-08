import { useState, useEffect } from 'react';
import { FaStar } from 'react-icons/fa';
import { apiService } from '../services/api';
import { mostrarAlert } from '../utils/modals';
import Modal from './Modal';
import './ModalFeedbackBeta.css';

interface ModalFeedbackBetaProps {
  isOpen: boolean;
  onClose: () => void;
  funcaoId?: number | null;
  funcaoTitulo?: string;
}

const ModalFeedbackBeta = ({ isOpen, onClose, funcaoId, funcaoTitulo }: ModalFeedbackBetaProps) => {
  const [avaliacao, setAvaliacao] = useState<number>(0);
  const [comentario, setComentario] = useState<string>('');
  const [sugestoes, setSugestoes] = useState<string>('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Resetar formulário quando fechar
      setAvaliacao(0);
      setComentario('');
      setSugestoes('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (avaliacao === 0) {
      await mostrarAlert('Atenção', 'Por favor, selecione uma avaliação.');
      return;
    }

    setEnviando(true);
    try {
      await apiService.criarFeedbackBeta({
        funcao_id: funcaoId || null,
        funcao_titulo: funcaoTitulo || null,
        avaliacao,
        comentario: comentario.trim() || null,
        sugestoes: sugestoes.trim() || null
      });
      
      await mostrarAlert('Sucesso', 'Feedback enviado com sucesso! Obrigado pela sua contribuição.');
      onClose();
      
      // Disparar evento para atualizar estado no App
      window.dispatchEvent(new CustomEvent('feedback-enviado'));
    } catch (error: any) {
      console.error('Erro ao enviar feedback:', error);
      await mostrarAlert('Erro', error.response?.data?.error || 'Erro ao enviar feedback. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={funcaoTitulo ? `Feedback: ${funcaoTitulo}` : 'Feedback sobre Funções Beta'}
      size="medium"
    >
      <form onSubmit={handleSubmit} className="feedback-beta-form">
        <div className="feedback-section">
          <label className="feedback-label">
            Como você avalia esta função? <span className="required">*</span>
          </label>
          <div className="stars-container">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`star-button ${avaliacao >= star ? 'active' : ''}`}
                onClick={() => setAvaliacao(star)}
                onMouseEnter={(e) => {
                  if (!enviando) {
                    const stars = e.currentTarget.parentElement?.children;
                    if (stars) {
                      Array.from(stars).forEach((s, i) => {
                        if (i < star) {
                          s.classList.add('hover');
                        } else {
                          s.classList.remove('hover');
                        }
                      });
                    }
                  }
                }}
                onMouseLeave={(e) => {
                  const stars = e.currentTarget.parentElement?.children;
                  if (stars) {
                    Array.from(stars).forEach((s) => s.classList.remove('hover'));
                  }
                }}
              >
                <FaStar />
              </button>
            ))}
          </div>
          {avaliacao > 0 && (
            <p className="avaliacao-texto">
              {avaliacao === 1 && 'Muito Ruim'}
              {avaliacao === 2 && 'Ruim'}
              {avaliacao === 3 && 'Regular'}
              {avaliacao === 4 && 'Bom'}
              {avaliacao === 5 && 'Excelente'}
            </p>
          )}
        </div>

        <div className="feedback-section">
          <label className="feedback-label" htmlFor="comentario">
            Comentários (opcional)
          </label>
          <textarea
            id="comentario"
            className="feedback-textarea"
            rows={4}
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Conte-nos sua experiência com esta função..."
            disabled={enviando}
          />
        </div>

        <div className="feedback-section">
          <label className="feedback-label" htmlFor="sugestoes">
            Sugestões de melhoria (opcional)
          </label>
          <textarea
            id="sugestoes"
            className="feedback-textarea"
            rows={4}
            value={sugestoes}
            onChange={(e) => setSugestoes(e.target.value)}
            placeholder="O que você gostaria de ver melhorado?"
            disabled={enviando}
          />
        </div>

        <div className="feedback-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={enviando}
          >
            Fechar
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={enviando || avaliacao === 0}
          >
            {enviando ? 'Enviando...' : 'Enviar Feedback'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ModalFeedbackBeta;

