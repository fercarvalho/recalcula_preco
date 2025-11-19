import { useState, useRef, useEffect } from 'react';
import type { Item } from '../types';
import { apiService } from '../services/api';
import { mostrarAlert, mostrarConfirm, mostrarPrompt } from '../utils/modals';
import ItemCard from './ItemCard';
import EditarItemModal from './EditarItemModal';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { FaGripVertical, FaChevronRight, FaChevronDown, FaPencilAlt, FaPlus, FaTrash } from 'react-icons/fa';
import './CategoriaGroup.css';

interface CategoriaGroupProps {
  categoria: string;
  itens: Item[];
  itensSelecionados: Set<number>;
  isCollapsed: boolean;
  categorias: string[];
  onToggleItem: (itemId: number) => void;
  onToggleCategoria: () => void;
  onToggleCategoriaSelecionada: () => void;
  onItemUpdated: () => void;
  onDragStart: (e: React.DragEvent, categoria: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent, categoria: string) => void;
  onDrop: (e: React.DragEvent, categoria: string) => void;
  onDragLeave: (e: React.DragEvent) => void;
}

const CategoriaGroup = ({
  categoria,
  itens,
  itensSelecionados,
  isCollapsed,
  categorias,
  onToggleItem,
  onToggleCategoria,
  onToggleCategoriaSelecionada,
  onItemUpdated,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onDragLeave,
}: CategoriaGroupProps) => {
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const checkboxRef = useRef<HTMLInputElement>(null);

  // Drag and drop para itens dentro da categoria
  const itemDragDrop = useDragAndDrop(
    itens,
    async (newOrder) => {
      const itensIds = newOrder.map(item => item.id);
      try {
        await apiService.atualizarOrdemItens(categoria, itensIds);
        onItemUpdated();
      } catch (error) {
        console.error('Erro ao salvar ordem dos itens:', error);
      }
    }
  );

  const handleEditarItem = (item: Item) => {
    setEditingItem(item);
    setShowEditModal(true);
  };

  const handleSalvarItem = () => {
    onItemUpdated();
    setShowEditModal(false);
    setEditingItem(null);
  };

  const handleDeletarItem = async (itemId: number) => {
    const confirmado = await mostrarConfirm('Confirmar Exclusão', 'Tem certeza que deseja deletar este item?');
    if (!confirmado) {
      return;
    }

    try {
      await apiService.deletarItem(itemId);
      await mostrarAlert('Sucesso', 'Item excluído com sucesso!');
      onItemUpdated();
    } catch (error) {
      console.error('Erro ao deletar item:', error);
      await mostrarAlert('Erro', 'Erro ao deletar item. Tente novamente.');
    }
  };

  const handleRenomearCategoria = async () => {
    const novoNome = await mostrarPrompt('Renomear Categoria', 'Digite o novo nome da categoria:', categoria);
    if (!novoNome || novoNome.trim() === '' || novoNome.trim() === categoria) {
      return;
    }

    try {
      await apiService.renomearCategoria(categoria, novoNome.trim());
      await mostrarAlert('Sucesso', `Categoria renomeada de "${categoria}" para "${novoNome.trim()}" com sucesso!`);
      onItemUpdated();
    } catch (error: any) {
      const mensagemErro = error.response?.data?.error || error.message || 'Erro ao renomear a categoria. Tente novamente.';
      await mostrarAlert('Erro', mensagemErro);
    }
  };

  const handleDeletarCategoria = async () => {
    const quantidadeItens = itens.length;
    const mensagem = quantidadeItens > 0
      ? `Tem certeza que deseja deletar a categoria "${categoria}"?\n\nEsta ação irá deletar a categoria e todos os ${quantidadeItens} item(ns) contidos nela.\n\n⚠️ Esta ação NÃO pode ser desfeita!`
      : `Tem certeza que deseja deletar a categoria "${categoria}"?\n\n⚠️ Esta ação NÃO pode ser desfeita!`;
    
    const confirmado = await mostrarConfirm('Confirmar Exclusão de Categoria', mensagem);
    if (!confirmado) {
      return;
    }

    try {
      await apiService.deletarCategoria(categoria);
      await mostrarAlert('Sucesso', `Categoria "${categoria}" e todos os seus itens foram deletados com sucesso!`);
      onItemUpdated();
    } catch (error: any) {
      const mensagemErro = error.message || 'Erro ao deletar a categoria. Tente novamente.';
      await mostrarAlert('Erro', mensagemErro);
    }
  };

  // Verificar se todos os itens da categoria estão selecionados
  const todosItensSelecionados = itens.length > 0 && itens.every(item => itensSelecionados.has(item.id));
  // Verificar se alguns (mas não todos) itens estão selecionados
  const algunsItensSelecionados = itens.some(item => itensSelecionados.has(item.id)) && !todosItensSelecionados;

  // Atualizar estado indeterminado do checkbox
  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = algunsItensSelecionados;
    }
  }, [algunsItensSelecionados]);

  return (
    <>
      <div
        className="categoria-group"
        draggable
        onDragStart={(e) => onDragStart(e, categoria)}
        onDragEnd={onDragEnd}
        onDragOver={(e) => onDragOver(e, categoria)}
        onDrop={(e) => onDrop(e, categoria)}
        onDragLeave={onDragLeave}
      >
        <div
          className="categoria-header"
          onClick={onToggleCategoria}
        >
          <div className="categoria-header-left">
            <span className="drag-handle" title="Arrastar para reordenar" onClick={(e) => e.stopPropagation()}>
              <FaGripVertical />
            </span>
            <input
              type="checkbox"
              ref={checkboxRef}
              checked={todosItensSelecionados}
              onChange={(e) => {
                e.stopPropagation();
                onToggleCategoriaSelecionada();
              }}
              onClick={(e) => e.stopPropagation()}
              className="categoria-checkbox"
              title={todosItensSelecionados ? 'Deselecionar todos os itens' : 'Selecionar todos os itens'}
            />
            <h3>
              {isCollapsed ? <FaChevronRight /> : <FaChevronDown />}
              {categoria}
            </h3>
            <button
              className="btn-editar-categoria"
              onClick={(e) => {
                e.stopPropagation();
                handleRenomearCategoria();
              }}
              title="Editar nome da categoria"
            >
              <FaPencilAlt />
            </button>
            <span className="categoria-count">({itens.length})</span>
          </div>
          <div className="categoria-actions" onClick={(e) => e.stopPropagation()}>
            <button
              className="btn-adicionar-item"
              onClick={(e) => {
                e.stopPropagation();
                setEditingItem(null);
                setShowEditModal(true);
              }}
              title="Adicionar item"
            >
              <FaPlus />
            </button>
            <button
              className="btn-deletar-categoria"
              onClick={handleDeletarCategoria}
              title="Deletar categoria"
            >
              <FaTrash />
            </button>
          </div>
        </div>
        {!isCollapsed && (
          <div className="itens-grid">
            {itens.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => itemDragDrop.handleDragStart(e, item.id, 'item')}
                onDragEnd={itemDragDrop.handleDragEnd}
                onDragOver={(e) => itemDragDrop.handleDragOver(e, item.id)}
                onDrop={(e) => itemDragDrop.handleDrop(e, item.id)}
                onDragLeave={itemDragDrop.handleDragLeave}
              >
                <ItemCard
                  item={item}
                  isSelected={itensSelecionados.has(item.id)}
                  onToggleSelect={() => onToggleItem(item.id)}
                  onEdit={() => handleEditarItem(item)}
                  onDelete={handleDeletarItem}
                  onItemUpdated={onItemUpdated}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      <EditarItemModal
        isOpen={showEditModal}
        item={editingItem}
        categorias={categorias}
        categoriaAtual={editingItem ? categoria : undefined}
        modoAdicionar={!editingItem}
        onClose={() => {
          setShowEditModal(false);
          setEditingItem(null);
        }}
        onSave={handleSalvarItem}
      />
    </>
  );
};

export default CategoriaGroup;

