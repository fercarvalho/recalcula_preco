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
  ordem?: number;
}

interface OrganizarFuncoesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

type CategoriaTipo = 'lançadas' | 'desenvolvimento' | 'ia-lançadas' | 'ia-desenvolvimento';

interface Categoria {
  id: CategoriaTipo;
  titulo: string;
  ativa: boolean;
  eh_ia: boolean;
}

const CATEGORIAS: Categoria[] = [
  { id: 'lançadas', titulo: 'Funções Lançadas', ativa: true, eh_ia: false },
  { id: 'desenvolvimento', titulo: 'Funções em Desenvolvimento', ativa: false, eh_ia: false },
  { id: 'ia-lançadas', titulo: 'Funções de IA Lançadas', ativa: true, eh_ia: true },
  { id: 'ia-desenvolvimento', titulo: 'Funções de IA em Desenvolvimento', ativa: false, eh_ia: true },
];

// Componente para renderizar funções de uma categoria com drag and drop
interface CategoriaFuncoesProps {
  categoria: Categoria;
  funcoes: Funcao[];
  onReorder: (categoria: CategoriaTipo, novasFuncoes: Funcao[]) => void;
  onRestaurarPadrao: (categoria: CategoriaTipo) => void;
  loading: boolean;
}

const CategoriaFuncoes = ({ categoria, funcoes, onReorder, onRestaurarPadrao, loading }: CategoriaFuncoesProps) => {
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

  return (
    <div className="funcao-categoria">
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
                  onDragStart={(e) => handleDragStart(e, funcaoId, 'item')}
                  onDragEnd={handleDragEnd}
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
      .filter(f => f.ativa === categoria.ativa && f.eh_ia === categoria.eh_ia)
      .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
    return acc;
  }, {} as Record<CategoriaTipo, Funcao[]>);

  // Restaurar ordem padrão de uma categoria específica
  const handleRestaurarPadraoCategoria = async (categoria: CategoriaTipo) => {
    try {
      setLoading(true);
      
      // Obter funções da categoria atual
      const funcoesDaCategoria = funcoes.filter(f => {
        const categoriaFuncao = CATEGORIAS.find(c => c.ativa === f.ativa && c.eh_ia === f.eh_ia);
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
        const categoriaFuncao = CATEGORIAS.find(c => c.ativa === f.ativa && c.eh_ia === f.eh_ia);
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
    // Criar nova lista completa mantendo outras categorias intactas
    const outrasFuncoes = funcoes.filter(f => {
      const categoriaFuncao = CATEGORIAS.find(c => c.ativa === f.ativa && c.eh_ia === f.eh_ia);
      return categoriaFuncao?.id !== categoria;
    });
    const todasFuncoes = [...outrasFuncoes, ...novasFuncoesCategoria];
    
    // Recalcular ordem sequencial dentro da categoria específica
    const funcoesDaCategoria = todasFuncoes
      .filter(f => {
        const categoriaFuncao = CATEGORIAS.find(c => c.ativa === f.ativa && c.eh_ia === f.eh_ia);
        return categoriaFuncao?.id === categoria;
      })
      .sort((a, b) => {
        const indexA = todasFuncoes.findIndex(f => f.id === a.id);
        const indexB = todasFuncoes.findIndex(f => f.id === b.id);
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
          <button onClick={handleRestaurarPadraoTodas} className="btn-secondary" disabled={loading}>
            <FaUndo /> Restaurar Padrões (Todos)
          </button>
          <button onClick={onClose} className="btn-secondary" disabled={loading}>Fechar</button>
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
