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

  // Debug: verificar estado de carregando
  useEffect(() => {
    console.log('Estado carregando:', carregando);
  }, [carregando]);

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
        beneficios: p.beneficios
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
        const { url } = await apiService.criarCheckoutAnual();
        window.location.href = url;
      } else if (isUnico) {
        setCarregando('unico');
        const { url } = await apiService.criarCheckoutUnico();
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
      </div>

      <div className="planos-grid">
        {planos.length === 0 ? (
          <div>Carregando planos...</div>
        ) : (
          planos.map((plano) => {
            console.log(`Mapeando plano: ${plano.nome}, tipo: "${plano.tipo}", tipo === 'recorrente': ${plano.tipo === 'recorrente'}, typeof: ${typeof plano.tipo}`);
            const temDescontoPercentual = !!(plano.desconto_percentual && plano.desconto_percentual > 0);
            const temDescontoValor = !!(plano.desconto_valor && plano.desconto_valor > 0);
            const temDesconto = temDescontoPercentual || temDescontoValor;
            
            // Calcular valor a exibir
            let valorExibir = plano.valor;
            if (plano.tipo === 'parcelado' && plano.mostrar_valor_parcelado && plano.valor_parcelado) {
              valorExibir = plano.valor_parcelado;
            } else if (plano.tipo === 'recorrente' && plano.mostrar_valor_total && plano.valor_total) {
              valorExibir = plano.valor_total;
            }

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
                    <span className="preco-valor">R$ {formatarValor(valorExibir)}</span>
                    <span className="preco-periodo">
                      {formatarPeriodo(plano.tipo, plano.periodo, plano.valor_parcelado)}
                    </span>
                  </div>
                  {plano.periodo && plano.tipo === 'unico' && (
                    <p className="plano-descricao">Acesso por {plano.periodo}</p>
                  )}
                  {plano.tipo === 'recorrente' && (
                    <p className="plano-descricao">Acesso completo por 12 meses</p>
                  )}
                </div>
                <ul className="plano-beneficios">
                  {plano.beneficios && plano.beneficios.map((beneficio, index) => {
                    const texto = typeof beneficio === 'string' ? beneficio : beneficio.texto;
                    const ehAviso = typeof beneficio === 'string'
                      ? texto.startsWith('⚠️')
                      : (beneficio.eh_aviso || false);
                    const textoLimpo = typeof beneficio === 'string' && texto.startsWith('⚠️')
                      ? texto.substring(1).trim()
                      : texto;
                    return (
                      <li
                        key={typeof beneficio === 'string' ? index : (beneficio.id || index)}
                        className={ehAviso ? 'texto-aviso' : ''}
                      >
                        {ehAviso ? (
                          <>⚠️ {textoLimpo}</>
                        ) : (
                          <><FaCheck /> {textoLimpo}</>
                        )}
                      </li>
                    );
                  })}
                </ul>
                <button
                  className={`btn-plano ${plano.mais_popular ? 'btn-plano-anual' : 'btn-plano-unico'}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Botão clicado:', plano.nome, 'Tipo:', plano.tipo, 'Carregando:', carregando);
                    if (!carregando) {
                      handlePlanoClick(plano);
                    }
                  }}
                  disabled={(() => {
                    // Detectar tipo de plano de forma mais robusta
                    const nomeLower = (plano.nome || '').toLowerCase();
                    const tipoLower = (plano.tipo || '').toLowerCase();
                    const isRecorrente = tipoLower === 'recorrente' || nomeLower.includes('anual');
                    const isUnico = tipoLower === 'unico' || nomeLower.includes('único') || nomeLower.includes('unico');
                    
                    const loadingType = isRecorrente ? 'anual' : (isUnico ? 'unico' : null);
                    const isDisabled = carregando === loadingType;
                    
                    console.log(`Plano ${plano.nome}: tipo="${plano.tipo}", isRecorrente=${isRecorrente}, loadingType=${loadingType}, carregando=${carregando}, disabled=${isDisabled}`);
                    return isDisabled;
                  })()}
                  style={{ pointerEvents: 'auto', cursor: 'pointer' }}
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

