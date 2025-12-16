import React, { useState, useEffect, lazy, Suspense, Component, ErrorInfo, ReactNode } from 'react';
import { FaCheck } from 'react-icons/fa';
import { apiService } from '../services/api';
import { mostrarAlert } from '../utils/modals';
import { getUser } from '../services/auth';
import Modal from './Modal';
import type { Plano } from './GerenciamentoPlanos';
import './SelecaoPlanos.css';

// Lazy load do CheckoutTransparente
const CheckoutTransparente = lazy(() => import('./CheckoutTransparente'));

// Error Boundary para capturar erros do componente
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Erro no CheckoutTransparente:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '1rem', backgroundColor: '#ffebee', border: '1px solid #d32f2f', borderRadius: '8px', color: '#d32f2f' }}>
          <p><strong>Erro ao carregar formulário de pagamento:</strong></p>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
            {this.state.error?.message || 'Erro desconhecido'}
          </p>
          <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: '#666' }}>
            Verifique se VITE_STRIPE_PUBLIC_KEY está configurado no arquivo .env
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

interface SelecaoPlanosProps {
  onPagamentoSucesso?: () => void;
}

export const SelecaoPlanos: React.FC<SelecaoPlanosProps> = ({ onPagamentoSucesso: _onPagamentoSucesso }) => {
  const [carregando, setCarregando] = useState<string | null>(null);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [statusPagamento, setStatusPagamento] = useState<{
    temAcesso: boolean;
    tipo: 'anual' | 'unico' | 'vitalicio' | null;
  } | null>(null);
  const [planoSelecionado, setPlanoSelecionado] = useState<Plano | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [pagamentoProcessado, setPagamentoProcessado] = useState(false);

  useEffect(() => {
    // Limpar estado de carregamento ao montar o componente
    setCarregando(null);
    verificarStatus();
    carregarPlanos();
  }, []);


  const carregarPlanos = async () => {
    try {
      const planosCarregados = await apiService.obterPlanos();
      // Converter para o tipo Plano e ordenar por ordem
      const planosConvertidos: Plano[] = planosCarregados.map(p => ({
        id: p.id,
        nome: p.nome,
        tipo: p.tipo as Plano['tipo'],
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
      }));
      
      // Ordenar por ordem
      const planosOrdenados = planosConvertidos.sort((a, b) => {
        const ordemA = a.ordem ?? 999;
        const ordemB = b.ordem ?? 999;
        return ordemA - ordemB;
      });
      
      setPlanos(planosOrdenados);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    }
  };

  const formatarValor = (valor: number | null | undefined): string => {
    if (valor === null || valor === undefined || isNaN(valor) || valor <= 0) return '0,00';
    return valor.toFixed(2).replace('.', ',');
  };

  const formatarPeriodo = (tipo: string, periodo: string | null | undefined, valorParcelado: number | null | undefined): string => {
    if (tipo === 'unico') {
      return periodo || 'pagamento único';
    }
    if (tipo === 'parcelado') {
      if (valorParcelado && valorParcelado > 0) {
        return '/mês em parcelas';
      }
      return '';
    }
    if (tipo === 'recorrente') {
      if (periodo && periodo.trim() !== '') {
        return `/${periodo}`;
      }
      return '/mês';
    }
    return '';
  };

  const verificarStatus = async () => {
    try {
      const status = await apiService.verificarStatusPagamento();
      setStatusPagamento(status);
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    }
  };

  const handlePlanoClick = async (plano: Plano) => {
    try {
      // Determinar tipo de plano de forma mais robusta
      const nomeLower = (plano.nome || '').toLowerCase();
      const tipoLower = (plano.tipo || '').toLowerCase();
      const isRecorrente = tipoLower === 'recorrente' || nomeLower.includes('anual');
      const isUnico = tipoLower === 'unico' || nomeLower.includes('único') || nomeLower.includes('unico');
      
      if (isRecorrente) {
        // Para assinaturas anuais, ainda usar checkout tradicional (redirecionamento)
        // TODO: Implementar checkout transparente para assinaturas no futuro
        setCarregando('anual');
        const { url } = await apiService.criarCheckoutAnual(plano.stripe_price_id || undefined);
        window.location.href = url;
      } else if (isUnico) {
        // Para pagamentos únicos, redirecionar para página de checkout
        window.location.href = `/checkout?planoId=${plano.id}`;
      } else {
        await mostrarAlert('Erro', 'Tipo de plano não suportado para pagamento.');
        setCarregando(null);
      }
    } catch (error: any) {
      setCarregando(null);
      await mostrarAlert(
        'Erro',
        error.response?.data?.error || 'Erro ao criar sessão de pagamento. Tente novamente.'
      );
    }
  };

  const handleCheckoutSuccess = async () => {
    setPagamentoProcessado(true);
    await mostrarAlert('Sucesso', 'Pagamento processado com sucesso!');
    setShowCheckoutModal(false);
    // Recarregar status e planos
    await verificarStatus();
    await carregarPlanos();
    if (_onPagamentoSucesso) {
      _onPagamentoSucesso();
    }
    // Recarregar página após um tempo
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  const handleCheckoutError = async (error: string) => {
    await mostrarAlert('Erro', error);
  };

  const calcularValorComDesconto = (plano: Plano): number => {
    const temDescontoPercentual = !!(plano.desconto_percentual && plano.desconto_percentual > 0);
    const temDescontoValor = !!(plano.desconto_valor && plano.desconto_valor > 0);
    
    if (temDescontoPercentual) {
      return plano.valor * (1 - (plano.desconto_percentual || 0) / 100);
    }
    if (temDescontoValor) {
      return plano.valor - (plano.desconto_valor || 0);
    }
    return plano.valor;
  };

  if (statusPagamento?.temAcesso) {
    return (
      <div className="selecao-planos-container">
        <div className="plano-ativo">
          <h2>✅ Você já tem acesso ativo!</h2>
          <p>
            {statusPagamento.tipo === 'anual'
              ? 'Sua assinatura anual está ativa.'
              : 'Você tem um acesso único ativo.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="selecao-planos-container">
      <div className="planos-header">
        <h1>Escolha seu Plano</h1>
        <p>Selecione o plano que melhor se adequa às suas necessidades</p>
        <div className="aviso-beta-planos" style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '8px',
          color: '#856404'
        }}>
          <strong>⚠️ Aviso:</strong> As funções em Beta (como Modo Cardápio) estão disponíveis apenas para usuários do Plano Anual.
        </div>
      </div>

      <div className="planos-grid">
        {planos.length === 0 ? (
          <div>Carregando planos...</div>
        ) : (
          planos.map((plano) => {
            const temDescontoPercentual = !!(plano.desconto_percentual && plano.desconto_percentual > 0);
            const temDescontoValor = !!(plano.desconto_valor && plano.desconto_valor > 0);
            const temDesconto = temDescontoPercentual || temDescontoValor;
            
            // Calcular valor com desconto (igual à landing page)
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
                        De: R$ {formatarValor(plano.valor)}
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
                  {plano.tipo === 'recorrente' && !plano.frase_reforco && (
                    <p className="plano-descricao">Acesso completo por 12 meses</p>
                  )}
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
                          <>⚠️ {textoLimpo}</>
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
                  <strong style={{ color: 'var(--cor-primaria, #FF6B35)', display: 'block' }}>🛡️ Garantia de 7 dias</strong>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#333', fontWeight: 500 }}>
                    Não gostou? Reembolso total em até 7 dias
                  </p>
                </div>
                <button
                  className={`btn-plano ${plano.mais_popular ? 'btn-plano-anual' : 'btn-plano-unico'}`}
                  onClick={() => handlePlanoClick(plano)}
                  disabled={(() => {
                    // Detectar tipo de plano de forma mais robusta
                    const nomeLower = (plano.nome || '').toLowerCase();
                    const tipoLower = (plano.tipo || '').toLowerCase();
                    const isRecorrente = tipoLower === 'recorrente' || nomeLower.includes('anual');
                    const isUnico = tipoLower === 'unico' || nomeLower.includes('único') || nomeLower.includes('unico');
                    
                    const loadingType = isRecorrente ? 'anual' : (isUnico ? 'unico' : null);
                    return carregando === loadingType;
                  })()}
                >
                  {(() => {
                    // Detectar tipo de plano de forma mais robusta
                    const nomeLower = (plano.nome || '').toLowerCase();
                    const tipoLower = (plano.tipo || '').toLowerCase();
                    const isRecorrente = tipoLower === 'recorrente' || nomeLower.includes('anual');
                    const isUnico = tipoLower === 'unico' || nomeLower.includes('único') || nomeLower.includes('unico');
                    
                    const loadingType = isRecorrente ? 'anual' : (isUnico ? 'unico' : null);
                    
                    if (carregando === loadingType) {
                      return 'Processando...';
                    }
                    if (isUnico) {
                      return 'Comprar Acesso Único';
                    }
                    if (isRecorrente) {
                      return 'Assinar Plano Anual';
                    }
                    return 'Assinar';
                  })()}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Checkout Transparente */}
      {planoSelecionado && (
        <Modal
          isOpen={showCheckoutModal}
          onClose={() => {
            setShowCheckoutModal(false);
            setPlanoSelecionado(null);
            setPagamentoProcessado(false);
          }}
          title={pagamentoProcessado ? "Pagamento Realizado" : `Finalizar Pagamento - ${planoSelecionado.nome}`}
          size="medium"
        >
          {pagamentoProcessado ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <h3 style={{ color: '#4CAF50', marginBottom: '1rem' }}>✅ Pagamento realizado com sucesso!</h3>
              <p>Você já tem acesso ao plano {planoSelecionado.nome}.</p>
              <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
                A página será recarregada em instantes...
              </p>
            </div>
          ) : (
            <div style={{ padding: '1rem' }}>
              <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                <p><strong>Plano:</strong> {planoSelecionado.nome}</p>
                <p><strong>Valor:</strong> R$ {formatarValor(calcularValorComDesconto(planoSelecionado))}</p>
                <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                  💡 <strong>Modo de teste:</strong> Use o cartão de teste <code>4242 4242 4242 4242</code> com qualquer data futura e CVC qualquer.
                </p>
              </div>
              
              <div className="garantia-aviso" style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                backgroundColor: 'rgba(255, 107, 53, 0.1)',
                border: '1px solid rgba(255, 107, 53, 0.3)',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <strong style={{ 
                  color: 'var(--cor-primaria, #FF6B35)', 
                  fontSize: '0.95rem',
                  display: 'block',
                  marginBottom: '0.5rem'
                }}>
                  🛡️ Garantia de 7 dias
                </strong>
                <p style={{ 
                  margin: 0, 
                  fontSize: '0.85rem', 
                  color: '#666',
                  lineHeight: '1.4'
                }}>
                  Não gostou? Reembolso total em até 7 dias após a compra
                </p>
              </div>
              
              {getUser() ? (
                <Suspense 
                  fallback={<div style={{ textAlign: 'center', padding: '2rem' }}>Carregando formulário de pagamento...</div>}
                >
                  <ErrorBoundary>
                    <CheckoutTransparente
                      amount={Math.round(calcularValorComDesconto(planoSelecionado) * 100)} // Converter para centavos
                      userId={getUser()!.id}
                      planoId={planoSelecionado.id}
                      onSuccess={handleCheckoutSuccess}
                      onError={handleCheckoutError}
                    />
                  </ErrorBoundary>
                </Suspense>
              ) : (
                <div style={{ padding: '1rem', backgroundColor: '#ffebee', border: '1px solid #d32f2f', borderRadius: '8px', color: '#d32f2f' }}>
                  <p>Erro: Usuário não autenticado. Por favor, faça login novamente.</p>
                </div>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

