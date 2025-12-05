import { useState, useEffect } from 'react';
import Modal from './Modal';
import { apiService } from '../services/api';
import { mostrarAlert } from '../utils/modals';
import { FaUsers, FaSignInAlt, FaClock, FaChartLine, FaSpinner } from 'react-icons/fa';
import './EstatisticasGerais.css';

interface EstatisticasGerais {
  total_usuarios: number;
  total_logins: number;
  tempo_total_uso: number;
  total_sessoes: number;
  tempo_total_sessoes: number;
  media_logins_por_usuario: number;
  media_tempo_uso_por_usuario: number;
  media_sessoes_por_usuario: number;
  media_tempo_sessao: number;
  usuarios_ativos_hoje: number;
  usuarios_ativos_semana: number;
  usuarios_ativos_mes: number;
}

interface EstatisticasGeraisProps {
  isOpen: boolean;
  onClose: () => void;
}

const EstatisticasGerais = ({ isOpen, onClose }: EstatisticasGeraisProps) => {
  const [estatisticas, setEstatisticas] = useState<EstatisticasGerais | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('EstatisticasGerais - isOpen mudou para:', isOpen);
    if (isOpen) {
      carregarEstatisticas();
    } else {
      setEstatisticas(null);
    }
  }, [isOpen]);

  const carregarEstatisticas = async () => {
    try {
      setLoading(true);
      const stats = await apiService.obterEstatisticasGerais();
      setEstatisticas(stats);
    } catch (error: any) {
      console.error('Erro ao carregar estatísticas gerais:', error);
      await mostrarAlert('Erro', 'Erro ao carregar estatísticas gerais do sistema.');
    } finally {
      setLoading(false);
    }
  };

  const formatarTempo = (segundos: number): string => {
    if (!segundos || segundos === 0) return '0s';
    
    // Arredondar para duas casas decimais
    const segundosArredondados = Math.round(segundos * 100) / 100;
    
    const horas = Math.floor(segundosArredondados / 3600);
    const minutos = Math.floor((segundosArredondados % 3600) / 60);
    const segs = segundosArredondados % 60;
    
    if (horas > 0) {
      // Se há horas, mostrar apenas horas e minutos (sem segundos)
      return `${horas}h ${minutos}m`;
    } else if (minutos > 0) {
      // Se há minutos, mostrar minutos e segundos arredondados (sem decimais)
      const segsInt = Math.round(segs);
      return segsInt > 0 ? `${minutos}m ${segsInt}s` : `${minutos}m`;
    } else {
      // Se só há segundos, mostrar com duas casas decimais
      const segsFormatado = segs.toFixed(2).replace('.', ',');
      return `${segsFormatado}s`;
    }
  };

  const formatarNumero = (num: number): string => {
    if (num === null || num === undefined) return '0,00';
    return num.toLocaleString('pt-BR', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Estatísticas Gerais do Sistema"
      size="large"
      className="modal-nested"
      footer={
        <button onClick={onClose} className="btn-primary">
          Fechar
        </button>
      }
    >
      {loading ? (
        <div className="estatisticas-gerais-loading">
          <FaSpinner className="spinner" />
          <p>Carregando estatísticas...</p>
        </div>
      ) : estatisticas ? (
        <div className="estatisticas-gerais-container">
          {/* Estatísticas Principais */}
          <div className="estatisticas-grid">
            <div className="estatistica-card principal">
              <div className="estatistica-header">
                <FaUsers className="estatistica-icon" />
                <h3>Total de Usuários</h3>
              </div>
              <div className="estatistica-value">
                {formatarNumero(estatisticas.total_usuarios)}
              </div>
            </div>

            <div className="estatistica-card principal">
              <div className="estatistica-header">
                <FaSignInAlt className="estatistica-icon" />
                <h3>Total de Logins</h3>
              </div>
              <div className="estatistica-value">
                {formatarNumero(estatisticas.total_logins)}
              </div>
            </div>

            <div className="estatistica-card principal">
              <div className="estatistica-header">
                <FaClock className="estatistica-icon" />
                <h3>Tempo Total de Uso</h3>
              </div>
              <div className="estatistica-value">
                {formatarTempo(estatisticas.tempo_total_uso)}
              </div>
            </div>

            <div className="estatistica-card principal">
              <div className="estatistica-header">
                <FaChartLine className="estatistica-icon" />
                <h3>Total de Sessões</h3>
              </div>
              <div className="estatistica-value">
                {formatarNumero(estatisticas.total_sessoes)}
              </div>
            </div>
          </div>

          {/* Estatísticas de Médias */}
          <div className="estatisticas-section">
            <h3>Médias por Usuário</h3>
            <div className="estatisticas-grid medias">
              <div className="estatistica-card">
                <div className="estatistica-label">Média de Logins</div>
                <div className="estatistica-value-small">
                  {formatarNumero(estatisticas.media_logins_por_usuario)}
                </div>
              </div>

              <div className="estatistica-card">
                <div className="estatistica-label">Média de Tempo de Uso</div>
                <div className="estatistica-value-small">
                  {formatarTempo(estatisticas.media_tempo_uso_por_usuario)}
                </div>
              </div>

              <div className="estatistica-card">
                <div className="estatistica-label">Média de Sessões</div>
                <div className="estatistica-value-small">
                  {formatarNumero(estatisticas.media_sessoes_por_usuario)}
                </div>
              </div>

              <div className="estatistica-card">
                <div className="estatistica-label">Média de Tempo por Sessão</div>
                <div className="estatistica-value-small">
                  {formatarTempo(estatisticas.media_tempo_sessao)}
                </div>
              </div>
            </div>
          </div>

          {/* Usuários Ativos */}
          <div className="estatisticas-section">
            <h3>Usuários Ativos</h3>
            <div className="estatisticas-grid ativos">
              <div className="estatistica-card">
                <div className="estatistica-label">Hoje</div>
                <div className="estatistica-value-small">
                  {formatarNumero(estatisticas.usuarios_ativos_hoje)}
                </div>
              </div>

              <div className="estatistica-card">
                <div className="estatistica-label">Últimos 7 dias</div>
                <div className="estatistica-value-small">
                  {formatarNumero(estatisticas.usuarios_ativos_semana)}
                </div>
              </div>

              <div className="estatistica-card">
                <div className="estatistica-label">Últimos 30 dias</div>
                <div className="estatistica-value-small">
                  {formatarNumero(estatisticas.usuarios_ativos_mes)}
                </div>
              </div>
            </div>
          </div>

          {/* Informações Adicionais */}
          <div className="estatisticas-section">
            <h3>Informações Adicionais</h3>
            <div className="estatisticas-info">
              <div className="info-item">
                <span className="info-label">Tempo Total de Sessões:</span>
                <span className="info-value">{formatarTempo(estatisticas.tempo_total_sessoes)}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="estatisticas-gerais-empty">
          <p>Nenhuma estatística disponível.</p>
        </div>
      )}
    </Modal>
  );
};

export default EstatisticasGerais;

