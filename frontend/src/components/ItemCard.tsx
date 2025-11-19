import { useState, useEffect, useRef } from 'react';
import type { Item } from '../types';
import { apiService } from '../services/api';
import { carregarPlataformas, calcularPrecoComPlataforma } from '../utils/plataformas';
import { mostrarAlert } from '../utils/modals';
import './ItemCard.css';

interface ItemCardProps {
  item: Item;
  isSelected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onDelete: (itemId: number) => void;
  onItemUpdated?: () => void;
}

const ItemCard = ({ item, isSelected, onToggleSelect, onEdit, onDelete, onItemUpdated }: ItemCardProps) => {
  const [plataformas, setPlataformas] = useState(carregarPlataformas());
  const [showPlataformas, setShowPlataformas] = useState(false);
  const [valor, setValor] = useState(item.valor.toString());
  const [salvando, setSalvando] = useState(false);
  const valorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Atualizar plataformas quando o componente montar
    setPlataformas(carregarPlataformas());
    
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
    setValor(item.valor.toString());
  }, [item.valor]);

  const formatarValor = (valor: number) => {
    return valor.toFixed(2).replace('.', ',');
  };

  const formatarValorInput = (valor: string) => {
    // Converter vírgula para ponto para o input
    return valor.replace(',', '.');
  };

  const salvarValor = async (novoValor: string) => {
    const valorNumerico = parseFloat(formatarValorInput(novoValor));
    
    if (isNaN(valorNumerico) || valorNumerico < 0) {
      // Valor inválido, restaurar
      setValor(item.valor.toString());
      return;
    }

    if (valorNumerico === item.valor) {
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
      setValor(item.valor.toString());
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

  const precoBase = item.valor;

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
                onChange={(e) => setValor(e.target.value)}
                onBlur={(e) => salvarValor(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  }
                }}
                disabled={salvando}
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
                }}
              >
                <i className={`fas fa-chevron-${showPlataformas ? 'up' : 'down'}`}></i>
                {' '}Preços por plataforma ({plataformas.length})
              </button>
              {showPlataformas && (
                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {plataformas.map((plataforma) => {
                    const precoComTaxa = calcularPrecoComPlataforma(precoBase, plataforma.taxa);
                    return (
                      <div key={plataforma.id} className="item-preco-plataforma">
                        <label>{plataforma.nome} ({plataforma.taxa.toFixed(2)}%):</label>
                        <span className="preco-plataforma-valor">R$ {formatarValor(precoComTaxa)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="item-actions">
          <span className="item-drag-handle" title="Arrastar para reordenar">
            <i className="fas fa-grip-vertical"></i>
          </span>
          <button onClick={onEdit} className="btn-edit">
            <i className="fas fa-edit"></i>
          </button>
          <button onClick={() => onDelete(item.id)} className="btn-delete">
            <i className="fas fa-trash"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemCard;

