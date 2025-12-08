import { useState, useEffect } from 'react';
import { FaStar, FaUser, FaCalendar, FaComment } from 'react-icons/fa';
import { apiService } from '../services/api';
import { mostrarAlert } from '../utils/modals';
import Modal from './Modal';
import './GerenciamentoFeedbacksBeta.css';

interface FeedbackBeta {
  id: number;
  usuario_id: number;
  usuario: {
    id: number;
    username: string;
    email: string | null;
  };
  funcao_id: number | null;
  funcao: {
    id: number;
    titulo: string;
  } | null;
  avaliacao: number;
  comentario: string | null;
  sugestoes: string | null;
  created_at: string;
}

interface GerenciamentoFeedbacksBetaProps {
  isOpen: boolean;
  onClose: () => void;
}

const GerenciamentoFeedbacksBeta = ({ isOpen, onClose }: GerenciamentoFeedbacksBetaProps) => {
  const [feedbacks, setFeedbacks] = useState<FeedbackBeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtroFuncao, setFiltroFuncao] = useState<string>('todas');
  const [filtroAvaliacao, setFiltroAvaliacao] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      carregarFeedbacks();
    }
  }, [isOpen]);

  const carregarFeedbacks = async () => {
    try {
      setLoading(true);
      const dados = await apiService.obterFeedbacksBeta();
      setFeedbacks(dados);
    } catch (error: any) {
      console.error('Erro ao carregar feedbacks:', error);
      await mostrarAlert('Erro', error?.response?.data?.error || 'Erro ao carregar feedbacks. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (data: string): string => {
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const obterTextoAvaliacao = (avaliacao: number): string => {
    switch (avaliacao) {
      case 1: return 'Muito Ruim';
      case 2: return 'Ruim';
      case 3: return 'Regular';
      case 4: return 'Bom';
      case 5: return 'Excelente';
      default: return '';
    }
  };

  const feedbacksFiltrados = feedbacks.filter(fb => {
    if (filtroFuncao !== 'todas') {
      // Se o filtro for uma função hardcoded, verificar se o feedback tem essa função
      if (filtroFuncao === 'Feedback Geral' || filtroFuncao === 'Modo Cardápio' || filtroFuncao === 'Modo Compartilhar Cardápio') {
        if (!fb.funcao || fb.funcao.titulo !== filtroFuncao) {
          return false;
        }
      } else {
        // Para funções da tabela funcoes
        if (!fb.funcao || fb.funcao.titulo !== filtroFuncao) {
          return false;
        }
      }
    }
    if (filtroAvaliacao !== null && fb.avaliacao !== filtroAvaliacao) {
      return false;
    }
    return true;
  });

  // Funções hardcoded que sempre devem aparecer no filtro
  const funcoesHardcoded = ['Modo Cardápio', 'Modo Compartilhar Cardápio', 'Feedback Geral'];
  
  // Funções que vêm dos feedbacks (da tabela funcoes)
  const funcoesDosFeedbacks = Array.from(new Set(feedbacks.map(fb => fb.funcao?.titulo).filter(Boolean)));
  
  // Combinar ambas as listas, removendo duplicatas
  const todasFuncoes = Array.from(new Set([...funcoesHardcoded, ...funcoesDosFeedbacks]));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gerenciar Feedbacks Beta"
      size="large"
      className="modal-nested"
    >
      <div className="gerenciamento-feedbacks-beta">
        {loading ? (
          <div className="loading-feedbacks">
            <p>Carregando feedbacks...</p>
          </div>
        ) : (
          <>
            <div className="filtros-feedbacks">
              <div className="filtro-group">
                <label>Filtrar por função:</label>
                <select
                  value={filtroFuncao}
                  onChange={(e) => setFiltroFuncao(e.target.value)}
                  className="filtro-select"
                >
                  <option value="todas">Todas as funções</option>
                  {todasFuncoes.map(funcao => (
                    <option key={funcao} value={funcao}>{funcao}</option>
                  ))}
                </select>
              </div>
              <div className="filtro-group">
                <label>Filtrar por avaliação:</label>
                <select
                  value={filtroAvaliacao === null ? 'todas' : filtroAvaliacao}
                  onChange={(e) => setFiltroAvaliacao(e.target.value === 'todas' ? null : parseInt(e.target.value))}
                  className="filtro-select"
                >
                  <option value="todas">Todas</option>
                  <option value="5">5 - Excelente</option>
                  <option value="4">4 - Bom</option>
                  <option value="3">3 - Regular</option>
                  <option value="2">2 - Ruim</option>
                  <option value="1">1 - Muito Ruim</option>
                </select>
              </div>
            </div>

            <div className="feedbacks-stats">
              <p>Total de feedbacks: <strong>{feedbacksFiltrados.length}</strong></p>
            </div>

            {feedbacksFiltrados.length === 0 ? (
              <div className="sem-feedbacks">
                <p>Nenhum feedback encontrado.</p>
              </div>
            ) : (
              <div className="feedbacks-list">
                {feedbacksFiltrados.map((feedback) => (
                  <div key={feedback.id} className="feedback-card">
                    <div className="feedback-header">
                      <div className="feedback-usuario">
                        <FaUser />
                        <div>
                          <strong>{feedback.usuario.username}</strong>
                          {feedback.usuario.email && (
                            <span className="feedback-email">{feedback.usuario.email}</span>
                          )}
                        </div>
                      </div>
                      <div className="feedback-data">
                        <FaCalendar />
                        <span>{formatarData(feedback.created_at)}</span>
                      </div>
                    </div>

                    {feedback.funcao && (
                      <div className="feedback-funcao">
                        <strong>Função:</strong> {feedback.funcao.titulo}
                      </div>
                    )}

                    <div className="feedback-avaliacao">
                      <div className="avaliacao-stars">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FaStar
                            key={star}
                            className={star <= feedback.avaliacao ? 'star-filled' : 'star-empty'}
                          />
                        ))}
                      </div>
                      <span className="avaliacao-texto">{obterTextoAvaliacao(feedback.avaliacao)}</span>
                    </div>

                    {feedback.comentario && (
                      <div className="feedback-comentario">
                        <FaComment />
                        <div>
                          <strong>Comentário:</strong>
                          <p>{feedback.comentario}</p>
                        </div>
                      </div>
                    )}

                    {feedback.sugestoes && (
                      <div className="feedback-sugestoes">
                        <strong>Sugestões:</strong>
                        <p>{feedback.sugestoes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default GerenciamentoFeedbacksBeta;

