import { useState, useEffect, useRef } from 'react';
import type { Item } from '../types';
import { sessionStorageService } from '../services/sessionStorage';
import { carregarPlataformasSync, calcularPrecoComPlataforma, carregarPlataformas } from '../utils/plataformasDemo';
import { mostrarAlert } from '../utils/modals';
import { FaChevronUp, FaChevronDown, FaEdit, FaTrash } from 'react-icons/fa';
import './ItemCard.css';

interface ItemCardDemoProps {
  item: Item;
  isSelected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onDelete: (itemId: number) => void;
  onItemUpdated?: () => void;
  temAcesso?: boolean;
  onAbrirModalPlanos?: () => void;
  temPlanoMasEmailNaoValidado?: boolean;
}

const ItemCardDemo = ({ item, isSelected, onToggleSelect, onEdit, onDelete, onItemUpdated, temAcesso = true, onAbrirModalPlanos, temPlanoMasEmailNaoValidado = false }: ItemCardDemoProps) => {
  const [plataformas, setPlataformas] = useState(carregarPlataformasSync());
  const [showPlataformas, setShowPlataformas] = useState(true);
  const valorExibido = item.valorNovo !== null && item.valorNovo !== undefined ? item.valorNovo : item.valor;
  const [valor, setValor] = useState(valorExibido.toString());
  const [salvando, setSalvando] = useState(false);
  const valorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Carregar plataformas
    carregarPlataformas().then(plataformas => {
      setPlataformas(plataformas);
    }).catch(() => {
      setPlataformas(carregarPlataformasSync());
    });
    
    // Ouvir atualizações de plataformas
    const handlePlataformasUpdated = (e: CustomEvent) => {
      setPlataformas(e.detail);
    };
    
    window.addEventListener('plataformas-updated', handlePlataformasUpdated as EventListener);
    
    return () => {
      window.removeEventListener('plataformas-updated', handlePlataformasUpdated as EventListener);
    };
  }, []);

  // Atualizar valor quando o item mudar
  useEffect(() => {
    const novoValorExibido = item.valorNovo !== null && item.valorNovo !== undefined ? item.valorNovo : item.valor;
    setValor(novoValorExibido.toString());
  }, [item.valor, item.valorNovo]);

  const formatarValor = (valor: number) => {
    return valor.toFixed(2).replace('.', ',');
  };

  const formatarValorInput = (valor: string) => {
    return valor.replace(',', '.');
  };

  const salvarValor = async (novoValor: string) => {
    if (!temAcesso) {
      onAbrirModalPlanos?.();
      const valorExibidoAtual = item.valorNovo !== null && item.valorNovo !== undefined ? item.valorNovo : item.valor;
      setValor(valorExibidoAtual.toString());
      return;
    }

    const valorNumerico = parseFloat(formatarValorInput(novoValor));
    
    if (isNaN(valorNumerico) || valorNumerico < 0) {
      const valorExibidoAtual = item.valorNovo !== null && item.valorNovo !== undefined ? item.valorNovo : item.valor;
      setValor(valorExibidoAtual.toString());
      return;
    }

    const valorAtualExibido = item.valorNovo !== null && item.valorNovo !== undefined ? item.valorNovo : item.valor;
    if (valorNumerico === valorAtualExibido) {
      return;
    }

    setSalvando(true);
    try {
      const nomeItem = item.nome || '';
      sessionStorageService.atualizarItem(item.id, { nome: nomeItem, valor: valorNumerico });
      
      if (item.valorNovo !== undefined && item.valorNovo !== null) {
        sessionStorageService.atualizarValorNovo(item.id, null);
      }
      
      if (valorInputRef.current) {
        valorInputRef.current.style.borderColor = '#28a745';
        setTimeout(() => {
          if (valorInputRef.current) {
            valorInputRef.current.style.borderColor = '#ddd';
          }
        }, 1000);
      }
      
      if (onItemUpdated) {
        onItemUpdated();
      }
    } catch (error: any) {
      console.error('Erro ao salvar valor:', error);
      const valorExibidoAtual = item.valorNovo !== null && item.valorNovo !== undefined ? item.valorNovo : item.valor;
      setValor(valorExibidoAtual.toString());
      if (valorInputRef.current) {
        valorInputRef.current.style.borderColor = '#dc3545';
        setTimeout(() => {
          if (valorInputRef.current) {
            valorInputRef.current.style.borderColor = '#ddd';
          }
        }, 1000);
      }
      await mostrarAlert('Erro', error.message || 'Erro ao salvar o valor. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const precoBase = item.valorNovo !== null && item.valorNovo !== undefined ? item.valorNovo : item.valor;

  return (
    <div className={`item-card ${isSelected ? 'selected' : ''}`}>
      <div className="item-checkbox">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
        />
      </div>
      <div className="item-content">
        <div className="item-info">
          <h4>{item.nome}</h4>
          <div className="item-valores">
            <span className="valor-atual">
              R$ <input
                ref={valorInputRef}
                type="number"
                step="0.01"
                min="0"
                className="item-valor-input"
                value={valor}
                onChange={(e) => {
                  if (temAcesso) {
                    setValor(e.target.value);
                  } else {
                    onAbrirModalPlanos?.();
                  }
                }}
                onBlur={(e) => salvarValor(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  }
                }}
                disabled={salvando || !temAcesso}
                title={!temAcesso ? 'Clique para liberar acesso e editar preços' : ''}
                style={!temAcesso ? { cursor: 'not-allowed', opacity: 0.6 } : {}}
              />
            </span>
          </div>
          {plataformas.length > 0 && (
            <div className="item-precos-plataformas">
              <button
                onClick={() => setShowPlataformas(!showPlataformas)}
                className="btn-toggle-plataformas"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#17a2b8',
                  cursor: 'pointer',
                  fontSize: '0.85em',
                  padding: '5px 0',
                  textDecoration: 'underline',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  wordBreak: 'break-word',
                  whiteSpace: 'normal',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                {showPlataformas ? <FaChevronUp /> : <FaChevronDown />}
                {' '}Preços por plataforma ({plataformas.length})
              </button>
              {showPlataformas && (
                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {temAcesso ? (
                    plataformas.map((plataforma) => {
                      const precoComTaxa = calcularPrecoComPlataforma(precoBase, plataforma.taxa);
                      return (
                        <div key={plataforma.id} className="item-preco-plataforma">
                          <label>{plataforma.nome} ({plataforma.taxa.toFixed(2)}%):</label>
                          <span className="preco-plataforma-valor">R$ {formatarValor(precoComTaxa)}</span>
                        </div>
                      );
                    })
                  ) : (
                    !temPlanoMasEmailNaoValidado && (
                      <div style={{
                        padding: '15px',
                        background: '#fff3cd',
                        border: '2px solid #ffc107',
                        borderRadius: '8px',
                        textAlign: 'center',
                      }}>
                        <p style={{ margin: '0 0 10px 0', color: '#856404', fontWeight: '600' }}>
                          Acesso aos preços bloqueado
                        </p>
                        <button
                          onClick={() => onAbrirModalPlanos?.()}
                          style={{
                            background: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.95em',
                            fontWeight: 'bold',
                          }}
                        >
                          Clique para liberar acesso
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="item-actions">
          <button onClick={onEdit} className="btn-edit">
            <FaEdit />
          </button>
          <button onClick={() => onDelete(item.id)} className="btn-delete">
            <FaTrash />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemCardDemo;

