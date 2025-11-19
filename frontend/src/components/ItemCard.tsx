import { useState, useEffect } from 'react';
import type { Item } from '../types';
import { carregarPlataformas, calcularPrecoComPlataforma } from '../utils/plataformas';
import './ItemCard.css';

interface ItemCardProps {
  item: Item;
  isSelected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onDelete: (itemId: number) => void;
}

const ItemCard = ({ item, isSelected, onToggleSelect, onEdit, onDelete }: ItemCardProps) => {
  const [plataformas, setPlataformas] = useState(carregarPlataformas());
  const [showPlataformas, setShowPlataformas] = useState(false);

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

  const formatarValor = (valor: number) => {
    return valor.toFixed(2).replace('.', ',');
  };

  const precoBase = item.valorNovo || item.valor;

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
            <span className="valor-atual">R$ {formatarValor(item.valor)}</span>
            {item.valorNovo && (
              <span className="valor-novo">→ R$ {formatarValor(item.valorNovo)}</span>
            )}
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

