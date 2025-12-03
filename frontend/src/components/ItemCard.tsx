import { useState, useEffect, useRef } from 'react';
import type { Item } from '../types';
import { apiService } from '../services/api';
import { carregarPlataformasSync, calcularPrecoComPlataforma, carregarPlataformas } from '../utils/plataformas';
import { mostrarAlert } from '../utils/modals';
import { FaChevronUp, FaChevronDown, FaGripVertical, FaEdit, FaTrash } from 'react-icons/fa';
import './ItemCard.css';

interface ItemCardProps {
  item: Item;
  isSelected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onDelete: (itemId: number) => void;
  onItemUpdated?: () => void;
  temAcesso?: boolean;
  onAbrirModalPlanos?: () => void;
}

import { getUser } from '../services/auth';

const ItemCard = ({ item, isSelected, onToggleSelect, onEdit, onDelete, onItemUpdated, temAcesso = true, onAbrirModalPlanos }: ItemCardProps) => {
  const user = getUser();
  const userId = user?.id;
  const [plataformas, setPlataformas] = useState(carregarPlataformasSync(userId));
  const [showPlataformas, setShowPlataformas] = useState(true);
  // Usar valorNovo se disponível, caso contrário usar valor
  const valorExibido = item.valorNovo !== null && item.valorNovo !== undefined ? item.valorNovo : item.valor;
  const [valor, setValor] = useState(valorExibido.toString());
  const [salvando, setSalvando] = useState(false);
  const valorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Carregar plataformas da API quando o componente montar
    if (userId) {
      carregarPlataformas(userId).then(plataformas => {
        setPlataformas(plataformas);
      }).catch(() => {
        // Em caso de erro, usar versão síncrona (localStorage)
        setPlataformas(carregarPlataformasSync(userId));
      });
    }
    
    // Ouvir atualizações de plataformas
    const handlePlataformasUpdated = (e: CustomEvent) => {
      setPlataformas(e.detail);
    };
    
    window.addEventListener('plataformas-updated', handlePlataformasUpdated as EventListener);
    
    return () => {
      window.removeEventListener('plataformas-updated', handlePlataformasUpdated as EventListener);
    };
  }, [userId]);

  // Atualizar valor quando o item mudar (usar valorNovo se disponível)
  useEffect(() => {
    const novoValorExibido = item.valorNovo !== null && item.valorNovo !== undefined ? item.valorNovo : item.valor;
    setValor(novoValorExibido.toString());
  }, [item.valor, item.valorNovo]);

  const formatarValor = (valor: number) => {
    return valor.toFixed(2).replace('.', ',');
  };

  const formatarValorInput = (valor: string) => {
    // Converter vírgula para ponto para o input
    return valor.replace(',', '.');
  };

  const salvarValor = async (novoValor: string) => {
    // Verificar se tem acesso antes de salvar
    if (!temAcesso) {
      onAbrirModalPlanos?.();
      // Restaurar valor exibido
      const valorExibidoAtual = item.valorNovo !== null && item.valorNovo !== undefined ? item.valorNovo : item.valor;
      setValor(valorExibidoAtual.toString());
      return;
    }

    const valorNumerico = parseFloat(formatarValorInput(novoValor));
    
      if (isNaN(valorNumerico) || valorNumerico < 0) {
      // Valor inválido, restaurar
      const valorExibidoAtual = item.valorNovo !== null && item.valorNovo !== undefined ? item.valorNovo : item.valor;
      setValor(valorExibidoAtual.toString());
      return;
    }

    // Comparar com o valor exibido (valorNovo ou valor)
    const valorAtualExibido = item.valorNovo !== null && item.valorNovo !== undefined ? item.valorNovo : item.valor;
    if (valorNumerico === valorAtualExibido) {
      // Valor não mudou, não precisa salvar
      return;
    }

    setSalvando(true);
    try {
      console.log('Salvando valor:', { id: item.id, nome: item.nome, valor: valorNumerico });
      
      // Atualizar apenas o valor, mantendo nome (categoria não precisa ser passada)
      // Garantir que nome não seja undefined
      const nomeItem = item.nome || '';
      await apiService.atualizarItem(item.id, nomeItem, valorNumerico);
      
      // Se havia valor novo, limpar ele
      if (item.valorNovo !== undefined && item.valorNovo !== null) {
        await apiService.atualizarValorNovo(item.id, null);
      }
      
      // Feedback visual
      if (valorInputRef.current) {
        valorInputRef.current.style.borderColor = '#28a745';
        setTimeout(() => {
          if (valorInputRef.current) {
            valorInputRef.current.style.borderColor = '#ddd';
          }
        }, 1000);
      }
      
      // Atualizar lista
      if (onItemUpdated) {
        onItemUpdated();
      }
    } catch (error: any) {
      console.error('Erro ao salvar valor:', error);
      console.error('Detalhes do erro:', error.response?.data || error.message);
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
      const mensagemErro = error.response?.data?.error || error.message || 'Erro ao salvar o valor. Tente novamente.';
      await mostrarAlert('Erro', mensagemErro);
    } finally {
      setSalvando(false);
    }
  };

  // Usar valorNovo se disponível para cálculos de plataformas
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
              {!temAcesso && (
                <span style={{
                  fontSize: '0.75em',
                  color: '#ffc107',
                  marginLeft: '5px',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }} onClick={() => onAbrirModalPlanos?.()} title="Clique para liberar acesso">
                  🔒
                </span>
              )}
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
                    <div style={{
                      padding: '15px',
                      background: '#fff3cd',
                      border: '2px solid #ffc107',
                      borderRadius: '8px',
                      textAlign: 'center',
                    }}>
                      <p style={{ margin: '0 0 10px 0', color: '#856404', fontWeight: '600' }}>
                        🔒 Acesso aos preços bloqueado
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
                          transition: 'all 0.3s',
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = '#45a049';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = '#4CAF50';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        Clique para liberar acesso
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
            <div className="item-actions">
              <span className="item-drag-handle" title="Arrastar para reordenar">
                <FaGripVertical />
              </span>
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

export default ItemCard;

