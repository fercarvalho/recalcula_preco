import { useState, useRef, useEffect } from 'react';
import type { Item } from '../types';
import { sessionStorageService } from '../services/sessionStorage';
import { mostrarAlert, mostrarConfirm, mostrarPrompt } from '../utils/modals';
import ItemCardDemo from './ItemCardDemo';
import EditarItemModalDemo from './EditarItemModalDemo';
import SelecionarIconeModal from './SelecionarIconeModal';
import { FaGripVertical, FaChevronRight, FaChevronDown, FaPencilAlt, FaPlus, FaTrash, FaFolder } from 'react-icons/fa';
import * as FaIcons from 'react-icons/fa';
import './CategoriaGroup.css';

interface CategoriaGroupDemoProps {
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
  temAcesso?: boolean;
  onAbrirModalPlanos?: () => void;
  temPlanoMasEmailNaoValidado?: boolean;
}

const CategoriaGroupDemo = ({
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
  temAcesso = true,
  onAbrirModalPlanos,
  temPlanoMasEmailNaoValidado = false,
}: CategoriaGroupDemoProps) => {
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showIconeModal, setShowIconeModal] = useState(false);
  const [iconeCategoria, setIconeCategoria] = useState<string | null>(null);
  const checkboxRef = useRef<HTMLInputElement>(null);

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
      sessionStorageService.deletarItem(itemId);
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
      sessionStorageService.renomearCategoria(categoria, novoNome.trim());
      await mostrarAlert('Sucesso', `Categoria renomeada de "${categoria}" para "${novoNome.trim()}" com sucesso!`);
      onItemUpdated();
    } catch (error: any) {
      await mostrarAlert('Erro', error.message || 'Erro ao renomear a categoria. Tente novamente.');
    }
  };

  const handleDeletarCategoria = async () => {
    const quantidadeItens = itens.length;
    const mensagem = quantidadeItens > 0
      ? `Tem certeza que deseja deletar a categoria "${categoria}"?\n\nEsta ação irá deletar a categoria e todos os ${quantidadeItens} item(ns) contidos nela.\n\nEsta ação NÃO pode ser desfeita!`
      : `Tem certeza que deseja deletar a categoria "${categoria}"?\n\nEsta ação NÃO pode ser desfeita!`;
    
    const confirmado = await mostrarConfirm('Confirmar Exclusão de Categoria', mensagem);
    if (!confirmado) {
      return;
    }

    try {
      sessionStorageService.deletarCategoria(categoria);
      await mostrarAlert('Sucesso', `Categoria "${categoria}" e todos os seus itens foram deletados com sucesso!`);
      onItemUpdated();
    } catch (error: any) {
      await mostrarAlert('Erro', error.message || 'Erro ao deletar a categoria. Tente novamente.');
    }
  };

  // Verificar se todos os itens da categoria estão selecionados
  const todosItensSelecionados = itens.length > 0 && itens.every(item => itensSelecionados.has(item.id));
  // Verificar se alguns (mas não todos) itens estão selecionados
  const algunsItensSelecionados = itens.some(item => itensSelecionados.has(item.id)) && !todosItensSelecionados;

  // Carregar ícone da categoria (simplificado - não salva ícone em sessionStorage por enquanto)
  useEffect(() => {
    setIconeCategoria(null);
  }, [categoria]);

  // Atualizar estado indeterminado do checkbox
  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = algunsItensSelecionados;
    }
  }, [algunsItensSelecionados]);

  const handleSelecionarIcone = async (icone: string) => {
    // Em versão demo, não salvamos ícone (pode ser adicionado depois se necessário)
    setIconeCategoria(icone);
    await mostrarAlert('Sucesso', 'Ícone da categoria atualizado!');
  };

  const renderIcone = () => {
    if (!iconeCategoria) {
      return <FaFolder />;
    }
    const IconComponent = (FaIcons as any)[iconeCategoria];
    if (!IconComponent) {
      return <FaFolder />;
    }
    return <IconComponent />;
  };

  return (
    <>
      <div
        className="categoria-group"
        draggable={false}
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
              <button
                className="btn-icone-categoria"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowIconeModal(true);
                }}
                title="Clique para alterar o ícone da categoria"
              >
                {renderIcone()}
              </button>
              {categoria}
            </h3>
            <div className="categoria-header-second-line">
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
              <div key={item.id}>
                <ItemCardDemo
                  item={item}
                  isSelected={itensSelecionados.has(item.id)}
                  onToggleSelect={() => onToggleItem(item.id)}
                  onEdit={() => handleEditarItem(item)}
                  onDelete={handleDeletarItem}
                  onItemUpdated={onItemUpdated}
                  temAcesso={temAcesso}
                  onAbrirModalPlanos={onAbrirModalPlanos}
                  temPlanoMasEmailNaoValidado={temPlanoMasEmailNaoValidado}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      <EditarItemModalDemo
        isOpen={showEditModal}
        item={editingItem}
        categorias={categorias}
        categoriaAtual={categoria}
        modoAdicionar={!editingItem}
        onClose={() => {
          setShowEditModal(false);
          setEditingItem(null);
        }}
        onSave={handleSalvarItem}
      />
      <SelecionarIconeModal
        isOpen={showIconeModal}
        iconeAtual={iconeCategoria}
        onClose={() => setShowIconeModal(false)}
        onSelect={handleSelecionarIcone}
      />
    </>
  );
};

export default CategoriaGroupDemo;

