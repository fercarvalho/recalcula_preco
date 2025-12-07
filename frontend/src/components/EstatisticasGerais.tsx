import { useState, useEffect } from 'react';
import Modal from './Modal';
import { apiService } from '../services/api';
import { mostrarAlert } from '../utils/modals';
import { FaUsers, FaSignInAlt, FaClock, FaChartLine, FaSpinner } from 'react-icons/fa';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
  por_genero: Array<{ genero: string; total: number }>;
  por_estado_comercial: Array<{ estado: string; total: number }>;
  por_pais_comercial: Array<{ pais: string; total: number }>;
  por_estado_residencial: Array<{ estado: string; total: number }>;
  por_pais_residencial: Array<{ pais: string; total: number }>;
  por_faixa_idade: Array<{ faixa: string; total: number }>;
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
      console.log('Estatísticas recebidas:', stats);
      console.log('Por gênero:', stats.por_genero);
      console.log('Por estado comercial:', stats.por_estado_comercial);
      console.log('Por país comercial:', stats.por_pais_comercial);
      console.log('Por estado residencial:', stats.por_estado_residencial);
      console.log('Por país residencial:', stats.por_pais_residencial);
      console.log('Por faixa idade:', stats.por_faixa_idade);
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

  // Cores para os gráficos (tema laranja)
  const CORES_GRAFICO = [
    '#FF6B35', // Laranja principal
    '#FF8C5A', // Laranja claro
    '#FFA07A', // Laranja médio
    '#FFB88C', // Laranja suave
    '#FFC8A0', // Laranja muito claro
    '#FFD4B4', // Laranja pastel
    '#FFE0C8', // Laranja muito pastel
    '#FFEBDC', // Laranja quase branco
    '#F4A460', // Marrom areia
    '#D2691E', // Chocolate
  ];

  // Função para gerar cores baseadas no índice
  const obterCor = (index: number) => {
    return CORES_GRAFICO[index % CORES_GRAFICO.length];
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

          {/* Estatísticas de Cadastro */}
          <div className="estatisticas-section">
            <h3>Estatísticas de Cadastro</h3>
            
            {/* Por Gênero */}
            <div className="estatisticas-cadastro">
              <h4>Por Gênero</h4>
              {estatisticas.por_genero && Array.isArray(estatisticas.por_genero) && estatisticas.por_genero.length > 0 ? (
                <>
                  <div className="grafico-container">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={estatisticas.por_genero}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(props: any) => `${props.genero || ''}: ${((props.percent || 0) * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="total"
                        >
                          {estatisticas.por_genero.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={obterCor(index)} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatarNumero(value)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="estatisticas-lista">
                    {estatisticas.por_genero.map((item, index) => (
                      <div key={index} className="estatistica-item">
                        <span className="estatistica-label">{item.genero}:</span>
                        <span className="estatistica-valor">{formatarNumero(item.total)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="estatisticas-vazio">
                  <p>Nenhum dado disponível</p>
                </div>
              )}
            </div>

            {/* Por Estado Comercial */}
            <div className="estatisticas-cadastro">
              <h4>Por Estado (Empresa)</h4>
              {estatisticas.por_estado_comercial && Array.isArray(estatisticas.por_estado_comercial) && estatisticas.por_estado_comercial.length > 0 ? (
                <>
                  <div className="grafico-container">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={estatisticas.por_estado_comercial}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="estado" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip formatter={(value: number) => formatarNumero(value)} />
                        <Legend />
                        <Bar dataKey="total" fill="#FF6B35" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="estatisticas-lista">
                    {estatisticas.por_estado_comercial.map((item, index) => (
                      <div key={index} className="estatistica-item">
                        <span className="estatistica-label">{item.estado}:</span>
                        <span className="estatistica-valor">{formatarNumero(item.total)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="estatisticas-vazio">
                  <p>Nenhum dado disponível</p>
                </div>
              )}
            </div>

            {/* Por País Comercial */}
            <div className="estatisticas-cadastro">
              <h4>Por País (Empresa)</h4>
              {estatisticas.por_pais_comercial && Array.isArray(estatisticas.por_pais_comercial) && estatisticas.por_pais_comercial.length > 0 ? (
                <>
                  <div className="grafico-container">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={estatisticas.por_pais_comercial}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="pais" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip formatter={(value: number) => formatarNumero(value)} />
                        <Legend />
                        <Bar dataKey="total" fill="#FF8C5A" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="estatisticas-lista">
                    {estatisticas.por_pais_comercial.map((item, index) => (
                      <div key={index} className="estatistica-item">
                        <span className="estatistica-label">{item.pais}:</span>
                        <span className="estatistica-valor">{formatarNumero(item.total)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="estatisticas-vazio">
                  <p>Nenhum dado disponível</p>
                </div>
              )}
            </div>

            {/* Por Estado Residencial */}
            <div className="estatisticas-cadastro">
              <h4>Por Estado (Residência)</h4>
              {estatisticas.por_estado_residencial && Array.isArray(estatisticas.por_estado_residencial) && estatisticas.por_estado_residencial.length > 0 ? (
                <>
                  <div className="grafico-container">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={estatisticas.por_estado_residencial}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="estado" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip formatter={(value: number) => formatarNumero(value)} />
                        <Legend />
                        <Bar dataKey="total" fill="#FFA07A" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="estatisticas-lista">
                    {estatisticas.por_estado_residencial.map((item, index) => (
                      <div key={index} className="estatistica-item">
                        <span className="estatistica-label">{item.estado}:</span>
                        <span className="estatistica-valor">{formatarNumero(item.total)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="estatisticas-vazio">
                  <p>Nenhum dado disponível</p>
                </div>
              )}
            </div>

            {/* Por País Residencial */}
            <div className="estatisticas-cadastro">
              <h4>Por País (Residência)</h4>
              {estatisticas.por_pais_residencial && Array.isArray(estatisticas.por_pais_residencial) && estatisticas.por_pais_residencial.length > 0 ? (
                <>
                  <div className="grafico-container">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={estatisticas.por_pais_residencial}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="pais" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip formatter={(value: number) => formatarNumero(value)} />
                        <Legend />
                        <Bar dataKey="total" fill="#FFB88C" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="estatisticas-lista">
                    {estatisticas.por_pais_residencial.map((item, index) => (
                      <div key={index} className="estatistica-item">
                        <span className="estatistica-label">{item.pais}:</span>
                        <span className="estatistica-valor">{formatarNumero(item.total)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="estatisticas-vazio">
                  <p>Nenhum dado disponível</p>
                </div>
              )}
            </div>

            {/* Por Faixa de Idade */}
            <div className="estatisticas-cadastro">
              <h4>Por Faixa de Idade</h4>
              {estatisticas.por_faixa_idade && Array.isArray(estatisticas.por_faixa_idade) && estatisticas.por_faixa_idade.length > 0 ? (
                <>
                  <div className="grafico-container">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={estatisticas.por_faixa_idade}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="faixa" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip formatter={(value: number) => formatarNumero(value)} />
                        <Legend />
                        <Bar dataKey="total" fill="#FFC8A0" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="estatisticas-lista">
                    {estatisticas.por_faixa_idade.map((item, index) => (
                      <div key={index} className="estatistica-item">
                        <span className="estatistica-label">{item.faixa}:</span>
                        <span className="estatistica-valor">{formatarNumero(item.total)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="estatisticas-vazio">
                  <p>Nenhum dado disponível</p>
                </div>
              )}
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

