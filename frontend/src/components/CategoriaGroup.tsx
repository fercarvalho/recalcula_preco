import { useState } from 'react';
import type { Item } from '../types';
import { apiService } from '../services/api';
import { mostrarAlert, mostrarConfirm } from '../utils/modals';
import ItemCard from './ItemCard';
import EditarItemModal from './EditarItemModal';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import './CategoriaGroup.css';

interface CategoriaGroupProps {
  categoria: string;
  itens: Item[];
  itensSelecionados: Set<number>;
  isCollapsed: boolean;
  categorias: string[];
  onToggleItem: (itemId: number) => void;
  onToggleCategoria: () => void;
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
  onItemUpdated,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onDragLeave,
}: CategoriaGroupProps) => {
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

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
            <span className="drag-handle" title="Arrastar para reordenar">
              <i className="fas fa-grip-vertical"></i>
            </span>
            <h3>
              <i className={`fas fa-chevron-${isCollapsed ? 'right' : 'down'}`}></i>
              {categoria}
              <span className="categoria-count">({itens.length})</span>
            </h3>
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
              <i className="fas fa-plus"></i>
            </button>
            <button
              className="btn-deletar-categoria"
              onClick={handleDeletarCategoria}
              title="Deletar categoria"
            >
              <i className="fas fa-trash"></i>
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

