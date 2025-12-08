import Modal from './Modal';
import './ModalUpgrade.css';

interface ModalUpgradeProps {
  isOpen: boolean;
  onClose: () => void;
}

const ModalUpgrade = ({ isOpen, onClose }: ModalUpgradeProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upgrade para Plano Anual"
      size="medium"
    >
      <div className="modal-upgrade-content">
        <p>Conteúdo do modal de upgrade será adicionado em breve.</p>
      </div>
    </Modal>
  );
};

export default ModalUpgrade;

