import { useState, useEffect, useRef, useMemo } from 'react';
import { FaPlus, FaEdit, FaTrash, FaGripVertical, FaCheckCircle, FaClock, FaRocket, FaFlask, FaCode } from 'react-icons/fa';
import Modal from './Modal';
import DatePicker from './DatePicker';
import { apiService } from '../services/api';
import './RoadmapKanban.css';

interface RoadmapItem {
  id: number;
  titulo: string;
  descricao: string | null;
  status: 'backlog' | 'doing' | 'em_testes' | 'em_beta' | 'lancado' | 'done';
  prioridade: 'baixa' | 'media' | 'alta';
  ordem: number;
  data_inicio: string | null;
  depende_de: number | null;
  tempo_acumulado: number;
  em_andamento: boolean;
  ultimo_inicio: string | null;
  created_at: string;
  updated_at: string;
  created_by: number | null;
  created_by_username: string | null;
}

interface RoadmapKanbanProps {
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_CONFIG = {
  backlog: { label: 'Backlog', icon: FaCode, color: '#6c757d' },
  doing: { label: 'Doing', icon: FaClock, color: '#ffc107' },
  em_testes: { label: 'Em Testes', icon: FaFlask, color: '#17a2b8' },
  em_beta: { label: 'Em Beta', icon: FaRocket, color: '#007bff' },
  lancado: { label: 'Lançado', icon: FaCheckCircle, color: '#28a745' },
  done: { label: 'Done', icon: FaCheckCircle, color: '#6c757d' },
};

const PRIORIDADE_CONFIG = {
  baixa: { label: 'Baixa', color: '#28a745' },
  media: { label: 'Média', color: '#ffc107' },
  alta: { label: 'Alta', color: '#dc3545' },
};

const RoadmapKanban = ({ isOpen, onClose }: RoadmapKanbanProps) => {
  const [itens, setItens] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModalItem, setShowModalItem] = useState(false);
  const [itemEditando, setItemEditando] = useState<RoadmapItem | null>(null);
  const [draggedItem, setDraggedItem] = useState<RoadmapItem | null>(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null);
  const [temposAtuais, setTemposAtuais] = useState<{ [key: number]: number }>({});
  const timersRef = useRef<{ [key: number]: ReturnType<typeof setInterval> }>({});
  const itensRef = useRef<RoadmapItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      carregarRoadmap();
    }
    
    return () => {
      // Limpar todos os timers ao desmontar
      Object.values(timersRef.current).forEach(timer => clearInterval(timer));
      timersRef.current = {};
    };
  }, [isOpen]);

  useEffect(() => {
    // Atualizar referência dos itens
    itensRef.current = itens;
    
    // Limpar timers antigos que não estão mais em andamento
    const idsEmAndamento = new Set(
      itens.filter(i => i.em_andamento && i.ultimo_inicio).map(i => i.id)
    );
    
    Object.keys(timersRef.current).forEach(idStr => {
      const id = parseInt(idStr);
      if (!idsEmAndamento.has(id)) {
        if (timersRef.current[id]) {
          clearInterval(timersRef.current[id]);
          delete timersRef.current[id];
        }
      }
    });
    
    // Inicializar timers para itens em andamento que ainda não têm timer
    itens.forEach(item => {
      if (item.em_andamento && item.ultimo_inicio && !timersRef.current[item.id]) {
        const inicio = new Date(item.ultimo_inicio).getTime();
        const agora = Date.now();
        const tempoDecorrido = Math.floor((agora - inicio) / 1000);
        
        // Inicializar tempo atual apenas se não existir
        setTemposAtuais(prev => {
          if (prev[item.id] === undefined) {
            return {
              ...prev,
              [item.id]: tempoDecorrido
            };
          }
          return prev;
        });
        
        timersRef.current[item.id] = setInterval(() => {
          const itemAtual = itensRef.current.find(i => i.id === item.id);
          if (itemAtual && itemAtual.em_andamento && itemAtual.ultimo_inicio) {
            const inicioAtual = new Date(itemAtual.ultimo_inicio).getTime();
            const agoraAtual = Date.now();
            const tempoDecorridoAtual = Math.floor((agoraAtual - inicioAtual) / 1000);
            
            setTemposAtuais(prev => {
              // Só atualizar se o valor mudou
              if (prev[item.id] !== tempoDecorridoAtual) {
                return {
                  ...prev,
                  [item.id]: tempoDecorridoAtual
                };
              }
              return prev;
            });
          } else {
            // Se o item não está mais em andamento, limpar o timer
            if (timersRef.current[item.id]) {
              clearInterval(timersRef.current[item.id]);
              delete timersRef.current[item.id];
            }
          }
        }, 1000);
      }
    });
    
    return () => {
      // Não limpar todos os timers aqui, apenas os que não estão mais em andamento
      // Os timers serão limpos quando os itens mudarem
    };
  }, [itens]);

  const carregarRoadmap = async () => {
    setLoading(true);
    try {
      const dados = await apiService.obterRoadmap();
      // Comparar por IDs e propriedades relevantes para evitar re-renderizações desnecessárias
      setItens(prev => {
        // Se o número de itens mudou, atualizar
        if (prev.length !== dados.length) {
          return dados;
        }
        
        // Comparar cada item por ID e propriedades relevantes
        const prevMap = new Map(prev.map(item => [item.id, item]));
        const dadosMap = new Map(dados.map(item => [item.id, item]));
        
        // Verificar se algum item mudou
        for (const [id, itemDados] of dadosMap) {
          const itemPrev = prevMap.get(id);
          if (!itemPrev) {
            return dados; // Novo item encontrado
          }
          
          // Comparar propriedades relevantes
          if (
            itemPrev.titulo !== itemDados.titulo ||
            itemPrev.descricao !== itemDados.descricao ||
            itemPrev.status !== itemDados.status ||
            itemPrev.prioridade !== itemDados.prioridade ||
            itemPrev.ordem !== itemDados.ordem ||
            itemPrev.data_inicio !== itemDados.data_inicio ||
            itemPrev.depende_de !== itemDados.depende_de ||
            itemPrev.tempo_acumulado !== itemDados.tempo_acumulado ||
            itemPrev.em_andamento !== itemDados.em_andamento ||
            itemPrev.ultimo_inicio !== itemDados.ultimo_inicio
          ) {
            return dados; // Item mudou
          }
        }
        
        // Se chegou aqui, nada mudou
        return prev;
      });
    } catch (error) {
      console.error('Erro ao carregar roadmap:', error);
      alert('Erro ao carregar roadmap');
    } finally {
      setLoading(false);
    }
  };

  const handleCriarItem = () => {
    setItemEditando(null);
    setShowModalItem(true);
  };

  const handleEditarItem = (item: RoadmapItem) => {
    setItemEditando(item);
    setShowModalItem(true);
  };

  const handleDeletarItem = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar este item?')) return;

    try {
      // Parar timer se estiver rodando
      if (timersRef.current[id]) {
        clearInterval(timersRef.current[id]);
        delete timersRef.current[id];
      }
      
      await apiService.deletarRoadmapItem(id);
      await carregarRoadmap();
    } catch (error) {
      console.error('Erro ao deletar item:', error);
      alert('Erro ao deletar item');
    }
  };

  const handleIniciarTempo = async (id: number) => {
    try {
      await apiService.iniciarTempoRoadmapItem(id);
      await carregarRoadmap();
    } catch (error) {
      console.error('Erro ao iniciar tempo:', error);
      alert('Erro ao iniciar contador de tempo');
    }
  };

  const handlePararTempo = async (id: number) => {
    try {
      const item = itens.find(i => i.id === id);
      if (!item) return;
      
      // Calcular tempo decorrido desde o último início
      let tempoDecorrido = 0;
      if (item.ultimo_inicio) {
        const inicio = new Date(item.ultimo_inicio).getTime();
        const agora = Date.now();
        tempoDecorrido = Math.floor((agora - inicio) / 1000);
      }
      
      // Parar timer
      if (timersRef.current[id]) {
        clearInterval(timersRef.current[id]);
        delete timersRef.current[id];
      }
      setTemposAtuais(prev => {
        const novos = { ...prev };
        delete novos[id];
        return novos;
      });
      
      await apiService.pararTempoRoadmapItem(id, tempoDecorrido);
      await carregarRoadmap();
    } catch (error) {
      console.error('Erro ao parar tempo:', error);
      alert('Erro ao parar contador de tempo');
    }
  };

  const formatarTempo = (segundos: number): string => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    
    if (horas > 0) {
      return `${horas}h ${minutos.toString().padStart(2, '0')}m ${segs.toString().padStart(2, '0')}s`;
    } else if (minutos > 0) {
      return `${minutos}m ${segs.toString().padStart(2, '0')}s`;
    } else {
      return `${segs}s`;
    }
  };

  const handleSalvarItem = async (dados: { titulo: string; descricao: string; status: string; prioridade: string; data_inicio?: string; depende_de?: number | null }) => {
    try {
      if (itemEditando) {
        await apiService.atualizarRoadmapItem(itemEditando.id, dados);
      } else {
        await apiService.criarRoadmapItem(dados);
      }
      setShowModalItem(false);
      await carregarRoadmap();
    } catch (error) {
      console.error('Erro ao salvar item:', error);
      alert('Erro ao salvar item');
    }
  };

  const handleDragStart = (e: React.DragEvent, item: RoadmapItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(item.id));
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOverColumn(status);
  };

  const handleDragLeave = () => {
    setDraggedOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, novoStatus: string, targetIndex?: number) => {
    e.preventDefault();
    setDraggedOverColumn(null);

    if (!draggedItem) {
      setDraggedItem(null);
      return;
    }

    try {
      const itensColuna = getItensPorStatus(novoStatus);
      const mudouStatus = draggedItem.status !== novoStatus;
      
      // Se mudou de coluna, apenas atualiza o status
      if (mudouStatus) {
        await apiService.atualizarStatusRoadmapItem(draggedItem.id, novoStatus);
        await carregarRoadmap();
      } else {
        // Se está na mesma coluna, precisa reordenar
        // Encontrar a posição atual do item arrastado
        const posicaoAtual = itensColuna.findIndex(item => item.id === draggedItem.id);
        
        if (posicaoAtual === -1) {
          console.error('Item não encontrado na coluna');
          setDraggedItem(null);
          return;
        }
        
        // Se não mudou de posição, não precisa fazer nada
        if (targetIndex !== undefined && targetIndex === posicaoAtual) {
          setDraggedItem(null);
          return;
        }
        
        // Remover o item arrastado da lista
        const itensSemArrastado = itensColuna.filter(item => item.id !== draggedItem.id);
        
        // Calcular nova posição
        let novaPosicao: number;
        if (targetIndex !== undefined) {
          // targetIndex já considera que o item arrastado não está na lista
          // Então podemos usar diretamente, mas precisamos garantir que está dentro dos limites
          novaPosicao = Math.max(0, Math.min(targetIndex, itensSemArrastado.length));
        } else {
          // Se não há targetIndex, manter na mesma posição
          novaPosicao = posicaoAtual;
        }
        
        // Inserir na nova posição
        itensSemArrastado.splice(novaPosicao, 0, draggedItem);
        
        // Recalcular ordem para todos os itens da coluna
        const itensAtualizados = itensSemArrastado.map((item, index) => ({
          id: item.id,
          ordem: index
        }));
        
        // Verificar se há itens para atualizar
        if (itensAtualizados.length === 0) {
          console.warn('Nenhum item para atualizar');
          setDraggedItem(null);
          return;
        }
        
        // Atualizar estado local imediatamente para feedback visual instantâneo
        setItens(prev => {
          const novosItens = [...prev];
          
          // Atualizar a ordem de cada item da coluna
          itensAtualizados.forEach(({ id, ordem }) => {
            const index = novosItens.findIndex(item => item.id === id);
            if (index !== -1) {
              novosItens[index] = { ...novosItens[index], ordem };
            }
          });
          
          return novosItens;
        });
        
        console.log('Atualizando ordem dos itens:', JSON.stringify(itensAtualizados, null, 2));
        
        // Atualizar no backend
        try {
          await apiService.atualizarOrdemRoadmap(itensAtualizados);
          // Não recarregar - o estado já foi atualizado localmente
        } catch (error) {
          // Se der erro, recarregar do servidor para reverter
          await carregarRoadmap();
          throw error;
        }
      }
    } catch (error: any) {
      console.error('Erro ao atualizar status/ordem:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Erro desconhecido';
      alert(`Erro ao mover item: ${errorMessage}`);
    } finally {
      setDraggedItem(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDraggedOverColumn(null);
  };

  const getItensPorStatus = (status: string) => {
    return itens
      .filter(item => item.status === status)
      .sort((a, b) => a.ordem - b.ordem);
  };

  // Calcular prioridade baseada na posição na coluna (1 = mais importante)
  const calcularPrioridade = (item: RoadmapItem): number => {
    const itensColuna = getItensPorStatus(item.status);
    const index = itensColuna.findIndex(i => i.id === item.id);
    return index >= 0 ? index + 1 : itensColuna.length + 1;
  };

  // Atualizar prioridade manualmente e recalcular ordem
  const handleAtualizarPrioridade = async (itemId: number, novaPrioridade: number) => {
    try {
      const item = itens.find(i => i.id === itemId);
      if (!item) return;

      const itensColuna = getItensPorStatus(item.status);
      
      // Validar nova prioridade
      const prioridadeValida = Math.max(1, Math.min(novaPrioridade, itensColuna.length));
      
      // Remover item da posição atual
      const itensSemItem = itensColuna.filter(i => i.id !== itemId);
      
      // Inserir na nova posição (prioridade - 1 porque é índice baseado em 0)
      const novaPosicao = prioridadeValida - 1;
      itensSemItem.splice(novaPosicao, 0, item);
      
      // Recalcular ordem para todos os itens da coluna
      const itensAtualizados = itensSemItem.map((item, index) => ({
        id: item.id,
        ordem: index
      }));
      
      // Atualizar estado local imediatamente para feedback visual instantâneo
      setItens(prev => {
        const novosItens = [...prev];
        
        // Atualizar a ordem de cada item da coluna
        itensAtualizados.forEach(({ id, ordem }) => {
          const index = novosItens.findIndex(item => item.id === id);
          if (index !== -1) {
            novosItens[index] = { ...novosItens[index], ordem };
          }
        });
        
        return novosItens;
      });
      
      // Atualizar no backend
      try {
        await apiService.atualizarOrdemRoadmap(itensAtualizados);
        // Não recarregar - o estado já foi atualizado localmente
      } catch (error) {
        // Se der erro, recarregar do servidor para reverter
        await carregarRoadmap();
        throw error;
      }
    } catch (error) {
      console.error('Erro ao atualizar prioridade:', error);
      alert('Erro ao atualizar prioridade');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Roadmap do Sistema"
      size="large"
      className="roadmap-modal"
    >
      <Modal
        isOpen={showModalItem}
        onClose={() => {
          setShowModalItem(false);
          setItemEditando(null);
        }}
        title={itemEditando ? 'Editar Item do Roadmap' : 'Novo Item do Roadmap'}
        size="medium"
        className="modal-nested"
      >
        <FormItemRoadmap
          item={itemEditando}
          todasTarefas={itens}
          onSave={handleSalvarItem}
          onCancel={() => {
            setShowModalItem(false);
            setItemEditando(null);
          }}
        />
      </Modal>

      <div className="roadmap-kanban-container">
        <div className="roadmap-kanban-header">
          <h2>Roadmap do Sistema</h2>
          <button onClick={handleCriarItem} className="btn-primary">
            <FaPlus /> Novo Item
          </button>
        </div>

        {loading ? (
          <div className="roadmap-loading">Carregando...</div>
        ) : (
          <div className="roadmap-kanban-board">
            {Object.entries(STATUS_CONFIG).map(([status, config]) => {
              const itensColuna = getItensPorStatus(status);
              const Icon = config.icon;

              return (
                <div
                  key={status}
                  className={`roadmap-column ${draggedOverColumn === status ? 'drag-over-column' : ''}`}
                  onDragOver={(e) => {
                    handleDragOver(e, status);
                    e.dataTransfer.dropEffect = 'move';
                  }}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => {
                    const columnContent = e.currentTarget.querySelector('.roadmap-column-content');
                    let targetIndex: number | undefined = undefined;
                    
                    if (columnContent && draggedItem) {
                      // Obter cards visíveis (sem o que está sendo arrastado) na ordem correta
                      const cardsSemDragging = Array.from(columnContent.querySelectorAll('.roadmap-card:not(.dragging)'));
                      
                      const rect = e.currentTarget.getBoundingClientRect();
                      const mouseY = e.clientY - rect.top;
                      
                      // Encontrar a posição baseada nos cards visíveis (sem o dragging)
                      // Os cards estão na mesma ordem dos itens, então podemos usar o índice diretamente
                      for (let i = 0; i < cardsSemDragging.length; i++) {
                        const cardRect = cardsSemDragging[i].getBoundingClientRect();
                        const cardTop = cardRect.top - rect.top;
                        if (mouseY < cardTop + cardRect.height / 2) {
                          targetIndex = i;
                          break;
                        }
                      }
                      
                      // Se não encontrou posição, colocar no final
                      if (targetIndex === undefined) {
                        targetIndex = cardsSemDragging.length;
                      }
                    }
                    
                    handleDrop(e, status, targetIndex);
                  }}
                >
                  <div className="roadmap-column-header" style={{ borderTopColor: config.color }}>
                    <Icon style={{ color: config.color }} />
                    <span>{config.label}</span>
                    <span className="roadmap-column-count">({itensColuna.length})</span>
                  </div>
                  <div className="roadmap-column-content">
                    {itensColuna.map((item) => (
                      <RoadmapCard
                        key={item.id}
                        item={item}
                        onEdit={handleEditarItem}
                        onDelete={handleDeletarItem}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        isDragging={draggedItem?.id === item.id}
                        onIniciarTempo={handleIniciarTempo}
                        onPararTempo={handlePararTempo}
                        tempoAtual={temposAtuais[item.id]}
                        formatarTempo={formatarTempo}
                        prioridade={calcularPrioridade(item)}
                        totalItensColuna={itensColuna.length}
                        onAtualizarPrioridade={handleAtualizarPrioridade}
                      />
                    ))}
                    {itensColuna.length === 0 && (
                      <div className="roadmap-empty-column">Nenhum item</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};

interface RoadmapCardProps {
  item: RoadmapItem;
  onEdit: (item: RoadmapItem) => void;
  onDelete: (id: number) => void;
  onDragStart: (e: React.DragEvent, item: RoadmapItem) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  onIniciarTempo: (id: number) => void;
  onPararTempo: (id: number) => void;
  tempoAtual?: number;
  formatarTempo: (segundos: number) => string;
  prioridade: number;
  totalItensColuna: number;
  onAtualizarPrioridade: (itemId: number, novaPrioridade: number) => void;
}

const RoadmapCard = ({ item, onEdit, onDelete, onDragStart, onDragEnd, isDragging, onIniciarTempo, onPararTempo, tempoAtual, formatarTempo, prioridade, totalItensColuna, onAtualizarPrioridade }: RoadmapCardProps) => {
  const prioridadeTipo = PRIORIDADE_CONFIG[item.prioridade];
  const [prioridadeEditando, setPrioridadeEditando] = useState(prioridade);
  
  // Sincronizar prioridade quando mudar externamente
  useEffect(() => {
    setPrioridadeEditando(prioridade);
  }, [prioridade]);
  
  // Calcular tempo total (acumulado + tempo atual se estiver rodando)
  const tempoTotal = item.tempo_acumulado + (tempoAtual || 0);
  const tempoTotalFormatado = formatarTempo(tempoTotal);

  const handlePrioridadeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const novaPrioridade = parseInt(e.target.value, 10);
    if (!isNaN(novaPrioridade) && novaPrioridade >= 1 && novaPrioridade <= totalItensColuna) {
      setPrioridadeEditando(novaPrioridade);
      onAtualizarPrioridade(item.id, novaPrioridade);
    }
  };

  return (
    <div
      className={`roadmap-card ${isDragging ? 'dragging' : ''}`}
      draggable
      onDragStart={(e) => onDragStart(e, item)}
      onDragEnd={onDragEnd}
    >
      <div className="roadmap-card-header">
        <FaGripVertical className="roadmap-card-drag-handle" />
        <div className="roadmap-card-actions">
          <button onClick={() => onEdit(item)} className="roadmap-card-btn-edit">
            <FaEdit />
          </button>
          <button onClick={() => onDelete(item.id)} className="roadmap-card-btn-delete">
            <FaTrash />
          </button>
        </div>
      </div>
      <div className="roadmap-card-body">
        <h3 className="roadmap-card-title">{item.titulo}</h3>
        {item.descricao && (
          <p className="roadmap-card-description">{item.descricao}</p>
        )}
      </div>
      <div className="roadmap-card-prioridade-section">
        <label className="roadmap-card-prioridade-label">
          Prioridade:
          <input
            type="number"
            min="1"
            max={totalItensColuna}
            value={prioridadeEditando}
            onChange={handlePrioridadeChange}
            className="roadmap-card-prioridade-input"
          />
          <span className="roadmap-card-prioridade-total">/ {totalItensColuna}</span>
        </label>
      </div>
      <div className="roadmap-card-time-section">
        {item.data_inicio && (
          <div className="roadmap-card-data-inicio">
            <strong>Início:</strong> {new Date(item.data_inicio).toLocaleDateString('pt-BR')}
          </div>
        )}
        <div className="roadmap-card-tempo">
          <strong>Tempo:</strong> {tempoTotalFormatado}
        </div>
        <button
          onClick={() => item.em_andamento ? onPararTempo(item.id) : onIniciarTempo(item.id)}
          className={`roadmap-card-btn-timer ${item.em_andamento ? 'stop' : 'start'}`}
        >
          {item.em_andamento ? '⏹ Stop' : '▶ Start'}
        </button>
      </div>
      <div className="roadmap-card-footer">
        <span
          className="roadmap-card-prioridade-tipo"
          style={{ backgroundColor: prioridadeTipo.color + '20', color: prioridadeTipo.color }}
        >
          {prioridadeTipo.label}
        </span>
        {item.created_by_username && (
          <span className="roadmap-card-author">por {item.created_by_username}</span>
        )}
      </div>
    </div>
  );
};

interface FormItemRoadmapProps {
  item: RoadmapItem | null;
  todasTarefas: RoadmapItem[];
  onSave: (dados: { titulo: string; descricao: string; status: string; prioridade: string; data_inicio?: string; depende_de?: number | null }) => void;
  onCancel: () => void;
}

const FormItemRoadmap = ({ item, todasTarefas, onSave, onCancel }: FormItemRoadmapProps) => {
  const [titulo, setTitulo] = useState(item?.titulo || '');
  const [descricao, setDescricao] = useState(item?.descricao || '');
  const [status, setStatus] = useState<RoadmapItem['status']>(item?.status || 'backlog');
  const [prioridade, setPrioridade] = useState<RoadmapItem['prioridade']>(item?.prioridade || 'media');
  const [dependeDe, setDependeDe] = useState<number | null>(item?.depende_de || null);
  
  // Formatar data de início para o input (YYYY-MM-DD)
  const formatarDataParaInput = (data: string | null | undefined): string => {
    if (!data) return '';
    try {
      const dataObj = new Date(data);
      if (!isNaN(dataObj.getTime())) {
        return dataObj.toISOString().split('T')[0];
      }
    } catch (error) {
      // Ignorar erro
    }
    return '';
  };
  
  const [dataInicio, setDataInicio] = useState(formatarDataParaInput(item?.data_inicio));

  useEffect(() => {
    if (item) {
      setDataInicio(formatarDataParaInput(item.data_inicio));
      setDependeDe(item.depende_de || null);
    } else {
      setDataInicio('');
      setDependeDe(null);
    }
  }, [item?.id, item?.data_inicio, item?.depende_de]);

  // Filtrar tarefas disponíveis (excluir a tarefa atual se estiver editando)
  // Usar useMemo para evitar recálculos desnecessários
  const tarefasDisponiveis = useMemo(() => {
    return todasTarefas.filter(t => !item || t.id !== item.id);
  }, [todasTarefas, item?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      alert('O título é obrigatório');
      return;
    }
    onSave({ 
      titulo: titulo.trim(), 
      descricao: descricao.trim(), 
      status, 
      prioridade,
      data_inicio: dataInicio || undefined,
      depende_de: dependeDe || null
    });
  };

  return (
    <form onSubmit={handleSubmit} className="roadmap-form">
      <div className="form-group">
        <label>Título *</label>
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ex: Implementar sistema de notificações"
          required
        />
      </div>
      <div className="form-group">
        <label>Descrição</label>
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Descreva os detalhes desta tarefa..."
          rows={4}
        />
      </div>
      <div className="form-group">
        <label>Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value as RoadmapItem['status'])}>
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>Prioridade</label>
        <select value={prioridade} onChange={(e) => setPrioridade(e.target.value as RoadmapItem['prioridade'])}>
          {Object.entries(PRIORIDADE_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="data-inicio-roadmap">Data de Início:</label>
        <DatePicker
          id="data-inicio-roadmap"
          value={dataInicio}
          onChange={(value) => setDataInicio(value || '')}
          max={new Date().toISOString().split('T')[0]}
          className="date-input"
        />
      </div>
      <div className="form-group">
        <label htmlFor="depende-de-roadmap">Depende de:</label>
        <select
          id="depende-de-roadmap"
          value={dependeDe || ''}
          onChange={(e) => setDependeDe(e.target.value ? parseInt(e.target.value) : null)}
        >
          <option value="">Nenhuma (tarefa independente)</option>
          {tarefasDisponiveis.map((tarefa) => (
            <option key={tarefa.id} value={tarefa.id}>
              {tarefa.titulo}
            </option>
          ))}
        </select>
      </div>
      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancelar
        </button>
        <button type="submit" className="btn-primary">
          Salvar
        </button>
      </div>
    </form>
  );
};

export default RoadmapKanban;

