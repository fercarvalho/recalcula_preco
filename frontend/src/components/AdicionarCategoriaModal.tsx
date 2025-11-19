import { useState } from 'react';
import Modal from './Modal';
import SelecionarIconeModal from './SelecionarIconeModal';
import { FaFolder } from 'react-icons/fa';
import * as FaIcons from 'react-icons/fa';
import './AdicionarCategoriaModal.css';

interface AdicionarCategoriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (nome: string, icone: string | null) => Promise<void>;
}

const AdicionarCategoriaModal = ({ isOpen, onClose, onSave }: AdicionarCategoriaModalProps) => {
  const [nome, setNome] = useState('');
  const [icone, setIcone] = useState<string | null>(null);
  const [showIconeModal, setShowIconeModal] = useState(false);

  const handleSalvar = async () => {
    if (!nome.trim()) {
      return;
    }
    await onSave(nome.trim(), icone);
    setNome('');
    setIcone(null);
    // Não fechar aqui - deixar o onSave no App.tsx fechar após o alert
  };

  const handleCancelar = () => {
    setNome('');
    setIcone(null);
    onClose();
  };

  const renderIcone = () => {
    if (!icone) {
      return <FaFolder />;
    }
    const IconComponent = (FaIcons as any)[icone];
    if (!IconComponent) {
      return <FaFolder />;
    }
    return <IconComponent />;
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleCancelar}
        title="Adicionar Categoria"
        size="medium"
        footer={
          <>
            <button onClick={handleCancelar} className="btn-secondary">
              Cancelar
            </button>
            <button onClick={handleSalvar} className="btn-primary" disabled={!nome.trim()}>
              Salvar
            </button>
          </>
        }
      >
        <div className="adicionar-categoria-form">
          <div className="form-group">
            <label htmlFor="categoria-nome">Nome da Categoria:</label>
            <input
              id="categoria-nome"
              type="text"
              className="form-input"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Bebidas, Lanches, Doces..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && nome.trim()) {
                  handleSalvar();
                }
              }}
            />
          </div>
          <div className="form-group">
            <label>Ícone da Categoria:</label>
            <button
              type="button"
              className="btn-selecionar-icone"
              onClick={() => setShowIconeModal(true)}
            >
              <span className="icone-preview">{renderIcone()}</span>
              <span className="icone-texto">
                {icone ? 'Alterar Ícone' : 'Selecionar Ícone'}
              </span>
            </button>
          </div>
        </div>
      </Modal>
      <SelecionarIconeModal
        isOpen={showIconeModal}
        iconeAtual={icone}
        onClose={() => setShowIconeModal(false)}
        onSelect={(iconeSelecionado) => {
          setIcone(iconeSelecionado);
          setShowIconeModal(false);
        }}
      />
    </>
  );
};

export default AdicionarCategoriaModal;

