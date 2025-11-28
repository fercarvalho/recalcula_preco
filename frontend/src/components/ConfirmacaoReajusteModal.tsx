import Modal from './Modal';
import type { Item } from '../types';
import './ConfirmacaoReajusteModal.css';

interface ConfirmacaoReajusteModalProps {
  isOpen: boolean;
  tipoReajuste: 'fixo' | 'percentual';
  valorReajuste: number;
  itens: Item[];
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmacaoReajusteModal = ({
  isOpen,
  tipoReajuste,
  valorReajuste,
  itens,
  onConfirm,
  onCancel,
}: ConfirmacaoReajusteModalProps) => {
  const formatarValor = (valor: number) => {
    return valor.toFixed(2).replace('.', ',');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title="Confirmar Reajuste"
      size="medium"
      footer={
        <>
          <button onClick={onCancel} className="btn-secondary">Cancelar</button>
          <button onClick={onConfirm} className="btn-primary">Confirmar</button>
        </>
      }
    >
      <div className="modal-info">
        {tipoReajuste === 'fixo' ? (
          <p>
            <strong>Valor Fixo:</strong> R$ {formatarValor(valorReajuste)}
          </p>
        ) : (
          <p>
            <strong>Percentual:</strong> {formatarValor(valorReajuste)}%
          </p>
        )}
      </div>
      <p className="modal-subtitle">Itens que serão reajustados:</p>
      <div className="modal-itens">
        {itens.map((item) => {
          // Usar valorNovo como base se existir, caso contrário usar valor
          const valorBase = item.valorNovo !== null && item.valorNovo !== undefined ? item.valorNovo : item.valor;
          const novoValor = tipoReajuste === 'fixo' 
            ? valorBase + valorReajuste 
            : valorBase * (1 + valorReajuste / 100);
          
          return (
            <div key={item.id} className="modal-item">
              <div className="modal-item-info">
                <div className="modal-item-nome">{item.nome}</div>
                <div className="modal-item-valores">
                  <span className="modal-item-valor-antigo">
                    R$ {formatarValor(valorBase)}
                  </span>
                  <span className="modal-item-valor-novo">
                    → R$ {formatarValor(novoValor)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
};

export default ConfirmacaoReajusteModal;

