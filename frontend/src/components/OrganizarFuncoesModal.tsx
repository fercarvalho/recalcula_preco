import { useState, useEffect, useRef } from 'react';
import { FaGripVertical, FaUndo } from 'react-icons/fa';
import Modal from './Modal';
import { mostrarAlert } from '../utils/modals';
import { apiService } from '../services/api';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import './OrganizarFuncoesModal.css';

export interface Funcao {
  id?: number;
  titulo: string;
  descricao: string;
  icone?: string;
  icone_upload?: string;
  ativa: boolean;
  eh_ia: boolean;
  em_beta?: boolean;
  ordem?: number;
}

interface OrganizarFuncoesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

type CategoriaTipo = 'lançadas' | 'desenvolvimento' | 'ia-lançadas' | 'ia-desenvolvimento' | 'beta' | 'ia-beta';

interface Categoria {
  id: CategoriaTipo;
  titulo: string;
  ativa?: boolean;
  eh_ia?: boolean;
  em_beta?: boolean;
}

const CATEGORIAS: Categoria[] = [
  { id: 'lançadas', titulo: 'Funções Lançadas', ativa: true, eh_ia: false },
  { id: 'desenvolvimento', titulo: 'Funções em Desenvolvimento', ativa: false, eh_ia: false },
  { id: 'ia-lançadas', titulo: 'Funções de IA Lançadas', ativa: true, eh_ia: true },
  { id: 'ia-desenvolvimento', titulo: 'Funções de IA em Desenvolvimento', ativa: false, eh_ia: true },
  { id: 'beta', titulo: 'Funções em Beta', em_beta: true },
  { id: 'ia-beta', titulo: 'Funções de IA em Beta', em_beta: true, eh_ia: true },
];

// Componente para renderizar funções de uma categoria com drag and drop
interface CategoriaFuncoesProps {
  categoria: Categoria;
  funcoes: Funcao[];
  todasFuncoes: Funcao[];
  onReorder: (categoria: CategoriaTipo, novasFuncoes: Funcao[]) => void;
  onRestaurarPadrao: (categoria: CategoriaTipo) => void;
  loading: boolean;
}

