import { useState, useEffect } from 'react';
import Modal from './Modal';
import { apiService } from '../services/api';
import { mostrarAlert } from '../utils/modals';
import { FaClock, FaSignInAlt, FaUser, FaCalendar, FaChartLine } from 'react-icons/fa';
import './EstatisticasUsuarios.css';

interface EstatisticasUsuario {
  id: number;
  username: string;
  email: string;
  created_at: string;
  last_login: string | null;
  login_count: number;
  total_usage_time: number;
  last_activity: string | null;
  current_session_start: string | null;
  current_session_duration: number;
  total_sessions: number;
  total_sessions_time: number;
}

interface EstatisticasUsuariosProps {
  isOpen: boolean;
  onClose: () => void;
  usuarioId?: number; // Se fornecido, mostra apenas as estatísticas deste usuário
  username?: string; // Nome do usuário para exibir no título
}

const EstatisticasUsuarios = ({ isOpen, onClose, usuarioId, username }: EstatisticasUsuariosProps) => {
  const [estatisticas, setEstatisticas] = useState<EstatisticasUsuario | EstatisticasUsuario[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      carregarEstatisticas();
    } else {
      // Limpar estatísticas ao fechar
      setEstatisticas(null);
    }
  }, [isOpen, usuarioId]);

  const carregarEstatisticas = async () => {
    try {
      setLoading(true);
      if (usuarioId) {
        // Carregar estatísticas de um usuário específico
        const stats = await apiService.obterEstatisticasUsuarioPorId(usuarioId);
        setEstatisticas(stats);
      } else {
        // Carregar estatísticas de todos os usuários
        const stats = await apiService.obterEstatisticasTodosUsuarios();
        setEstatisticas(stats);
      }
    } catch (error: any) {
      console.error('Erro ao carregar estatísticas:', error);
      await mostrarAlert('Erro', 'Erro ao carregar estatísticas dos usuários.');
    } finally {
      setLoading(false);
    }
  };

  const formatarTempo = (segundos: number): string => {
    if (!segundos || segundos === 0) return '0s';
    
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    
    if (horas > 0) {
      return `${horas}h ${minutos}m ${segs}s`;
    } else if (minutos > 0) {
      return `${minutos}m ${segs}s`;
    } else {
      return `${segs}s`;
    }
  };

  const formatarData = (data: string | null): string => {
    if (!data) return 'Nunca';
    const date = new Date(data);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatarDataRelativa = (data: string | null): string => {
    if (!data) return 'Nunca';
    const date = new Date(data);
    const agora = new Date();
    const diffMs = agora.getTime() - date.getTime();
    const diffSegundos = Math.floor(diffMs / 1000);
    const diffMinutos = Math.floor(diffSegundos / 60);
    const diffHoras = Math.floor(diffMinutos / 60);
    const diffDias = Math.floor(diffHoras / 24);

    if (diffDias > 0) {
      return `Há ${diffDias} ${diffDias === 1 ? 'dia' : 'dias'}`;
    } else if (diffHoras > 0) {
      return `Há ${diffHoras} ${diffHoras === 1 ? 'hora' : 'horas'}`;
    } else if (diffMinutos > 0) {
      return `Há ${diffMinutos} ${diffMinutos === 1 ? 'minuto' : 'minutos'}`;
    } else {
      return 'Agora mesmo';
    }
  };

  if (!isOpen) return null;

  const isEstatisticaUnica = usuarioId !== undefined;
  const statsArray = isEstatisticaUnica && estatisticas && !Array.isArray(estatisticas) 
    ? [estatisticas] 
    : Array.isArray(estatisticas) 
    ? estatisticas 
    : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEstatisticaUnica ? `Estatísticas de ${username || 'Usuário'}` : "Estatísticas de Uso dos Usuários"}
      size={isEstatisticaUnica ? "medium" : "large"}
      className="modal-nested"
      footer={
        <button onClick={onClose} className="btn-secondary">
          Fechar
        </button>
      }
    >
      <div className="estatisticas-usuarios-container">
        {loading ? (
          <div className="loading">Carregando estatísticas...</div>
        ) : !estatisticas || statsArray.length === 0 ? (
          <div className="no-data">Nenhuma estatística disponível</div>
        ) : (
          <div className={`estatisticas-grid ${isEstatisticaUnica ? 'single-user' : ''}`}>
            {statsArray.map((stat) => (
              <div key={stat.id} className="estatistica-card">
                <div className="estatistica-header">
                  <FaUser className="estatistica-icon" />
                  <div>
                    <h4>{stat.username}</h4>
                    <p className="estatistica-email">{stat.email}</p>
                  </div>
                </div>
                
                <div className="estatistica-body">
                  <div className="estatistica-item">
                    <FaCalendar className="estatistica-item-icon" />
                    <div>
                      <span className="estatistica-label">Conta criada em:</span>
                      <span className="estatistica-value">{formatarData(stat.created_at)}</span>
                    </div>
                  </div>

                  <div className="estatistica-item">
                    <FaSignInAlt className="estatistica-item-icon" />
                    <div>
                      <span className="estatistica-label">Último login:</span>
                      <span className="estatistica-value">{formatarDataRelativa(stat.last_login)}</span>
                      {stat.last_login && (
                        <span className="estatistica-subvalue">{formatarData(stat.last_login)}</span>
                      )}
                    </div>
                  </div>

                  <div className="estatistica-item">
                    <FaChartLine className="estatistica-item-icon" />
                    <div>
                      <span className="estatistica-label">Total de logins:</span>
                      <span className="estatistica-value">{stat.login_count}</span>
                    </div>
                  </div>

                  <div className="estatistica-item">
                    <FaClock className="estatistica-item-icon" />
                    <div>
                      <span className="estatistica-label">Tempo total de uso:</span>
                      <span className="estatistica-value">{formatarTempo(stat.total_usage_time)}</span>
                    </div>
                  </div>

                  {stat.current_session_start && (
                    <div className="estatistica-item active-session">
                      <FaClock className="estatistica-item-icon" />
                      <div>
                        <span className="estatistica-label">Sessão atual:</span>
                        <span className="estatistica-value">{formatarTempo(stat.current_session_duration)}</span>
                      </div>
                    </div>
                  )}

                  <div className="estatistica-item">
                    <FaClock className="estatistica-item-icon" />
                    <div>
                      <span className="estatistica-label">Última atividade:</span>
                      <span className="estatistica-value">{formatarDataRelativa(stat.last_activity)}</span>
                      {stat.last_activity && (
                        <span className="estatistica-subvalue">{formatarData(stat.last_activity)}</span>
                      )}
                    </div>
                  </div>

                  {stat.total_sessions > 0 && (
                    <div className="estatistica-item">
                      <FaChartLine className="estatistica-item-icon" />
                      <div>
                        <span className="estatistica-label">Total de sessões:</span>
                        <span className="estatistica-value">{stat.total_sessions}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default EstatisticasUsuarios;

