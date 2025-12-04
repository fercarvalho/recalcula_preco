import { useState, useEffect } from 'react';
import { FaLink, FaPlus, FaEdit, FaTrash, FaSave, FaGripVertical } from 'react-icons/fa';
import Modal from './Modal';
import { mostrarAlert, mostrarConfirm, mostrarPrompt } from '../utils/modals';
import { apiService } from '../services/api';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import './GerenciamentoRodape.css';

export interface RodapeLink {
  id: number | string;
  texto: string;
  link: string;
  coluna: string;
  ordem?: number;
}

interface GerenciamentoRodapeProps {
  isOpen: boolean;
  onClose: () => void;
}

const GerenciamentoRodape = ({ isOpen, onClose }: GerenciamentoRodapeProps) => {
  const [links, setLinks] = useState<RodapeLink[]>([]);
  const [colunas, setColunas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModalLink, setShowModalLink] = useState(false);
  const [linkEditando, setLinkEditando] = useState<RodapeLink | null>(null);
  const [colunaSelecionada, setColunaSelecionada] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      carregarDados();
    }
  }, [isOpen]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [linksCarregados, colunasCarregadas] = await Promise.all([
        apiService.obterRodapeLinksAdmin(),
        apiService.obterColunasRodape()
      ]);
      
      // Garantir que todas as links tenham ID
      const linksComIds = linksCarregados.map((p, index) => ({
        ...p,
        id: p.id || index
      }));
      
      setLinks(linksComIds);
      setColunas(colunasCarregadas);
    } catch (error) {
      console.error('Erro ao carregar dados do rodapé:', error);
      await mostrarAlert('Erro', 'Erro ao carregar dados do rodapé. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Garantir que todas as links tenham ID para o drag and drop
  const linksComIds = links.map((p, index) => ({
    ...p,
    id: p.id || index
  }));

  const handleDeletar = async (link: RodapeLink) => {
    if (!link.id || typeof link.id === 'string') return;

    const confirmado = await mostrarConfirm(
      'Confirmar Exclusão',
      `Tem certeza que deseja deletar o link "${link.texto}"?`
    );

    if (!confirmado) return;

    try {
      await apiService.deletarRodapeLink(link.id);
      await carregarDados();

      // Disparar evento para atualizar o rodapé na landing page
      window.dispatchEvent(new CustomEvent('rodape-updated'));

      await mostrarAlert('Sucesso', 'Link deletado com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar link:', error);
      await mostrarAlert('Erro', 'Erro ao deletar link. Tente novamente.');
    }
  };

  const handleEditar = (link: RodapeLink) => {
    setLinkEditando(link);
    setColunaSelecionada(link.coluna);
    setShowModalLink(true);
  };

  const handleAdicionar = (coluna?: string) => {
    setLinkEditando(null);
    setColunaSelecionada(coluna || (colunas.length > 0 ? colunas[0] : ''));
    setShowModalLink(true);
  };

  const handleAdicionarColuna = async () => {
    const nomeColuna = await mostrarPrompt('Nova Coluna', 'Digite o nome da nova coluna:');
    if (!nomeColuna || !nomeColuna.trim()) return;

    const novaColuna = nomeColuna.trim();
    if (colunas.includes(novaColuna)) {
      await mostrarAlert('Erro', 'Esta coluna já existe!');
      return;
    }

    // A coluna será criada automaticamente quando o primeiro link for adicionado
    setColunas([...colunas, novaColuna]);
    handleAdicionar(novaColuna);
  };

  // Drag and drop para reordenar links do rodapé (todos os links juntos, mas ordenados por coluna)
  const handleReorderLinks = async (novosLinks: RodapeLink[]) => {
    // Atualizar localmente primeiro para feedback imediato
    setLinks(novosLinks);
    
    try {
      console.log('handleReorderLinks chamado com:', novosLinks);
      
      const linkIds = novosLinks
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
      
      console.log('IDs finais para enviar:', linkIds);
      
      if (linkIds.length === 0) {
        throw new Error('Nenhum ID de link válido encontrado');
      }
      
      if (linkIds.length !== novosLinks.length) {
        console.warn(`Aviso: ${novosLinks.length - linkIds.length} links foram filtrados por terem IDs inválidos`);
      }
      
      await apiService.atualizarOrdemRodapeLinks(linkIds);
      
      // Disparar evento para atualizar o rodapé na landing page
      window.dispatchEvent(new CustomEvent('rodape-updated'));
    } catch (error) {
      console.error('Erro ao atualizar ordem dos links:', error);
      await mostrarAlert('Erro', 'Erro ao atualizar ordem dos links. Tente novamente.');
      // Recarregar links em caso de erro
      await carregarDados();
    }
  };

  const {
    handleDragStart: handleDragStartLink,
    handleDragEnd: handleDragEndLink,
    handleDragOver: handleDragOverLink,
    handleDrop: handleDropLink,
    handleDragLeave: handleDragLeaveLink,
  } = useDragAndDrop(linksComIds, handleReorderLinks);

  // Agrupar links por coluna
  const linksPorColuna = colunas.reduce((acc, coluna) => {
    acc[coluna] = linksComIds
      .filter(link => link.coluna === coluna)
      .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
    return acc;
  }, {} as Record<string, RodapeLink[]>);

  if (!isOpen) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Gerenciamento de Rodapé"
        size="large"
        className="modal-nested"
        footer={
          <>
            <button onClick={onClose} className="btn-secondary">
              Fechar
            </button>
            <button onClick={handleAdicionarColuna} className="btn-secondary">
              <FaPlus /> Adicionar Coluna
            </button>
            <button onClick={() => handleAdicionar()} className="btn-primary">
              <FaPlus /> Adicionar Link
            </button>
          </>
        }
      >
        <div className="gerenciamento-rodape-container">
          {loading && links.length === 0 ? (
            <div className="loading">Carregando...</div>
          ) : (
            <>
              {colunas.length === 0 ? (
                <div className="empty-state">
                  <p>Nenhuma coluna encontrada. Adicione uma coluna para começar.</p>
                </div>
              ) : (
                <div className="rodape-colunas">
                  {colunas.map((coluna) => (
                    <div key={coluna} className="rodape-coluna">
                      <div className="rodape-coluna-header">
                        <h3>{coluna}</h3>
                        <button
                          onClick={() => handleAdicionar(coluna)}
                          className="btn-add-link-coluna"
                          title="Adicionar link nesta coluna"
                        >
                          <FaPlus />
                        </button>
                      </div>
                      <div className="rodape-links-list">
                        {linksPorColuna[coluna]?.length === 0 ? (
                          <p className="empty-coluna">Nenhum link nesta coluna</p>
                        ) : (
                          linksPorColuna[coluna]?.map((link) => {
                            const linkId = link.id;
                            return (
                              <div
                                key={linkId}
                                className="rodape-link-item"
                                draggable
                                onDragStart={(e) => handleDragStartLink(e, linkId, 'item')}
                                onDragEnd={handleDragEndLink}
                                onDragOver={(e) => handleDragOverLink(e, linkId)}
                                onDrop={(e) => handleDropLink(e, linkId)}
                                onDragLeave={handleDragLeaveLink}
                              >
                                <div className="rodape-link-drag-handle">
                                  <FaGripVertical />
                                </div>
                                <div className="rodape-link-content">
                                  <div className="rodape-link-texto">
                                    <strong>{link.texto}</strong>
                                  </div>
                                  <div className="rodape-link-url">
                                    {link.link}
                                  </div>
                                </div>
                                <div className="rodape-link-actions">
                                  <button
                                    type="button"
                                    onClick={() => handleEditar(link)}
                                    className="btn-edit-link"
                                    title="Editar"
                                  >
                                    <FaEdit />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeletar(link)}
                                    className="btn-delete-link"
                                    title="Excluir"
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </Modal>

      {showModalLink && (
        <ModalLink
          link={linkEditando}
          colunas={colunas}
          colunaSelecionada={colunaSelecionada}
          onClose={() => {
            setShowModalLink(false);
            setLinkEditando(null);
            setColunaSelecionada('');
          }}
          onSave={async () => {
            await carregarDados();
            setShowModalLink(false);
            setLinkEditando(null);
            setColunaSelecionada('');
            // Disparar evento para atualizar o rodapé na landing page
            window.dispatchEvent(new CustomEvent('rodape-updated'));
          }}
        />
      )}
    </>
  );
};

interface ModalLinkProps {
  link: RodapeLink | null;
  colunas: string[];
  colunaSelecionada: string;
  onClose: () => void;
  onSave: () => Promise<void>;
}

const ModalLink = ({ link, colunas, colunaSelecionada: colunaInicial, onClose, onSave }: ModalLinkProps) => {
  const [texto, setTexto] = useState(link?.texto || '');
  const [linkUrl, setLinkUrl] = useState(link?.link || '');
  const [coluna, setColuna] = useState(colunaInicial || (colunas.length > 0 ? colunas[0] : ''));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (colunaInicial) {
      setColuna(colunaInicial);
    }
  }, [colunaInicial]);

  const handleSalvar = async () => {
    if (!texto.trim()) {
      await mostrarAlert('Erro', 'O texto do link é obrigatório.');
      return;
    }

    if (!linkUrl.trim()) {
      await mostrarAlert('Erro', 'O link é obrigatório.');
      return;
    }

    if (!coluna.trim()) {
      await mostrarAlert('Erro', 'A coluna é obrigatória.');
      return;
    }

    setLoading(true);
    try {
      if (link?.id && typeof link.id === 'number') {
        await apiService.atualizarRodapeLink(link.id, texto.trim(), linkUrl.trim(), coluna.trim());
        await mostrarAlert('Sucesso', 'Link atualizado com sucesso!');
      } else {
        // Obter a ordem máxima para esta coluna
        const linksColuna = await apiService.obterRodapeLinksAdmin();
        const linksMesmaColuna = linksColuna.filter(l => l.coluna === coluna);
        const ordemMaxima = linksMesmaColuna.length > 0 
          ? Math.max(...linksMesmaColuna.map(l => l.ordem || 0))
          : 0;
        
        await apiService.criarRodapeLink(texto.trim(), linkUrl.trim(), coluna.trim(), ordemMaxima + 1);
        await mostrarAlert('Sucesso', 'Link criado com sucesso!');
      }

      // Disparar evento para atualizar o rodapé na landing page
      window.dispatchEvent(new CustomEvent('rodape-updated'));

      await onSave();
    } catch (error) {
      console.error('Erro ao salvar link:', error);
      await mostrarAlert('Erro', 'Erro ao salvar link. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={link ? 'Editar Link' : 'Adicionar Link'}
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
      <div className="rodape-link-form">
        <div className="form-group">
          <label htmlFor="link-texto">Texto do Link <span className="required">*</span>:</label>
          <input
            type="text"
            id="link-texto"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="form-input"
            placeholder="Ex: Sobre"
            disabled={loading}
            autoFocus
          />
        </div>

        <div className="form-group">
          <label htmlFor="link-url">Link <span className="required">*</span>:</label>
          <input
            type="text"
            id="link-url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="form-input"
            placeholder="Ex: #sobre ou https://exemplo.com"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="link-coluna">Coluna <span className="required">*</span>:</label>
          <select
            id="link-coluna"
            value={coluna}
            onChange={(e) => setColuna(e.target.value)}
            className="form-input"
            disabled={loading}
          >
            {colunas.length === 0 ? (
              <option value="">Nenhuma coluna disponível</option>
            ) : (
              colunas.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))
            )}
          </select>
        </div>
      </div>
    </Modal>
  );
};

export default GerenciamentoRodape;
