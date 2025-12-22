import Modal from './Modal';
import PoliticaPrivacidadeContent from './PoliticaPrivacidadeContent';
import './ModalPoliticaPrivacidade.css';

interface ModalPoliticaPrivacidadeProps {
  isOpen: boolean;
  onClose: () => void;
}

const ModalPoliticaPrivacidade = ({ isOpen, onClose }: ModalPoliticaPrivacidadeProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Política de Privacidade"
      size="large"
      footer={
        <button onClick={onClose} className="btn-primary">
          Fechar
        </button>
      }
    >
      <div className="modal-politica-privacidade-wrapper">
        <PoliticaPrivacidadeContent />
      </div>
    </Modal>
  );
};

export default ModalPoliticaPrivacidade;

