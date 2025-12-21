import { useState, useEffect } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaCheck, FaShieldAlt } from 'react-icons/fa';
import Modal from './Modal';
import { apiService } from '../services/api';
import { mostrarAlert } from '../utils/modals';
import type { Plano } from './GerenciamentoPlanos';
import './ModalUpgrade.css';
import './SelecaoPlanos.css';

interface ModalUpgradeProps {
  isOpen: boolean;
  onClose: () => void;
  onPagamentoSucesso?: () => void;
}

const ModalUpgrade = ({ isOpen, onClose, onPagamentoSucesso }: ModalUpgradeProps) => {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [carregando, setCarregando] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      carregarPlanos();
    }
  }, [isOpen]);

  const formatarValor = (valor: number | null | undefined): string => {
    if (!valor) return '0,00';
    return valor.toFixed(2).replace('.', ',');
  };

  const formatarPeriodo = (tipo: string, periodo: string | null | undefined, valorParcelado: number | null | undefined): string => {
    if (tipo === 'recorrente' && periodo === 'anual') {
      return '/ano';
    }
    if (tipo === 'recorrente' && periodo === 'mensal') {
      return '/mês';
    }
    if (tipo === 'unico') {
      return 'pagamento único';
    }
    if (tipo === 'parcelado' && valorParcelado) {
      return `/mês (${Math.round((valorParcelado * 12) / valorParcelado)}x de R$ ${formatarValor(valorParcelado)})`;
    }
    return '';
  };

  const carregarPlanos = async () => {
    try {
      setCarregando('carregando');
      const planosCarregados = await apiService.obterPlanos();
      
      // Filtrar apenas planos anuais (recorrentes) ativos
      const planosAnuais: Plano[] = planosCarregados
        .filter(p => 
          p.ativo && 
          p.tipo === 'recorrente' && 
          p.periodo === 'anual' &&
          p.stripe_price_id
        )
        .map(p => ({
          id: p.id,
          nome: p.nome,
          tipo: p.tipo as 'unico' | 'parcelado' | 'recorrente',
          valor: p.valor,
          valor_parcelado: p.valor_parcelado,
          valor_total: p.valor_total,
          periodo: p.periodo,
          desconto_percentual: p.desconto_percentual,
          desconto_valor: p.desconto_valor,
          mais_popular: p.mais_popular,
          mostrar_valor_total: p.mostrar_valor_total,
          mostrar_valor_parcelado: p.mostrar_valor_parcelado,
          ativo: p.ativo,
          ordem: p.ordem,
          beneficios: p.beneficios,
          stripe_price_id: p.stripe_price_id || null,
          frase_reforco: p.frase_reforco || null
        }))
        .sort((a, b) => {
          const ordemA = a.ordem ?? 999;
          const ordemB = b.ordem ?? 999;
          return ordemA - ordemB;
        });
      
      setPlanos(planosAnuais);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      await mostrarAlert('Erro', 'Erro ao carregar planos disponíveis.');
    } finally {
      setCarregando(null);
    }
  };

  const handlePlanoClick = async (plano: Plano) => {
    try {
      // Para planos anuais (recorrentes), redirecionar para checkout de assinatura
      window.location.href = `/checkout-assinatura?planoId=${plano.id}`;
    } catch (error: any) {
      await mostrarAlert('Erro', 'Erro ao iniciar processo de upgrade. Tente novamente.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Faça Upgrade para Plano Anual"
      size="large"
    >
        <div className="modal-upgrade-content">
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <div style={{
              marginBottom: '1rem',
              padding: '1.5rem',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '8px',
              color: '#856404'
            }}>
              <strong style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', marginBottom: '0.5rem' }}>
                <FaExclamationTriangle /> Upgrade Necessário
              </strong>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>
                O <strong>Modo Cardápio</strong> e outras funcionalidades Beta estão disponíveis apenas para usuários do <strong>Plano Anual</strong>.
              </p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                Faça upgrade agora e tenha acesso completo a todas as funcionalidades!
              </p>
            </div>
          </div>

          {carregando === 'carregando' ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p>Carregando planos...</p>
            </div>
          ) : planos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p>Nenhum plano anual disponível no momento.</p>
            </div>
          ) : (
            <div className="planos-grid">
              {planos.map((plano) => {
                const temDescontoPercentual = !!(plano.desconto_percentual && plano.desconto_percentual > 0);
                const temDescontoValor = !!(plano.desconto_valor && plano.desconto_valor > 0);
                const temDesconto = temDescontoPercentual || temDescontoValor;
                
                // Calcular valor com desconto
                const valorComDesconto = temDescontoPercentual
                  ? plano.valor * (1 - (plano.desconto_percentual || 0) / 100)
                  : temDescontoValor
                  ? plano.valor - (plano.desconto_valor || 0)
                  : plano.valor;

                return (
                  <div
                    key={plano.id}
                    className={`plano-card ${plano.mais_popular ? 'plano-destaque' : ''}`}
                  >
                    {plano.mais_popular && (
                      <div className="plano-badge">Mais Popular</div>
                    )}
                    {temDesconto && (
                      <div className="plano-badge-desconto">
                        {temDescontoPercentual
                          ? `${plano.desconto_percentual}% OFF`
                          : `R$ ${formatarValor(plano.desconto_valor)} OFF`}
                      </div>
                    )}
                    <div className="plano-header">
                      <h2>{plano.nome}</h2>
                      <div className="plano-preco">
                        {temDesconto && (
                          <div className="preco-original" style={{
                            marginBottom: '0.5rem',
                            fontSize: '0.9rem',
                            color: '#999',
                            textDecoration: 'line-through'
                          }}>
                            De: R$ {formatarValor(plano.valor_total || plano.valor)}
                          </div>
                        )}
                        <span className="preco-valor">R$ {formatarValor(valorComDesconto)}</span>
                        <span className="preco-periodo">
                          {formatarPeriodo(plano.tipo, plano.periodo, plano.valor_parcelado)}
                        </span>
                        {temDescontoPercentual && (
                          <p className="desconto-info" style={{
                            marginTop: '0.5rem',
                            color: '#4CAF50',
                            fontWeight: 600,
                            fontSize: '0.9rem'
                          }}>
                            Economize {plano.desconto_percentual}%
                          </p>
                        )}
                        {temDescontoValor && !temDescontoPercentual && (
                          <p className="desconto-info" style={{
                            marginTop: '0.5rem',
                            color: '#4CAF50',
                            fontWeight: 600,
                            fontSize: '0.9rem'
                          }}>
                            Economize R$ {formatarValor(plano.desconto_valor!)}
                          </p>
                        )}
                      </div>
                      {plano.frase_reforco && (
                        <p className="plano-frase-reforco">{plano.frase_reforco}</p>
                      )}
                    </div>
                    <ul className="plano-beneficios">
                      {plano.beneficios && plano.beneficios.map((beneficio, index) => {
                        const texto = typeof beneficio === 'string' ? beneficio : beneficio.texto;
                        const ehAviso = typeof beneficio === 'string'
                          ? texto.startsWith('⚠️')
                          : (beneficio.eh_aviso || false);
                        const emBeta = typeof beneficio === 'string'
                          ? texto.startsWith('🚀')
                          : (beneficio.em_beta || false);
                        let textoLimpo = texto;
                        if (typeof beneficio === 'string') {
                          if (texto.startsWith('⚠️')) textoLimpo = texto.substring(2).trim();
                          if (textoLimpo.startsWith('🚀')) textoLimpo = textoLimpo.substring(2).trim();
                          if (texto.startsWith('🚀')) textoLimpo = texto.substring(2).trim();
                          if (textoLimpo.startsWith('⚠️')) textoLimpo = textoLimpo.substring(2).trim();
                        } else {
                          textoLimpo = texto;
                        }
                        return (
                          <li
                            key={typeof beneficio === 'string' ? index : (beneficio.id || index)}
                            className={ehAviso ? 'texto-aviso' : (emBeta ? 'texto-beta' : '')}
                          >
                            {ehAviso ? (
                              <><FaExclamationTriangle style={{ marginRight: '0.5rem', display: 'inline' }} /> {textoLimpo}</>
                            ) : emBeta ? (
                              <>
                                <FaCheck /> <span className="texto-beneficio">{textoLimpo}</span> <span className="badge-beta">Em Beta</span>
                              </>
                            ) : (
                              <><FaCheck /> {textoLimpo}</>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                    <div className="garantia-aviso-plano" style={{
                      marginTop: '1rem',
                      marginBottom: '1rem',
                      padding: '0.75rem',
                      backgroundColor: 'rgba(255, 107, 53, 0.1)',
                      border: '1px solid rgba(255, 107, 53, 0.3)',
                      borderRadius: '6px',
                      textAlign: 'center',
                      fontSize: '0.85rem',
                      color: '#333'
                    }}>
                      <strong style={{ color: 'var(--cor-primaria, #FF6B35)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', width: '100%' }}>
                        <FaShieldAlt /> Garantia de 7 dias
                      </strong>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#333', fontWeight: 500 }}>
                        Não gostou? Reembolso total em até 7 dias
                      </p>
                    </div>
                    <button
                      className={`btn-plano ${plano.mais_popular ? 'btn-plano-anual' : 'btn-plano-unico'}`}
                      onClick={() => handlePlanoClick(plano)}
                      disabled={carregando === 'anual'}
                    >
                      {carregando === 'anual' ? 'Processando...' : 'Fazer Upgrade'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>
  );
};

export default ModalUpgrade;
