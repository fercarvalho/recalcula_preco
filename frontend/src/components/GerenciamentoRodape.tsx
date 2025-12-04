import { useState, useEffect, useRef } from 'react';
import { FaLink, FaPlus, FaEdit, FaTrash, FaSave, FaGripVertical, FaToggleOn, FaToggleOff } from 'react-icons/fa';
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
  eh_link?: boolean;
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

  // Drag and drop para reordenar links do rodapé (similar ao FAQ)
  const handleReorderLinks = async (novosLinks: RodapeLink[]) => {
    // Atualizar localmente primeiro para feedback imediato
    setLinks(novosLinks);
    
    try {
      // Recalcular ordem sequencial dentro de cada coluna baseado na nova ordem
      colunas.forEach(col => {
        const linksDaColuna = novosLinks
          .filter(l => l.coluna === col)
          .sort((a, b) => {
            // Manter a ordem relativa atual na lista
            const indexA = novosLinks.findIndex(l => l.id === a.id);
            const indexB = novosLinks.findIndex(l => l.id === b.id);
            return indexA - indexB;
          });
        
        // Atualizar ordem sequencial (0, 1, 2, ...)
        linksDaColuna.forEach((link, ordem) => {
          const linkIndex = novosLinks.findIndex(l => l.id === link.id);
          if (linkIndex !== -1) {
            novosLinks[linkIndex].ordem = ordem;
          }
        });
      });
      
      const linkIds = novosLinks
        .map(p => p.id)
        .filter((id): id is number => {
          if (id === undefined || id === null) return false;
          if (typeof id === 'string') return false;
          const numId = typeof id === 'string' ? parseInt(id, 10) : id;
          return !isNaN(numId);
        })
        .map(id => {
          const numId = typeof id === 'string' ? parseInt(id, 10) : id;
          return numId;
        });
      
      if (linkIds.length === 0) {
        throw new Error('Nenhum ID de link válido encontrado');
      }
      
      await apiService.atualizarOrdemRodapeLinks(linkIds);
      
      // Verificar se algum link mudou de coluna e atualizar
      const linksOriginais = links;
      for (const novoLink of novosLinks) {
        const linkOriginal = linksOriginais.find(l => l.id === novoLink.id);
        if (linkOriginal && linkOriginal.coluna !== novoLink.coluna) {
          if (novoLink.id && typeof novoLink.id === 'number') {
            await apiService.atualizarRodapeLink(
              novoLink.id,
              novoLink.texto,
              novoLink.link,
              novoLink.coluna,
              novoLink.eh_link
            );
          }
        }
      }
      
      // Disparar evento para atualizar o rodapé na landing page
      window.dispatchEvent(new CustomEvent('rodape-updated'));
    } catch (error) {
      console.error('Erro ao atualizar ordem dos links:', error);
      await mostrarAlert('Erro', 'Erro ao atualizar ordem dos links. Tente novamente.');
      // Recarregar links em caso de erro
      await carregarDados();
    }
  };

  // Estado para rastrear qual link está sendo arrastado
  const [draggedLinkId, setDraggedLinkId] = useState<string | number | null>(null);

  const {
    handleDragStart: handleDragStartLinkBase,
    handleDragEnd: handleDragEndLinkBase,
    handleDragOver: handleDragOverLinkBase,
    handleDrop: handleDropLinkBase,
    handleDragLeave: handleDragLeaveLink,
  } = useDragAndDrop(linksComIds, handleReorderLinks);

  // Wrapper customizado para handleDrop que detecta a coluna de destino
  const handleDropLink = (e: React.DragEvent, id: string | number) => {
    // Encontrar a coluna do elemento onde foi solto
    const targetElement = e.currentTarget as HTMLElement;
    const colunaElement = targetElement.closest('.rodape-coluna');
    const colunaDestino = colunaElement?.querySelector('.rodape-coluna-header h3')?.textContent;
    
    if (colunaDestino && draggedLinkId) {
      const draggedLink = linksComIds.find(l => l.id === draggedLinkId);
      if (draggedLink && draggedLink.coluna !== colunaDestino) {
        // Atualizar a coluna do link antes de chamar o handler base
        const novosLinks = linksComIds.map(l => 
          l.id === draggedLinkId ? { ...l, coluna: colunaDestino } : l
        );
        
        // Reordenar: mover o link arrastado para a posição do link de destino
        const draggedIndex = novosLinks.findIndex(l => l.id === draggedLinkId);
        const dropIndex = novosLinks.findIndex(l => l.id === id);
        
        if (draggedIndex !== -1 && dropIndex !== -1) {
          const [linkMovido] = novosLinks.splice(draggedIndex, 1);
          const insertIndex = dropIndex > draggedIndex ? dropIndex : dropIndex;
          novosLinks.splice(insertIndex, 0, linkMovido);
          
          handleReorderLinks(novosLinks);
          setDraggedLinkId(null);
          return;
        }
      }
    }
    
    // Se não mudou de coluna, usar o handler normal
    handleDropLinkBase(e, id);
    setDraggedLinkId(null);
  };

  // Wrapper para handleDragStart que salva o ID do link arrastado
  const handleDragStartLink = (e: React.DragEvent, id: string | number, type: 'categoria' | 'item' | 'plano') => {
    setDraggedLinkId(id);
    handleDragStartLinkBase(e, id, type);
  };

  // Wrapper para handleDragEnd que limpa o estado
  const handleDragEndLink = (e: React.DragEvent) => {
    setDraggedLinkId(null);
    handleDragEndLinkBase(e);
  };

  // Wrapper para handleDragOver
  const handleDragOverLink = handleDragOverLinkBase;

  // Estado para controlar o drag and drop das colunas
  const [draggedColuna, setDraggedColuna] = useState<string | null>(null);
  const [dragOverColuna, setDragOverColuna] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'before' | 'after' | null>(null);

  // Drag and drop para reordenar colunas
  const handleReorderColunas = async (novasColunas: string[]) => {
    console.log('handleReorderColunas chamado com:', novasColunas);
    // Atualizar localmente primeiro para feedback imediato
    setColunas(novasColunas);
    
    try {
      console.log('Enviando ordem das colunas para o servidor:', novasColunas);
      await apiService.atualizarOrdemColunasRodape(novasColunas);
      console.log('Ordem das colunas atualizada com sucesso');
      
      // Disparar evento para atualizar o rodapé na landing page
      window.dispatchEvent(new CustomEvent('rodape-updated'));
    } catch (error) {
      console.error('Erro ao atualizar ordem das colunas:', error);
      await mostrarAlert('Erro', 'Erro ao atualizar ordem das colunas. Tente novamente.');
      // Recarregar dados em caso de erro
      await carregarDados();
    }
  };

  // Handlers customizados para drag and drop de colunas (strings)
  const handleDragStartColuna = (e: React.DragEvent, coluna: string, type: 'categoria' | 'item' | 'plano') => {
    console.log('Drag start coluna:', coluna);
    setDraggedColuna(coluna);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', coluna);
    (e.currentTarget as HTMLElement).classList.add('dragging');
  };

  const handleDragEndColuna = (e: React.DragEvent) => {
    console.log('Drag end coluna');
    const element = e.currentTarget as HTMLElement;
    element.classList.remove('dragging');
    
    // Limpar estados de drag-over
    document.querySelectorAll('.drag-over').forEach(el => {
      el.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
    });

    setDraggedColuna(null);
    setDragOverColuna(null);
    setDragOverPosition(null);
  };

  const handleDragOverColuna = (e: React.DragEvent, coluna: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (draggedColuna === coluna) return;

    const element = e.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const midpoint = rect.height / 2;

    const position = y < midpoint ? 'before' : 'after';

    // Limpar outros drag-over
    document.querySelectorAll('.drag-over').forEach(el => {
      if (el !== element) {
        el.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
      }
    });

    element.classList.add('drag-over');
    element.classList.remove('drag-over-top', 'drag-over-bottom');
    element.classList.add(`drag-over-${position}`);

    setDragOverColuna(coluna);
    setDragOverPosition(position);
  };

  const handleDropColuna = (e: React.DragEvent, coluna: string) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('Drop coluna:', coluna, 'dragged:', draggedColuna);

    const element = e.currentTarget as HTMLElement;
    element.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');

    if (!draggedColuna || draggedColuna === coluna) {
      setDraggedColuna(null);
      setDragOverColuna(null);
      setDragOverPosition(null);
      return;
    }

    const draggedIndex = colunas.findIndex(c => c === draggedColuna);
    const dropIndex = colunas.findIndex(c => c === coluna);

    console.log('Índices - dragged:', draggedIndex, 'drop:', dropIndex);

    if (draggedIndex === -1 || dropIndex === -1) {
      console.error('Índices inválidos');
      setDraggedColuna(null);
      setDragOverColuna(null);
      setDragOverPosition(null);
      return;
    }

    const newColunas = [...colunas];
    const [draggedItem] = newColunas.splice(draggedIndex, 1);

    const insertIndex = dragOverPosition === 'before' ? dropIndex : dropIndex + 1;
    newColunas.splice(insertIndex, 0, draggedItem);

    console.log('Nova ordem das colunas:', newColunas);

    handleReorderColunas(newColunas);
    
    setDraggedColuna(null);
    setDragOverColuna(null);
    setDragOverPosition(null);
  };

  const handleDragLeaveColuna = (e: React.DragEvent) => {
    const element = e.currentTarget as HTMLElement;
    if (!element.contains(e.relatedTarget as Node)) {
      element.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
    }
  };

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
                    <div
                      key={coluna}
                      className="rodape-coluna"
                      draggable
                      onDragStart={(e) => handleDragStartColuna(e, coluna, 'categoria')}
                      onDragEnd={handleDragEndColuna}
                      onDragOver={(e) => handleDragOverColuna(e, coluna)}
                      onDrop={(e) => handleDropColuna(e, coluna)}
                      onDragLeave={handleDragLeaveColuna}
                    >
                      <div className="rodape-coluna-header">
                        <div className="rodape-coluna-drag-handle">
                          <FaGripVertical />
                        </div>
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
                                  {link.eh_link && link.link && (
                                    <div className="rodape-link-url">
                                      {link.link}
                                    </div>
                                  )}
                                  {!link.eh_link && (
                                    <div className="rodape-link-tipo" style={{ color: '#6c757d', fontSize: '0.85rem', fontStyle: 'italic' }}>
                                      Texto
                                    </div>
                                  )}
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
  // Inicializar estados com valores do link ou valores padrão
  const getInitialEhLink = () => {
    if (link?.eh_link !== undefined) return link.eh_link;
    return true; // Padrão: é um link
  };
  
  const [texto, setTexto] = useState(() => link?.texto || '');
  const [linkUrl, setLinkUrl] = useState(() => link?.link || '');
  const [coluna, setColuna] = useState(() => colunaInicial || (colunas.length > 0 ? colunas[0] : ''));
  const [ehLink, setEhLink] = useState(getInitialEhLink);
  const [loading, setLoading] = useState(false);
  const linkIdRef = useRef(link?.id);
  const initializedRef = useRef(false);

  // Inicializar valores apenas quando o link mudar (não em cada render)
  useEffect(() => {
    const linkIdAtual = link?.id;
    
    // Se o link mudou (novo link ou link diferente) ou ainda não foi inicializado
    if (!initializedRef.current || linkIdRef.current !== linkIdAtual) {
      initializedRef.current = true;
      linkIdRef.current = linkIdAtual;
      
      if (colunaInicial) {
        setColuna(colunaInicial);
      }
      
      if (link) {
        const novoEhLink = link.eh_link !== undefined ? link.eh_link : true;
        setEhLink(novoEhLink);
        setLinkUrl(link.link || '');
        setTexto(link.texto || '');
      } else {
        // Se não há link (criando novo), inicializar como true
        setEhLink(true);
        setLinkUrl('');
        setTexto('');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [link?.id]);
  
  // Atualizar coluna quando colunaInicial mudar
  useEffect(() => {
    if (colunaInicial) {
      setColuna(colunaInicial);
    }
  }, [colunaInicial]);

  const handleSalvar = async () => {
    if (!texto.trim()) {
      await mostrarAlert('Erro', 'O texto é obrigatório.');
      return;
    }

    if (ehLink && !linkUrl.trim()) {
      await mostrarAlert('Erro', 'O link é obrigatório quando o item é um link.');
      return;
    }

    if (!coluna.trim()) {
      await mostrarAlert('Erro', 'A coluna é obrigatória.');
      return;
    }

    setLoading(true);
    try {
      // Se não é um link, garantir que o linkUrl seja uma string vazia
      const linkFinal = ehLink ? linkUrl.trim() : '';
      
      if (link?.id && typeof link.id === 'number') {
        await apiService.atualizarRodapeLink(link.id, texto.trim(), linkFinal, coluna.trim(), ehLink);
        await mostrarAlert('Sucesso', 'Item atualizado com sucesso!');
      } else {
        // Obter a ordem máxima para esta coluna
        const linksColuna = await apiService.obterRodapeLinksAdmin();
        const linksMesmaColuna = linksColuna.filter(l => l.coluna === coluna);
        const ordemMaxima = linksMesmaColuna.length > 0 
          ? Math.max(...linksMesmaColuna.map(l => l.ordem || 0))
          : 0;
        
        await apiService.criarRodapeLink(texto.trim(), linkFinal, coluna.trim(), ordemMaxima + 1, ehLink);
        await mostrarAlert('Sucesso', 'Item criado com sucesso!');
      }

      // Disparar evento para atualizar o rodapé na landing page
      window.dispatchEvent(new CustomEvent('rodape-updated'));

      await onSave();
    } catch (error: any) {
      console.error('Erro ao salvar item:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Erro ao salvar item. Tente novamente.';
      await mostrarAlert('Erro', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={link ? 'Editar Item' : 'Adicionar Item'}
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
          <label htmlFor="link-texto">Texto <span className="required">*</span>:</label>
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

        <div className="switch-group">
          <label>
            <span>É um link?</span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const novoValor = !ehLink;
                setEhLink(novoValor);
                if (!novoValor) {
                  setLinkUrl('');
                }
              }}
              className={`switch-btn ${ehLink ? 'active' : ''}`}
              disabled={loading}
            >
              {ehLink ? <FaToggleOn /> : <FaToggleOff />}
            </button>
          </label>
        </div>

        {ehLink && (
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
        )}

        <div className="form-group">
          <label htmlFor="link-coluna">Coluna <span className="required">*</span>:</label>
          <select
            id="link-coluna"
            value={coluna || ''}
            onChange={(e) => {
              e.preventDefault();
              setColuna(e.target.value);
            }}
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
