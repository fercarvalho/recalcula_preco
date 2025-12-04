import { useState, useEffect } from 'react';
import { FaQuestionCircle, FaPlus, FaEdit, FaTrash, FaSave, FaGripVertical } from 'react-icons/fa';
import Modal from './Modal';
import { mostrarAlert, mostrarConfirm } from '../utils/modals';
import { apiService } from '../services/api';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import './GerenciamentoFAQ.css';

export interface FAQ {
  id: number | string;
  pergunta: string;
  resposta: string;
  ordem?: number;
}

interface GerenciamentoFAQProps {
  isOpen: boolean;
  onClose: () => void;
}

const GerenciamentoFAQ = ({ isOpen, onClose }: GerenciamentoFAQProps) => {
  const [faq, setFAQ] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModalFAQ, setShowModalFAQ] = useState(false);
  const [faqEditando, setFAQEditando] = useState<FAQ | null>(null);
  
  // Garantir que todas as perguntas tenham ID para o drag and drop
  const faqComIds = faq.map((p, index) => ({
    ...p,
    id: p.id || index
  }));

  useEffect(() => {
    if (isOpen) {
      carregarFAQ();
    }
  }, [isOpen]);

  const carregarFAQ = async () => {
    try {
      setLoading(true);
      const faqCarregado = await apiService.obterFAQAdmin();
      setFAQ(faqCarregado);
    } catch (error) {
      console.error('Erro ao carregar FAQ:', error);
      await mostrarAlert('Erro', 'Erro ao carregar FAQ. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletar = async (pergunta: FAQ) => {
    if (!pergunta.id || typeof pergunta.id === 'string') return;

    const confirmado = await mostrarConfirm(
      'Confirmar Exclusão',
      `Tem certeza que deseja deletar a pergunta "${pergunta.pergunta}"?`
    );

    if (!confirmado) return;

    try {
      await apiService.deletarFAQ(pergunta.id);
      await carregarFAQ();

      // Disparar evento para atualizar o FAQ na landing page
      window.dispatchEvent(new CustomEvent('faq-updated'));

      await mostrarAlert('Sucesso', 'Pergunta deletada com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar FAQ:', error);
      await mostrarAlert('Erro', 'Erro ao deletar pergunta. Tente novamente.');
    }
  };

  const handleEditar = (pergunta: FAQ) => {
    setFAQEditando(pergunta);
    setShowModalFAQ(true);
  };

  const handleAdicionar = () => {
    setFAQEditando(null);
    setShowModalFAQ(true);
  };

  // Drag and drop para reordenar perguntas FAQ
  const handleReorderFAQ = async (novasPerguntas: FAQ[]) => {
    // Atualizar localmente primeiro para feedback imediato
    setFAQ(novasPerguntas);
    
    try {
      console.log('handleReorderFAQ chamado com:', novasPerguntas);
      
      const faqIds = novasPerguntas
        .map(p => p.id)
        .filter((id): id is number => {
          // Filtrar apenas IDs numéricos (não temporários)
          if (id === undefined || id === null) return false;
          if (typeof id === 'string') return false; // IDs temporários são strings
          const numId = typeof id === 'string' ? parseInt(id, 10) : id;
          const isValid = !isNaN(numId);
          if (!isValid) {
            console.warn('ID inválido filtrado:', id);
          }
          return isValid;
        })
        .map(id => {
          const numId = typeof id === 'string' ? parseInt(id, 10) : id;
          console.log('ID convertido:', id, '->', numId);
          return numId;
        });
      
      console.log('IDs finais para enviar:', faqIds);
      
      if (faqIds.length === 0) {
        throw new Error('Nenhum ID de FAQ válido encontrado');
      }
      
      if (faqIds.length !== novasPerguntas.length) {
        console.warn(`Aviso: ${novasPerguntas.length - faqIds.length} perguntas foram filtradas por terem IDs inválidos`);
      }
      
      await apiService.atualizarOrdemFAQ(faqIds);
      
      // Disparar evento para atualizar o FAQ na landing page
      window.dispatchEvent(new CustomEvent('faq-updated'));
    } catch (error) {
      console.error('Erro ao atualizar ordem das perguntas FAQ:', error);
      await mostrarAlert('Erro', 'Erro ao atualizar ordem das perguntas FAQ. Tente novamente.');
      // Recarregar FAQ em caso de erro
      await carregarFAQ();
    }
  };

  const {
    handleDragStart: handleDragStartFAQ,
    handleDragEnd: handleDragEndFAQ,
    handleDragOver: handleDragOverFAQ,
    handleDrop: handleDropFAQ,
    handleDragLeave: handleDragLeaveFAQ,
  } = useDragAndDrop(faqComIds, handleReorderFAQ);

  if (!isOpen) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Gerenciamento de FAQ"
        size="large"
        className="modal-nested"
        footer={
          <>
            <button onClick={onClose} className="btn-secondary">
              Fechar
            </button>
            <button onClick={handleAdicionar} className="btn-primary">
              <FaPlus /> Adicionar Pergunta
            </button>
          </>
        }
      >
        <div className="faq-container gerenciamento-faq">
          {loading && faq.length === 0 ? (
            <div className="loading">Carregando...</div>
          ) : faq.length === 0 ? (
            <div className="empty-state">
              <p>Nenhuma pergunta cadastrada. Clique em "Adicionar Pergunta" para começar.</p>
            </div>
          ) : (
            <div className="faq-list gerenciamento-faq-list">
              {faqComIds.map((pergunta) => {
                const faqId = pergunta.id;
                return (
                <div
                  key={faqId}
                  className="faq-item gerenciamento-faq-item"
                  draggable
                  onDragStart={(e) => handleDragStartFAQ(e, faqId, 'item')}
                  onDragEnd={handleDragEndFAQ}
                  onDragOver={(e) => handleDragOverFAQ(e, faqId)}
                  onDrop={(e) => handleDropFAQ(e, faqId)}
                  onDragLeave={handleDragLeaveFAQ}
                >
                  <div className="faq-drag-handle">
                    <FaGripVertical />
                  </div>
                  <div className="faq-content">
                    <div className="faq-pergunta">
                      <strong>{pergunta.pergunta}</strong>
                    </div>
                    <div className="faq-resposta">
                      {pergunta.resposta}
                    </div>
                  </div>
                  <div className="faq-actions">
                    <button
                      type="button"
                      onClick={() => handleEditar(pergunta)}
                      className="btn-edit-faq"
                      title="Editar"
                    >
                      <FaEdit />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletar(pergunta)}
                      className="btn-delete-faq"
                      title="Excluir"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {showModalFAQ && (
        <ModalFAQ
          faq={faqEditando}
          onClose={() => {
            setShowModalFAQ(false);
            setFAQEditando(null);
          }}
          onSave={async () => {
            await carregarFAQ();
            setShowModalFAQ(false);
            setFAQEditando(null);
          }}
        />
      )}
    </>
  );
};

interface ModalFAQProps {
  faq: FAQ | null;
  onClose: () => void;
  onSave: () => Promise<void>;
}

const ModalFAQ = ({ faq, onClose, onSave }: ModalFAQProps) => {
  const [pergunta, setPergunta] = useState(faq?.pergunta || '');
  const [resposta, setResposta] = useState(faq?.resposta || '');
  const [loading, setLoading] = useState(false);

  const handleSalvar = async () => {
    if (!pergunta.trim()) {
      await mostrarAlert('Erro', 'A pergunta é obrigatória.');
      return;
    }

    if (!resposta.trim()) {
      await mostrarAlert('Erro', 'A resposta é obrigatória.');
      return;
    }

    setLoading(true);
    try {
      if (faq?.id) {
        await apiService.atualizarFAQ(faq.id, pergunta.trim(), resposta.trim());
        await mostrarAlert('Sucesso', 'Pergunta atualizada com sucesso!');
      } else {
        await apiService.criarFAQ(pergunta.trim(), resposta.trim());
        await mostrarAlert('Sucesso', 'Pergunta criada com sucesso!');
      }

      // Disparar evento para atualizar o FAQ na landing page
      window.dispatchEvent(new CustomEvent('faq-updated'));

      await onSave();
    } catch (error) {
      console.error('Erro ao salvar FAQ:', error);
      await mostrarAlert('Erro', 'Erro ao salvar pergunta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={faq ? 'Editar Pergunta FAQ' : 'Adicionar Nova Pergunta FAQ'}
      size="medium"
      className="modal-nested"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary" disabled={loading}>
            Cancelar
          </button>
          <button onClick={handleSalvar} className="btn-primary" disabled={loading}>
            <FaSave /> {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </>
      }
    >
      <div className="faq-form">
        <div className="form-group">
          <label htmlFor="faq-pergunta">
            Pergunta <span className="required">*</span>:
          </label>
          <input
            type="text"
            id="faq-pergunta"
            value={pergunta}
            onChange={(e) => setPergunta(e.target.value)}
            className="form-input"
            placeholder="Ex: O que é a Recalcula Preço?"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="faq-resposta">
            Resposta <span className="required">*</span>:
          </label>
          <textarea
            id="faq-resposta"
            value={resposta}
            onChange={(e) => setResposta(e.target.value)}
            className="form-textarea"
            placeholder="Digite a resposta para a pergunta..."
            rows={6}
            disabled={loading}
          />
        </div>
      </div>
    </Modal>
  );
};

export default GerenciamentoFAQ;
