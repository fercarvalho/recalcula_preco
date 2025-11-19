import { useState } from 'react';
import { apiService } from '../services/api';
import { mostrarAlert } from '../utils/modals';
import AdicionarCategoriaModal from './AdicionarCategoriaModal';
import EditarItemModal from './EditarItemModal';
import { FaPlusCircle, FaFolderPlus, FaStore, FaCog } from 'react-icons/fa';
import './AdicionarProdutoSection.css';

interface AdicionarProdutoSectionProps {
  onItemAdded: () => void;
  categorias: string[];
  onOpenPlataformas?: () => void;
  onOpenPainelAdmin?: () => void;
}

const AdicionarProdutoSection = ({ onItemAdded, categorias, onOpenPlataformas, onOpenPainelAdmin }: AdicionarProdutoSectionProps) => {
  const [showAdicionarCategoriaModal, setShowAdicionarCategoriaModal] = useState(false);
  const [showEditarItemModal, setShowEditarItemModal] = useState(false);

  const handleAdicionarProduto = () => {
    if (categorias.length === 0) {
      mostrarAlert('Atenção', 'Não há categorias disponíveis. Por favor, crie uma categoria primeiro.');
      return;
    }
    setShowEditarItemModal(true);
  };

  const handleSalvarItem = () => {
    onItemAdded();
    setShowEditarItemModal(false);
  };

  const handleAdicionarCategoria = () => {
    setShowAdicionarCategoriaModal(true);
  };

  const handleSalvarCategoria = async (nome: string, icone: string | null) => {
    try {
      await apiService.criarCategoria(nome, icone);
      await mostrarAlert('Sucesso', `Categoria "${nome}" criada com sucesso!`);
      onItemAdded();
    } catch (error: any) {
      const mensagemErro = error.response?.data?.error || error.message || 'Erro ao criar a categoria. Tente novamente.';
      if (mensagemErro.includes('UNIQUE') || mensagemErro.includes('já existe')) {
        await mostrarAlert('Erro', 'Esta categoria já existe!');
      } else {
        await mostrarAlert('Erro', mensagemErro);
      }
    }
  };

  return (
    <>
      <div className="adicionar-produto-section">
        <button onClick={handleAdicionarProduto} className="btn-adicionar-produto">
          <FaPlusCircle /> Adicionar Novo Produto
        </button>
        <button onClick={handleAdicionarCategoria} className="btn-adicionar-produto">
          <FaFolderPlus /> Adicionar Categoria
        </button>
        {onOpenPlataformas && (
          <button onClick={onOpenPlataformas} className="btn-adicionar-produto btn-plataformas">
            <FaStore /> Gerenciar Plataformas
          </button>
        )}
        {onOpenPainelAdmin && (
          <button onClick={onOpenPainelAdmin} className="btn-adicionar-produto btn-admin">
            <FaCog /> Painel de Personalização
          </button>
        )}
      </div>
      <AdicionarCategoriaModal
        isOpen={showAdicionarCategoriaModal}
        onClose={() => setShowAdicionarCategoriaModal(false)}
        onSave={handleSalvarCategoria}
      />
      <EditarItemModal
        isOpen={showEditarItemModal}
        item={null}
        categorias={categorias}
        modoAdicionar={true}
        onClose={() => setShowEditarItemModal(false)}
        onSave={handleSalvarItem}
      />
    </>
  );
};

export default AdicionarProdutoSection;

