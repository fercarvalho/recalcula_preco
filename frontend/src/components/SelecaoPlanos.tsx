import React, { useState, useEffect } from 'react';
import { FaCheck } from 'react-icons/fa';
import { apiService } from '../services/api';
import { mostrarAlert } from '../utils/modals';
import type { Plano } from './GerenciamentoPlanos';
import './SelecaoPlanos.css';

interface SelecaoPlanosProps {
  onPagamentoSucesso?: () => void;
}

export const SelecaoPlanos: React.FC<SelecaoPlanosProps> = ({ onPagamentoSucesso: _onPagamentoSucesso }) => {
  const [carregando, setCarregando] = useState<string | null>(null);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [statusPagamento, setStatusPagamento] = useState<{
    temAcesso: boolean;
    tipo: 'anual' | 'unico' | null;
  } | null>(null);

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
        setCarregando('anual');
        const { url } = await apiService.criarCheckoutAnual(plano.stripe_price_id || undefined);
        window.location.href = url;
      } else if (isUnico) {
        setCarregando('unico');
        const { url } = await apiService.criarCheckoutUnico(plano.stripe_price_id || undefined);
        window.location.href = url;
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
    </div>
  );
};