const CategoriaFuncoes = ({ categoria, funcoes, todasFuncoes, onReorder, onRestaurarPadrao, loading }: CategoriaFuncoesProps) => {
  const [dragOverCategoria, setDragOverCategoria] = useState(false);
  const [funcaoArrastando, setFuncaoArrastando] = useState<Funcao | null>(null);

  // Garantir que todas as funções tenham ID
  const funcoesComIds = funcoes.map((f, index) => ({
    ...f,
    id: f.id || index
  }));

  // Usar o hook useDragAndDrop apenas para esta categoria
  const {
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
    handleDragLeave,
  } = useDragAndDrop(funcoesComIds, (novasFuncoes) => {
    onReorder(categoria.id, novasFuncoes);
  });

  const handleDragStartItem = (e: React.DragEvent, funcao: Funcao) => {
    const funcaoCompleta = todasFuncoes.find(f => f.id === funcao.id) || funcao;
    setFuncaoArrastando(funcaoCompleta);
    handleDragStart(e, funcao.id || 0, 'item');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('funcao-id', String(funcao.id || 0));
    e.dataTransfer.setData('categoria-origem', categoria.id);
    e.dataTransfer.setData('application/json', JSON.stringify(funcaoCompleta));
  };

  const handleDragOverCategoria = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCategoria(true);
  };

  const handleDragLeaveCategoria = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverCategoria(false);
    }
  };

  const handleDropCategoria = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCategoria(false);

    try {
      const funcaoData = e.dataTransfer.getData('application/json');
      if (!funcaoData) {
        // Tentar obter do estado como fallback
        if (!funcaoArrastando) return;
        const funcaoJaNaCategoria = funcoes.find(f => f.id === funcaoArrastando.id);
        if (funcaoJaNaCategoria) return;
        const novasFuncoes = [...funcoes, funcaoArrastando];
        onReorder(categoria.id, novasFuncoes);
        setFuncaoArrastando(null);
        return;
      }

      const funcaoArrastada: Funcao = JSON.parse(funcaoData);
      
      // Se a função já está nesta categoria, apenas reordenar (deixa o drag and drop interno lidar)
      const funcaoJaNaCategoria = funcoes.find(f => f.id === funcaoArrastada.id);
      if (funcaoJaNaCategoria) {
        setFuncaoArrastando(null);
        return;
      }

      // Adicionar função à categoria
      const novasFuncoes = [...funcoes, funcaoArrastada];
      onReorder(categoria.id, novasFuncoes);
    } catch (error) {
      console.error('Erro ao processar drop:', error);
    }
    setFuncaoArrastando(null);
  };

  const handleDragEndItem = (e: React.DragEvent) => {
    handleDragEnd(e);
    setFuncaoArrastando(null);
    setDragOverCategoria(false);
  };

  return (
    <div 
      className={`funcao-categoria ${dragOverCategoria ? 'drag-over-categoria' : ''}`}
      onDragOver={handleDragOverCategoria}
      onDragLeave={handleDragLeaveCategoria}
      onDrop={handleDropCategoria}
    >
      <div className="funcao-categoria-header">
        <div className="funcao-categoria-header-left">
          <h3>{categoria.titulo}</h3>
          <span className="funcao-categoria-count">
            {funcoes.length} {funcoes.length === 1 ? 'função' : 'funções'}
          </span>
        </div>
      </div>
      <div className="funcoes-list">
        {funcoes.length === 0 ? (
          <p className="empty-categoria">Nenhuma função nesta categoria</p>
        ) : (
          <>
            {funcoesComIds.map((funcao) => {
              const funcaoId = funcao.id;
              return (
                <div
                  key={funcaoId}
                  className="funcao-item"
                  draggable
                  onDragStart={(e) => handleDragStartItem(e, funcao)}
                  onDragEnd={handleDragEndItem}
                  onDragOver={(e) => handleDragOver(e, funcaoId)}
                  onDrop={(e) => handleDrop(e, funcaoId)}
                  onDragLeave={handleDragLeave}
                >
                  <div className="funcao-drag-handle">
                    <FaGripVertical />
                  </div>
                  <div className="funcao-content">
                    <div className="funcao-titulo">
                      <strong>{funcao.titulo}</strong>
                    </div>
                    <div className="funcao-descricao">
                      {funcao.descricao}
                    </div>
                  </div>
                </div>
              );
            })}
            <button
              onClick={() => onRestaurarPadrao(categoria.id)}
              className="btn-secondary btn-restaurar-categoria"
              disabled={loading || funcoes.length === 0}
              title={`Restaurar ordem padrão de ${categoria.titulo}`}
              style={{ marginTop: '12px', width: '100%' }}
            >
              <FaUndo /> Restaurar Padrão
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const OrganizarFuncoesModal = ({ isOpen, onClose, onUpdate }: OrganizarFuncoesModalProps) => {
  const [funcoes, setFuncoes] = useState<Funcao[]>([]);
  const [loading, setLoading] = useState(false);
  // Guardar ordem padrão quando o modal é aberto
  const ordemPadraoRef = useRef<Map<number, number>>(new Map());

  useEffect(() => {
    if (isOpen) {
      carregarFuncoes();
    }
  }, [isOpen]);

  const carregarFuncoes = async () => {
    try {
      setLoading(true);
      const funcoesCarregadas = await apiService.obterFuncoes();
      setFuncoes(funcoesCarregadas);
      
      // Salvar ordem padrão (ordem atual quando o modal é aberto)
      ordemPadraoRef.current.clear();
      funcoesCarregadas.forEach(f => {
        if (f.id) {
          ordemPadraoRef.current.set(f.id, f.ordem || 0);
        }
      });
    } catch (error) {
      console.error('Erro ao carregar funções:', error);
      await mostrarAlert('Erro', 'Erro ao carregar funções. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Agrupar funções por categoria
  const funcoesPorCategoria = CATEGORIAS.reduce((acc, categoria) => {
    acc[categoria.id] = funcoes
      .filter(f => {
        // Para categorias beta, verificar em_beta
        if (categoria.em_beta !== undefined) {
          if (categoria.id === 'ia-beta') {
            // Funções de IA em Beta: em_beta = true E eh_ia = true
            return f.em_beta === true && f.eh_ia === true;
          } else if (categoria.id === 'beta') {
            // Funções em Beta: em_beta = true E eh_ia = false (não-IA)
            return f.em_beta === true && f.eh_ia === false;
          }
        }
        // Para outras categorias, usar lógica original, mas excluir funções em beta
        // Funções em beta não devem aparecer em "Funções Lançadas" ou "Funções de IA Lançadas"
        if (f.em_beta === true) {
          return false; // Funções em beta não aparecem em categorias normais
        }
        return f.ativa === categoria.ativa && f.eh_ia === categoria.eh_ia;
      })
      .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
    return acc;
  }, {} as Record<CategoriaTipo, Funcao[]>);

  // Restaurar ordem padrão de uma categoria específica
  const handleRestaurarPadraoCategoria = async (categoria: CategoriaTipo) => {
    try {
      setLoading(true);
      
      // Obter funções da categoria atual
      const funcoesDaCategoria = funcoes.filter(f => {
        const categoriaFuncao = CATEGORIAS.find(c => {
          // Para categorias beta, verificar em_beta
          if (c.em_beta !== undefined) {
            if (c.id === 'ia-beta') {
              return f.em_beta === true && f.eh_ia === true;
            } else if (c.id === 'beta') {
              return f.em_beta === true;
            }
          }
          // Para outras categorias, usar lógica original
          return c.ativa === f.ativa && c.eh_ia === f.eh_ia;
        });
        return categoriaFuncao?.id === categoria;
      });
      
      // Restaurar ordem padrão para cada função da categoria
      const funcoesRestauradas = funcoesDaCategoria.map(f => ({
        ...f,
        ordem: ordemPadraoRef.current.get(f.id || 0) || 0
      }));
      
      // Ordenar pela ordem padrão
      funcoesRestauradas.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
      
      // Atualizar todas as funções mantendo outras categorias intactas
      const outrasFuncoes = funcoes.filter(f => {
        const categoriaFuncao = CATEGORIAS.find(c => {
          // Para categorias beta, verificar em_beta
          if (c.em_beta !== undefined) {
            if (c.id === 'ia-beta') {
              return f.em_beta === true && f.eh_ia === true;
            } else if (c.id === 'beta') {
              return f.em_beta === true;
            }
          }
          // Para outras categorias, usar lógica original
          return c.ativa === f.ativa && c.eh_ia === f.eh_ia;
        });
        return categoriaFuncao?.id !== categoria;
      });
      
      const todasFuncoes = [...outrasFuncoes, ...funcoesRestauradas];
      setFuncoes(todasFuncoes);
      
      // Salvar no servidor
      for (const funcao of todasFuncoes) {
        if (funcao.id) {
          await apiService.atualizarFuncao(funcao.id, {
            titulo: funcao.titulo,
            descricao: funcao.descricao,
            icone: funcao.icone || null,
            icone_upload: funcao.icone_upload || null,
            ativa: funcao.ativa,
            eh_ia: funcao.eh_ia,
            em_beta: funcao.em_beta || false,
            ordem: funcao.ordem || 0
          });
        }
      }
      
      // Disparar evento para atualizar na landing page
      window.dispatchEvent(new CustomEvent('funcoes-updated'));
      onUpdate();
      
      await mostrarAlert('Sucesso', `Ordem padrão de ${CATEGORIAS.find(c => c.id === categoria)?.titulo} restaurada!`);
    } catch (error) {
      console.error('Erro ao restaurar ordem padrão da categoria:', error);
      await mostrarAlert('Erro', 'Erro ao restaurar ordem padrão. Tente novamente.');
      await carregarFuncoes();
    } finally {
      setLoading(false);
    }
  };

  // Restaurar ordem padrão de todas as funções
  const handleRestaurarPadraoTodas = async () => {
    try {
      setLoading(true);
      
      // Restaurar ordem padrão para todas as funções
      const funcoesRestauradas = funcoes.map(f => ({
        ...f,
        ordem: ordemPadraoRef.current.get(f.id || 0) || 0
      }));
      
      // Ordenar pela ordem padrão
      funcoesRestauradas.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
      
      setFuncoes(funcoesRestauradas);
      
      // Salvar no servidor
      for (const funcao of funcoesRestauradas) {
        if (funcao.id) {
          await apiService.atualizarFuncao(funcao.id, {
            titulo: funcao.titulo,
            descricao: funcao.descricao,
            icone: funcao.icone || null,
            icone_upload: funcao.icone_upload || null,
            ativa: funcao.ativa,
            eh_ia: funcao.eh_ia,
            em_beta: funcao.em_beta || false,
            ordem: funcao.ordem || 0
          });
        }
      }
      
      // Disparar evento para atualizar na landing page
      window.dispatchEvent(new CustomEvent('funcoes-updated'));
      onUpdate();
      
      await mostrarAlert('Sucesso', 'Ordem padrão de todas as funções restaurada!');
    } catch (error) {
      console.error('Erro ao restaurar ordem padrão de todas as funções:', error);
      await mostrarAlert('Erro', 'Erro ao restaurar ordem padrão. Tente novamente.');
      await carregarFuncoes();
    } finally {
      setLoading(false);
    }
  };

  // Drag and drop para reordenar funções dentro de uma categoria específica
  const handleReorderFuncoesCategoria = async (categoria: CategoriaTipo, novasFuncoesCategoria: Funcao[]) => {
    const categoriaInfo = CATEGORIAS.find(c => c.id === categoria);
    if (!categoriaInfo) return;

    // Identificar funções que estavam na categoria antes
    const funcoesAnterioresNaCategoria = funcoes.filter(f => {
      if (categoriaInfo.em_beta !== undefined) {
        if (categoriaInfo.id === 'ia-beta') {
          return f.em_beta === true && f.eh_ia === true;
        } else if (categoriaInfo.id === 'beta') {
          return f.em_beta === true && f.eh_ia === false;
        }
      }
      return f.ativa === categoriaInfo.ativa && f.eh_ia === categoriaInfo.eh_ia;
    });

    // Identificar funções que foram adicionadas à categoria (não estavam antes)
    const funcoesAdicionadas = novasFuncoesCategoria.filter(nova => 
      !funcoesAnterioresNaCategoria.some(antiga => antiga.id === nova.id)
    );

    // Identificar funções que foram removidas da categoria (estavam antes mas não estão mais)
    const funcoesRemovidas = funcoesAnterioresNaCategoria.filter(antiga =>
      !novasFuncoesCategoria.some(nova => nova.id === antiga.id)
    );

    // Atualizar propriedades das funções baseado na categoria
    const funcoesAtualizadas = funcoes.map(f => {
      // Se a função foi adicionada à categoria beta, atualizar em_beta
      if (categoriaInfo.id === 'beta' && funcoesAdicionadas.some(adicionada => adicionada.id === f.id)) {
        return { ...f, em_beta: true };
      }
      
      // Se a função foi adicionada à categoria ia-beta, atualizar em_beta e garantir eh_ia
      if (categoriaInfo.id === 'ia-beta' && funcoesAdicionadas.some(adicionada => adicionada.id === f.id)) {
        return { ...f, em_beta: true, eh_ia: true };
      }
      
      // Se a função foi removida da categoria beta, atualizar em_beta para false
      if ((categoriaInfo.id === 'beta' || categoriaInfo.id === 'ia-beta') && 
          funcoesRemovidas.some(removida => removida.id === f.id)) {
        return { ...f, em_beta: false };
      }
      
      return f;
    });

    // Criar nova lista completa mantendo outras categorias intactas
    const outrasFuncoes = funcoesAtualizadas.filter(f => {
      const categoriaFuncao = CATEGORIAS.find(c => {
        // Para categorias beta, verificar em_beta
        if (c.em_beta !== undefined) {
          if (c.id === 'ia-beta') {
            return f.em_beta === true && f.eh_ia === true;
          } else if (c.id === 'beta') {
            return f.em_beta === true && f.eh_ia === false;
          }
        }
        // Para outras categorias, usar lógica original
        return c.ativa === f.ativa && c.eh_ia === f.eh_ia && (c.em_beta === undefined || f.em_beta === false);
      });
      return categoriaFuncao?.id !== categoria;
    });
    
    // Atualizar as funções que estão na nova categoria com as propriedades corretas
    const novasFuncoesComPropriedades = novasFuncoesCategoria.map(f => {
      const funcaoOriginal = funcoesAtualizadas.find(orig => orig.id === f.id) || f;
      
      // Se está sendo movida para beta, garantir em_beta = true
      if (categoriaInfo.id === 'beta') {
        return { ...funcaoOriginal, em_beta: true, eh_ia: false };
      }
      
      // Se está sendo movida para ia-beta, garantir em_beta = true e eh_ia = true
      if (categoriaInfo.id === 'ia-beta') {
        return { ...funcaoOriginal, em_beta: true, eh_ia: true };
      }
      
      // Para outras categorias, garantir em_beta = false
      if (categoriaInfo.em_beta === undefined) {
        return { ...funcaoOriginal, em_beta: false };
      }
      
      return funcaoOriginal;
    });
    
    const todasFuncoes = [...outrasFuncoes, ...novasFuncoesComPropriedades];
    
    // Recalcular ordem sequencial dentro da categoria específica
    const funcoesDaCategoria = todasFuncoes
      .filter(f => {
        const categoriaFuncao = CATEGORIAS.find(c => {
          // Para categorias beta, verificar em_beta
          if (c.em_beta !== undefined) {
            if (c.id === 'ia-beta') {
              return f.em_beta === true && f.eh_ia === true;
            } else if (c.id === 'beta') {
              return f.em_beta === true && f.eh_ia === false;
            }
          }
          // Para outras categorias, usar lógica original
          return c.ativa === f.ativa && c.eh_ia === f.eh_ia && (c.em_beta === undefined || f.em_beta === false);
        });
        return categoriaFuncao?.id === categoria;
      })
      .sort((a, b) => {
        const indexA = novasFuncoesComPropriedades.findIndex(f => f.id === a.id);
        const indexB = novasFuncoesComPropriedades.findIndex(f => f.id === b.id);
        return indexA - indexB;
      });
    
    funcoesDaCategoria.forEach((funcao, ordem) => {
      const funcaoIndex = todasFuncoes.findIndex(f => f.id === funcao.id);
      if (funcaoIndex !== -1) {
        todasFuncoes[funcaoIndex].ordem = ordem;
      }
    });
    
    // Atualizar estado local
    setFuncoes(todasFuncoes);
    
    try {
      // Salvar no servidor
      for (const funcao of todasFuncoes) {
        if (funcao.id) {
          await apiService.atualizarFuncao(funcao.id, {
            titulo: funcao.titulo,
            descricao: funcao.descricao,
            icone: funcao.icone || null,
            icone_upload: funcao.icone_upload || null,
            ativa: funcao.ativa,
            eh_ia: funcao.eh_ia,
            em_beta: funcao.em_beta || false,
            ordem: funcao.ordem || 0
          });
        }
      }

      // Disparar evento para atualizar na landing page
      window.dispatchEvent(new CustomEvent('funcoes-updated'));
      
      // Chamar callback para atualizar o modal principal
      onUpdate();
    } catch (error) {
      console.error('Erro ao atualizar ordem das funções:', error);
      await mostrarAlert('Erro', 'Erro ao atualizar ordem das funções. Tente novamente.');
      await carregarFuncoes();
    }
  };


  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Organizar Funções"
      size="large"
      className="modal-nested"
      footer={
        <>
          <button onClick={handleRestaurarPadraoTodas} className="btn-secondary" disabled={loading} style={{ fontSize: '0.75rem', lineHeight: '1.2' }}>
            <FaUndo /> Restaurar Padrões (Todos)
          </button>
          <button onClick={onClose} className="btn-secondary" disabled={loading} style={{ fontSize: '0.75rem', lineHeight: '1.2' }}>Fechar</button>
        </>
      }
    >
      <div className="organizar-funcoes-container">
        {loading && funcoes.length === 0 ? (
          <div className="loading">Carregando...</div>
        ) : (
          <div className="funcoes-categorias">
            {CATEGORIAS.map((categoria) => {
              const funcoesDaCategoria = funcoesPorCategoria[categoria.id] || [];
              
              return (
                <CategoriaFuncoes
                  key={categoria.id}
                  categoria={categoria}
                  funcoes={funcoesDaCategoria}
                  todasFuncoes={funcoes}
                  onReorder={handleReorderFuncoesCategoria}
                  onRestaurarPadrao={handleRestaurarPadraoCategoria}
                  loading={loading}
                />
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default OrganizarFuncoesModal;

