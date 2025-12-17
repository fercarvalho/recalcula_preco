import { useState, useEffect } from 'react';
import Modal from './Modal';
import { getToken } from '../services/auth';
import { FaTicketAlt, FaUser, FaCreditCard, FaCalendar, FaDollarSign, FaChevronDown, FaChevronUp, FaSpinner } from 'react-icons/fa';
import './DashboardCupons.css';

interface DashboardCuponsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UsoCupom {
  paymentIntentId: string;
  valor: number;
  status: string;
  data: string;
  usuario: {
    id: number;
    username: string;
    email?: string;
  } | null;
  plano: {
    id: number;
    nome: string;
  } | null;
}

interface PromotionCode {
  promotionCodeId: string;
  codigo: string;
  totalUsos: number;
}

interface Cupom {
  couponId: string;
  nomeCupom: string;
  tipo: 'percentual' | 'fixo';
  desconto: number;
  duracao: string;
  valido: boolean;
  criadoEm: string;
  promotionCodes: PromotionCode[];
  totalUsos: number;
  totalDescontoAplicado: number;
  todosUsos: UsoCupom[];
}

const DashboardCupons = ({ isOpen, onClose }: DashboardCuponsProps) => {
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cuponsExpandidos, setCuponsExpandidos] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      carregarCupons();
    }
  }, [isOpen]);

  const carregarCupons = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || window.location.origin;
      const token = getToken();
      
      const response = await fetch(`${API_BASE}/api/admin/cupons-stripe`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar cupons');
      }

      const data = await response.json();
      setCupons(data.cupons || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar cupons da Stripe');
      console.error('Erro ao carregar cupons:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpandirCupom = (couponId: string) => {
    setCuponsExpandidos(prev => {
      const novo = new Set(prev);
      if (novo.has(couponId)) {
        novo.delete(couponId);
      } else {
        novo.add(couponId);
      }
      return novo;
    });
  };

  const formatarData = (dataISO: string) => {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const formatarDesconto = (tipo: string, desconto: number) => {
    if (tipo === 'percentual') {
      return `${desconto}%`;
    } else {
      return formatarValor(desconto / 100);
    }
  };

  const totalUsos = cupons.reduce((sum, c) => sum + c.totalUsos, 0);
  const totalDesconto = cupons.reduce((sum, c) => sum + c.totalDescontoAplicado, 0);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Dashboard de Cupons - Stripe"
      className="dashboard-cupons-modal"
    >
      <div className="dashboard-cupons">
        {loading && (
          <div className="dashboard-cupons-loading">
            <FaSpinner className="spinner" />
            <p>Carregando cupons da Stripe...</p>
          </div>
        )}

        {error && (
          <div className="dashboard-cupons-error">
            <p>❌ {error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Resumo geral */}
            <div className="dashboard-cupons-resumo">
              <div className="resumo-card">
                <FaTicketAlt className="resumo-icon" />
                <div className="resumo-content">
                  <h3>Total de Cupons</h3>
                  <p className="resumo-valor">{cupons.length}</p>
                </div>
              </div>
              <div className="resumo-card">
                <FaUser className="resumo-icon" />
                <div className="resumo-content">
                  <h3>Total de Usos</h3>
                  <p className="resumo-valor">{totalUsos}</p>
                </div>
              </div>
              <div className="resumo-card">
                <FaDollarSign className="resumo-icon" />
                <div className="resumo-content">
                  <h3>Total Descontado</h3>
                  <p className="resumo-valor">{formatarValor(totalDesconto)}</p>
                </div>
              </div>
            </div>

            {/* Lista de cupons */}
            {cupons.length === 0 ? (
              <div className="dashboard-cupons-vazio">
                <p>Nenhum cupom encontrado na Stripe.</p>
              </div>
            ) : (
              <div className="dashboard-cupons-lista">
                {cupons.map((cupom) => (
                  <div key={cupom.couponId} className="cupom-card">
                    <div 
                      className="cupom-header"
                      onClick={() => toggleExpandirCupom(cupom.couponId)}
                    >
                      <div className="cupom-info">
                        <h3>{cupom.nomeCupom || 'Sem nome'}</h3>
                        <div className="cupom-badges">
                          <span className={`badge ${cupom.valido ? 'badge-valid' : 'badge-invalid'}`}>
                            {cupom.valido ? 'Válido' : 'Inválido'}
                          </span>
                          <span className="badge badge-tipo">
                            {cupom.tipo === 'percentual' ? 'Percentual' : 'Valor Fixo'}
                          </span>
                          <span className="badge badge-desconto">
                            {formatarDesconto(cupom.tipo, cupom.desconto)}
                          </span>
                        </div>
                      </div>
                      <div className="cupom-stats">
                        <div className="stat-item">
                          <FaUser />
                          <span>{cupom.totalUsos} uso{cupom.totalUsos !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="stat-item">
                          <FaDollarSign />
                          <span>{formatarValor(cupom.totalDescontoAplicado)}</span>
                        </div>
                        {cuponsExpandidos.has(cupom.couponId) ? (
                          <FaChevronUp className="expand-icon" />
                        ) : (
                          <FaChevronDown className="expand-icon" />
                        )}
                      </div>
                    </div>

                    {cuponsExpandidos.has(cupom.couponId) && (
                      <div className="cupom-detalhes">
                        <div className="detalhes-section">
                          <h4>Informações do Cupom</h4>
                          <div className="detalhes-grid">
                            <div className="detalhe-item">
                              <strong>ID do Cupom:</strong>
                              <span>{cupom.couponId}</span>
                            </div>
                            <div className="detalhe-item">
                              <strong>Duração:</strong>
                              <span>
                                {cupom.duracao === 'once' ? 'Uma vez' :
                                 cupom.duracao === 'repeating' ? 'Repetindo' :
                                 cupom.duracao === 'forever' ? 'Vitalício' : cupom.duracao}
                              </span>
                            </div>
                            <div className="detalhe-item">
                              <strong>Criado em:</strong>
                              <span>{formatarData(cupom.criadoEm)}</span>
                            </div>
                          </div>
                        </div>

                        {cupom.promotionCodes.length > 0 && (
                          <div className="detalhes-section">
                            <h4>Códigos Promocionais ({cupom.promotionCodes.length})</h4>
                            <div className="promotion-codes-list">
                              {cupom.promotionCodes.map((promo) => (
                                <div key={promo.promotionCodeId} className="promotion-code-item">
                                  <span className="promo-code">{promo.codigo}</span>
                                  <span className="promo-usos">{promo.totalUsos} uso{promo.totalUsos !== 1 ? 's' : ''}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {cupom.todosUsos.length > 0 && (
                          <div className="detalhes-section">
                            <h4>Histórico de Usos ({cupom.todosUsos.length})</h4>
                            <div className="usos-table">
                              <table>
                                <thead>
                                  <tr>
                                    <th>Data</th>
                                    <th>Usuário</th>
                                    <th>Plano</th>
                                    <th>Valor Original</th>
                                    <th>Desconto</th>
                                    <th>Valor Final</th>
                                    <th>Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {cupom.todosUsos.map((uso, idx) => (
                                    <tr key={`${uso.paymentIntentId}-${idx}`}>
                                      <td>{formatarData(uso.data)}</td>
                                      <td>
                                        {uso.usuario ? (
                                          <div className="usuario-info">
                                            <strong>{uso.usuario.username}</strong>
                                            {uso.usuario.email && (
                                              <span className="usuario-email">{uso.usuario.email}</span>
                                            )}
                                          </div>
                                        ) : (
                                          <span className="text-muted">N/A</span>
                                        )}
                                      </td>
                                      <td>
                                        {uso.plano ? (
                                          <span>{uso.plano.nome}</span>
                                        ) : (
                                          <span className="text-muted">N/A</span>
                                        )}
                                      </td>
                                      <td>
                                        {uso.valorOriginal !== undefined ? (
                                          <span>{formatarValor(uso.valorOriginal)}</span>
                                        ) : (
                                          <span className="text-muted">N/A</span>
                                        )}
                                      </td>
                                      <td>
                                        {uso.descontoAplicado !== undefined ? (
                                          <span style={{ color: '#2ecc71', fontWeight: 'bold' }}>
                                            -{formatarValor(uso.descontoAplicado)}
                                          </span>
                                        ) : (
                                          <span className="text-muted">N/A</span>
                                        )}
                                      </td>
                                      <td>{formatarValor(uso.valor)}</td>
                                      <td>
                                        <span className={`status-badge status-${uso.status}`}>
                                          {uso.status === 'succeeded' ? 'Sucesso' : uso.status}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {cupom.todosUsos.length === 0 && (
                          <div className="detalhes-section">
                            <p className="text-muted">Nenhum uso registrado ainda.</p>
                          </div>
                        )}
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

export default DashboardCupons;

