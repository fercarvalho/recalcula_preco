import { useState } from 'react';
import Modal from './Modal';
import './SelecaoCategoriaModal.css';

interface SelecaoCategoriaModalProps {
  isOpen: boolean;
  categorias: string[];
  onSelect: (categoria: string) => void;
  onClose: () => void;
}

const SelecaoCategoriaModal = ({ isOpen, categorias, onSelect, onClose }: SelecaoCategoriaModalProps) => {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Escolher Categoria"
      size="small"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
        </>
      }
    >
      <p>Selecione a categoria:</p>
      <div className="modal-categorias">
        {categorias.map((cat) => (
          <button
            key={cat}
            className={`btn-categoria-opcao ${selected === cat ? 'categoria-selecionada' : ''}`}
            onClick={() => {
              setSelected(cat);
              onSelect(cat);
            }}
          >
            {cat}
          </button>
        ))}
      </div>
    </Modal>
  );
};

export default SelecaoCategoriaModal;

