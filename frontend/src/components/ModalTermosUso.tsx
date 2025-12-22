import Modal from './Modal';
import TermosUsoContent from './TermosUsoContent';
import './ModalTermosUso.css';

interface ModalTermosUsoProps {
  isOpen: boolean;
  onClose: () => void;
}

const ModalTermosUso = ({ isOpen, onClose }: ModalTermosUsoProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Termos de Uso"
      size="large"
      footer={
        <button onClick={onClose} className="btn-primary">
          Fechar
        </button>
      }
    >
      <div className="modal-termos-uso-wrapper">
        <TermosUsoContent />
      </div>
    </Modal>
  );
};

export default ModalTermosUso;

