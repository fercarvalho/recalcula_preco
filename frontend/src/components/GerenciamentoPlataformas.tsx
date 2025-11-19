import { useState, useEffect } from 'react';
import Modal from './Modal';
import { mostrarAlert, mostrarConfirm } from '../utils/modals';
import { carregarPlataformas, type Plataforma } from '../utils/plataformas';
import './GerenciamentoPlataformas.css';

const PLATAFORMAS_STORAGE_KEY = 'calculadora_plataformas';

const salvarPlataformas = (plataformas: Plataforma[]) => {
  localStorage.setItem(PLATAFORMAS_STORAGE_KEY, JSON.stringify(plataformas));
  // Disparar evento customizado para atualizar outros componentes
  window.dispatchEvent(new CustomEvent('plataformas-updated', { detail: plataformas }));
};

interface GerenciamentoPlataformasProps {
  isOpen: boolean;
  onClose: () => void;
}

const GerenciamentoPlataformas = ({ isOpen, onClose }: GerenciamentoPlataformasProps) => {
  const [plataformas, setPlataformas] = useState<Plataforma[]>([]);
  const [editingPlataforma, setEditingPlataforma] = useState<Plataforma | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formNome, setFormNome] = useState('');
  const [formTaxa, setFormTaxa] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPlataformas(carregarPlataformas());
    }
  }, [isOpen]);

  const handleAdicionar = () => {
    setEditingPlataforma(null);
    setFormNome('');
    setFormTaxa('');
    setShowFormModal(true);
  };

  const handleEditar = (plataforma: Plataforma) => {
    setEditingPlataforma(plataforma);
    setFormNome(plataforma.nome);
    setFormTaxa(plataforma.taxa.toString());
    setShowFormModal(true);
  };

  const handleSalvarPlataforma = () => {
    if (!formNome.trim()) {
      mostrarAlert('Erro', 'O nome da plataforma é obrigatório.');
      return;
    }

    const taxa = parseFloat(formTaxa);
    if (isNaN(taxa) || taxa < 0 || taxa > 100) {
      mostrarAlert('Erro', 'A taxa deve ser um número entre 0 e 100.');
      return;
    }

    const novasPlataformas = [...plataformas];
    
    if (editingPlataforma) {
      const index = novasPlataformas.findIndex(p => p.id === editingPlataforma.id);
      if (index !== -1) {
        novasPlataformas[index] = { ...editingPlataforma, nome: formNome.trim(), taxa };
      }
    } else {
      const novoId = plataformas.length > 0 
        ? Math.max(...plataformas.map(p => p.id)) + 1 
        : 1;
      novasPlataformas.push({ id: novoId, nome: formNome.trim(), taxa });
    }

    setPlataformas(novasPlataformas);
    salvarPlataformas(novasPlataformas);
    setShowFormModal(false);
    setEditingPlataforma(null);
    mostrarAlert('Sucesso', `Plataforma ${editingPlataforma ? 'atualizada' : 'adicionada'} com sucesso!`);
  };

  const handleDeletar = async (plataforma: Plataforma) => {
    const confirmado = await mostrarConfirm(
      'Confirmar Exclusão',
      `Tem certeza que deseja deletar a plataforma "${plataforma.nome}"?`
    );

    if (confirmado) {
      const novasPlataformas = plataformas.filter(p => p.id !== plataforma.id);
      setPlataformas(novasPlataformas);
      salvarPlataformas(novasPlataformas);
      await mostrarAlert('Sucesso', 'Plataforma deletada com sucesso!');
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Gerenciar Plataformas"
        size="large"
        footer={
          <>
            <button onClick={onClose} className="btn-secondary">Fechar</button>
          </>
        }
      >
        <div className="admin-section">
          <h3><i className="fas fa-store"></i> Plataformas Cadastradas</h3>
          <div style={{ marginBottom: '20px' }}>
            <button onClick={handleAdicionar} className="btn-primary">
              <i className="fas fa-plus"></i> Adicionar Plataforma
            </button>
          </div>
          <div className="plataformas-container">
            {plataformas.length === 0 ? (
              <p style={{ color: '#666', fontStyle: 'italic' }}>
                Nenhuma plataforma cadastrada. Clique em "Adicionar Plataforma" para começar.
              </p>
            ) : (
              plataformas.map((plataforma) => (
                <div key={plataforma.id} className="plataforma-item">
                  <div className="plataforma-info">
                    <div className="plataforma-nome">{plataforma.nome}</div>
                    <div className="plataforma-taxa">Taxa: {plataforma.taxa.toFixed(2)}%</div>
                  </div>
                  <div className="plataforma-actions">
                    <button
                      onClick={() => handleEditar(plataforma)}
                      className="btn-editar-plataforma"
                    >
                      <i className="fas fa-edit"></i> Editar
                    </button>
                    <button
                      onClick={() => handleDeletar(plataforma)}
                      className="btn-excluir-plataforma"
                    >
                      <i className="fas fa-trash"></i> Excluir
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setEditingPlataforma(null);
        }}
        title={editingPlataforma ? 'Editar Plataforma' : 'Adicionar Plataforma'}
        size="small"
        footer={
          <>
            <button
              onClick={() => {
                setShowFormModal(false);
                setEditingPlataforma(null);
              }}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button onClick={handleSalvarPlataforma} className="btn-primary">
              Salvar
            </button>
          </>
        }
      >
        <div className="form-group">
          <label htmlFor="plataforma-nome">Nome da Plataforma:</label>
          <input
            type="text"
            id="plataforma-nome"
            className="form-input"
            value={formNome}
            onChange={(e) => setFormNome(e.target.value)}
            placeholder="Ex: iFood, Uber Eats, etc."
          />
        </div>
        <div className="form-group">
          <label htmlFor="plataforma-taxa">Taxa da Plataforma (%):</label>
          <input
            type="number"
            id="plataforma-taxa"
            className="form-input"
            step="0.01"
            min="0"
            max="100"
            value={formTaxa}
            onChange={(e) => setFormTaxa(e.target.value)}
            placeholder="0,00"
          />
          <small className="form-help">Percentual que a plataforma cobra sobre cada venda</small>
        </div>
      </Modal>
    </>
  );
};

export default GerenciamentoPlataformas;

