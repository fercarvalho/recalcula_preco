import { useState, useEffect, lazy, Suspense } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaCheck, FaShieldAlt } from 'react-icons/fa';
import Modal from './Modal';
import { apiService } from '../services/api';
import { mostrarAlert } from '../utils/modals';
import type { Plano } from './GerenciamentoPlanos';
import { getUser } from '../services/auth';
import './ModalUpgrade.css';
import './SelecaoPlanos.css';

// Lazy load do CheckoutTransparente
const CheckoutTransparente = lazy(() => import('./CheckoutTransparente'));

interface ModalUpgradeProps {
  isOpen: boolean;
  onClose: () => void;
  onPagamentoSucesso?: () => void;
}

const ModalUpgrade = ({ isOpen, onClose, onPagamentoSucesso }: ModalUpgradeProps) => {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [carregando, setCarregando] = useState<string | null>(null);
  const [planoSelecionado, setPlanoSelecionado] = useState<Plano | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [temAcessoUnico, setTemAcessoUnico] = useState<boolean>(false);
  const [valorDinamico, setValorDinamico] = useState<number | null>(null);
  const [temAssinaturaAtiva, setTemAssinaturaAtiva] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const user = getUser();
      if (user?.id) {
        setUserId(user.id);
      }
      verificarAcessoUnico().then(() => {
        // Carregar planos depois de verificar o tipo de acesso
      carregarPlanos();
      });
    } else {
      // Resetar estado ao fechar
      setPlanoSelecionado(null);
      setTemAcessoUnico(false);
      setTemAssinaturaAtiva(false);
      setValorDinamico(null);
    }
  }, [isOpen]);

  const verificarAcessoUnico = async () => {
    try {
      const status = await apiService.verificarStatusPagamento();
      if (status.tipo === 'unico') {
        setTemAcessoUnico(true);
        setTemAssinaturaAtiva(false);
      } else if (status.tipo === 'anual' && status.assinatura) {
        // Usuário tem assinatura ativa (plano parcelado/recorrente)
        setTemAcessoUnico(false);
        setTemAssinaturaAtiva(true);
      } else {
        // Se não tem mais acesso único nem assinatura, fechar o modal
        setTemAcessoUnico(false);
        setTemAssinaturaAtiva(false);
        await mostrarAlert('Atenção', 'Este modal é apenas para usuários com plano de acesso único ou assinatura ativa.');
        onClose();
      }
    } catch (error) {
      console.error('Erro ao verificar acesso:', error);
      setTemAcessoUnico(false);
      setTemAssinaturaAtiva(false);
      onClose();
    }
  };

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
      
      // Verificar status para determinar qual tipo de upgrade mostrar
      const status = await apiService.verificarStatusPagamento();
      
      // Se o usuário tem assinatura ativa (plano recorrente), mostrar upgrade com preço dinâmico
      if (status.tipo === 'anual' && status.assinatura) {
        // Calcular valor dinâmico antecipadamente para mostrar no card
        let valorDinamicoCalculado = 29.00; // Valor padrão mínimo
        try {
          const resultado = await apiService.calcularValorUpgrade();
          valorDinamicoCalculado = resultado.valor;
        } catch (error) {
          console.error('Erro ao calcular valor dinâmico antecipadamente:', error);
        }
        
        // Buscar um plano anual à vista para usar como referência (para plano_id válido)
        let planoAnualAvistaId = null;
        try {
          const todosPlanos = await apiService.obterPlanos();
          const planoAnualAvista = todosPlanos.find(p => 
            p.ativo && 
            p.tipo === 'unico' && 
            p.periodo === 'anual' &&
            (p.nome?.toLowerCase().includes('anual') || p.nome?.toLowerCase().includes('a vista'))
          );
          if (planoAnualAvista) {
            planoAnualAvistaId = planoAnualAvista.id;
            console.log('✅ Plano anual à vista encontrado para upgrade:', planoAnualAvista.id, planoAnualAvista.nome);
          }
        } catch (error) {
          console.error('Erro ao buscar plano anual à vista:', error);
        }
        
        // Criar um plano "virtual" para upgrade de recorrente para anual
        const planoUpgradeRecorrente: Plano = {
          id: planoAnualAvistaId || status.assinatura.plano_id || 999, // Usar plano anual à vista se encontrado
          nome: 'Upgrade para Plano Anual Completo',
          tipo: 'unico',
          valor: valorDinamicoCalculado, // Valor dinâmico calculado
          valor_parcelado: null,
          valor_total: null,
          periodo: 'anual',
          desconto_percentual: null,
          desconto_valor: null,
          mais_popular: false,
          mostrar_valor_total: false,
          mostrar_valor_parcelado: false,
          ativo: true,
          ordem: 1,
          beneficios: [],
          stripe_price_id: null, // Sem price_id para preço dinâmico
          frase_reforco: 'Valor calculado dinamicamente baseado nos seus pagamentos realizados'
        };
        setPlanos([planoUpgradeRecorrente]);
        setCarregando(null);
        return;
      }
      
      // Para usuários com plano único, carregar planos de upgrade normais
      // Buscar todos os planos sem filtros para ter acesso aos campos de visibilidade
      const planosCarregados = await apiService.obterPlanos();
      
      // Filtrar planos de upgrade:
      // - tipo 'unico' com período 'anual' OU
      // - tipo 'unico' que não aparece na LP nem no modal (planos de upgrade específicos) OU
      // - tipo 'unico' cujo nome contém "upgrade"
      const planosUpgrade: Plano[] = planosCarregados
        .filter(p => {
          if (!p.ativo || p.tipo !== 'unico' || !p.stripe_price_id) {
            return false;
          }
          
          const nomeLower = (p.nome || '').toLowerCase();
          const temUpgradeNoNome = nomeLower.includes('upgrade');
          const naoApareceEmLugarNenhum = p.mostrar_na_lp === false && p.mostrar_no_modal_assinatura === false;
          const periodoAnual = p.periodo === 'anual';
          
          return periodoAnual || naoApareceEmLugarNenhum || temUpgradeNoNome;
        });
      
      console.log('Planos de upgrade encontrados:', planosUpgrade.map(p => ({
        id: p.id,
        nome: p.nome,
        tipo: p.tipo,
        periodo: p.periodo,
        mostrar_na_lp: p.mostrar_na_lp,
        mostrar_no_modal_assinatura: p.mostrar_no_modal_assinatura
      })));
      
      const planosMapeados = planosUpgrade
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
      
      setPlanos(planosMapeados);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      await mostrarAlert('Erro', 'Erro ao carregar planos disponíveis.');
    } finally {
      setCarregando(null);
    }
  };

  const handlePlanoClick = async (plano: Plano) => {
    if (!userId) {
      await mostrarAlert('Erro', 'Usuário não identificado. Faça login novamente.');
      return;
    }
    
    // Se o usuário tem assinatura ativa, calcular valor dinâmico
    if (temAssinaturaAtiva) {
      try {
        setCarregando('calculando');
        const resultado = await apiService.calcularValorUpgrade();
        setValorDinamico(resultado.valor);
        console.log(`Valor dinâmico calculado: R$ ${resultado.valor} (${resultado.numeroPagamentos} pagamentos realizados)`);
        
        // Garantir que o plano_id seja válido (usar o da assinatura se disponível)
        const status = await apiService.verificarStatusPagamento();
        if (status.assinatura?.plano_id) {
          const planoComId: Plano = {
            ...plano,
            id: status.assinatura.plano_id,
            valor: resultado.valor // Atualizar valor com o calculado
          };
          setPlanoSelecionado(planoComId);
        } else {
          setPlanoSelecionado(plano);
        }
      } catch (error) {
        console.error('Erro ao calcular valor dinâmico:', error);
        await mostrarAlert('Erro', 'Erro ao calcular valor de upgrade. Tente novamente.');
        setCarregando(null);
        return;
      } finally {
        setCarregando(null);
      }
    } else {
      // Para acesso único, usar valor do plano
      setValorDinamico(null);
      setPlanoSelecionado(plano);
    }
  };

  const handleCheckoutSuccess = async () => {
    await mostrarAlert('Sucesso', 'Upgrade realizado com sucesso! Você agora tem acesso completo ao sistema.');
    setPlanoSelecionado(null);
    onClose(); // Fechar o modal antes de recarregar
    if (onPagamentoSucesso) {
      onPagamentoSucesso();
    }
    // Recarregar página após um tempo
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  const handleCheckoutError = async (error: string) => {
    await mostrarAlert('Erro', error);
  };

  const handleVoltar = () => {
    setPlanoSelecionado(null);
  };

  // Se não tem acesso único nem assinatura ativa, não mostrar o modal
  if (isOpen && !temAcessoUnico && !temAssinaturaAtiva && !carregando) {
    return null;
  }

  // Se um plano foi selecionado, mostrar checkout transparente
  if (planoSelecionado && userId) {
    // Se tem valor dinâmico (upgrade de assinatura), usar ele; senão, usar valor do plano
    let valorFinal: number;
    if (valorDinamico !== null) {
      valorFinal = valorDinamico;
    } else {
      const temDescontoPercentual = !!(planoSelecionado.desconto_percentual && planoSelecionado.desconto_percentual > 0);
      const temDescontoValor = !!(planoSelecionado.desconto_valor && planoSelecionado.desconto_valor > 0);
      valorFinal = temDescontoPercentual
        ? planoSelecionado.valor * (1 - (planoSelecionado.desconto_percentual || 0) / 100)
        : temDescontoValor
        ? planoSelecionado.valor - (planoSelecionado.desconto_valor || 0)
        : planoSelecionado.valor;
    }
    
    const valorEmCentavos = Math.round(valorFinal * 100);

    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Upgrade: ${planoSelecionado.nome}`}
        size="medium"
      >
        <div className="modal-upgrade-content">
          <div style={{ marginBottom: '1.5rem' }}>
            <button
              onClick={handleVoltar}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--cor-texto-secundario)',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}
            >
              ← Voltar para planos
            </button>
            
            <div style={{
              padding: '1rem',
              backgroundColor: 'var(--cor-secundaria)',
              borderRadius: '8px',
              marginBottom: '1rem',
              border: '1px solid var(--cor-borda)',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: 'var(--cor-texto)' }}>{planoSelecionado.nome}</h3>
              {valorDinamico !== null && (
                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: 'var(--cor-texto-secundario, #999)' }}>
                  Valor calculado dinamicamente baseado nos seus pagamentos
                </p>
              )}
              <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: '#FF6B35' }}>
                R$ {formatarValor(valorFinal)}
              </p>
            </div>
          </div>

          <Suspense fallback={<div style={{ textAlign: 'center', padding: '2rem' }}>Carregando formulário de pagamento...</div>}>
            <CheckoutTransparente
              amount={valorEmCentavos}
              userId={userId}
              planoId={planoSelecionado.id!}
              onSuccess={handleCheckoutSuccess}
              onError={handleCheckoutError}
            />
          </Suspense>
        </div>
      </Modal>
    );
  }

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
              backgroundColor: 'var(--cor-alerta-fundo, #fff3cd)',
              border: '1px solid var(--cor-alerta-borda, #ffc107)',
              borderRadius: '8px',
              color: 'var(--cor-alerta-texto, #856404)'
            }}>
              <strong style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', marginBottom: '0.5rem', color: 'var(--cor-alerta-texto, #856404)' }}>
                <FaExclamationTriangle /> {temAssinaturaAtiva ? 'Upgrade Disponível' : 'Upgrade Necessário'}
              </strong>
              {temAssinaturaAtiva ? (
                <>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--cor-alerta-texto, #856404)' }}>
                    Faça upgrade do seu <strong>Plano Anual Parcelado</strong> para o <strong>Plano Anual Completo</strong>.
                  </p>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--cor-alerta-texto, #856404)' }}>
                    Tenha acesso completo e ilimitado a todas as funcionalidades do sistema com um valor especial feito especialmente para você!
                  </p>
                </>
              ) : (
                <>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--cor-alerta-texto, #856404)' }}>
                    O <strong>Modo Cardápio</strong> e outras funcionalidades Beta estão disponíveis apenas para usuários do <strong>Plano Anual</strong>.
                  </p>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--cor-alerta-texto, #856404)' }}>
                    Faça upgrade agora e tenha acesso completo a todas as funcionalidades!
                  </p>
                </>
              )}
            </div>
          </div>

          {carregando === 'carregando' ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Carregando planos...</p>
          </div>
          ) : planos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p>Nenhum plano de upgrade disponível no momento.</p>
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
                            color: 'var(--cor-texto-secundario)',
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
                      padding: '0.75rem',
                      backgroundColor: 'rgba(255, 107, 53, 0.1)',
                      border: '1px solid rgba(255, 107, 53, 0.3)',
                      borderRadius: '6px',
                      textAlign: 'center',
                      fontSize: '0.85rem',
                      color: 'var(--cor-texto, #333)'
                    }}>
                      <strong style={{ color: 'var(--cor-primaria, #FF6B35)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', width: '100%' }}>
                        <FaShieldAlt /> Garantia de 7 dias
                      </strong>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--cor-texto-secundario, #666)', fontWeight: 500 }}>
                        Não gostou? Reembolso total em até 7 dias
                      </p>
                    </div>
                    <button
                      className={`btn-plano ${plano.mais_popular ? 'btn-plano-anual' : 'btn-plano-unico'}`}
                      onClick={() => handlePlanoClick(plano)}
                      disabled={!!carregando}
                    >
                      {carregando ? 'Processando...' : 'Fazer Upgrade'}
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
