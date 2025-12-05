import { useState, useEffect } from 'react';
import { FaGripVertical } from 'react-icons/fa';
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
}

const CategoriaFuncoes = ({ categoria, funcoes, onReorder }: CategoriaFuncoesProps) => {
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
        <h3>{categoria.titulo}</h3>
        <span className="funcao-categoria-count">
          {funcoes.length} {funcoes.length === 1 ? 'função' : 'funções'}
        </span>
      </div>
      <div className="funcoes-list">
        {funcoes.length === 0 ? (
          <p className="empty-categoria">Nenhuma função nesta categoria</p>
        ) : (
          funcoesComIds.map((funcao) => {
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
          })
        )}
      </div>
    </div>
  );
};

const OrganizarFuncoesModal = ({ isOpen, onClose, onUpdate }: OrganizarFuncoesModalProps) => {
  const [funcoes, setFuncoes] = useState<Funcao[]>([]);
  const [loading, setLoading] = useState(false);

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
