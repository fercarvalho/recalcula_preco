import { FaPlusCircle, FaFolderPlus, FaStore, FaCog } from 'react-icons/fa';
import './AdicionarProdutoSection.css';

interface AdicionarProdutoSectionDemoProps {
  categorias: string[];
  onItemAdded: () => void;
  onOpenPlataformas?: () => void;
  onOpenPainelAdmin?: () => void;
  onOpenAdicionarCategoria?: () => void;
  onOpenAdicionarItem?: () => void;
}

const AdicionarProdutoSectionDemo = ({
  categorias,
  onItemAdded,
  onOpenPlataformas,
  onOpenPainelAdmin,
  onOpenAdicionarCategoria,
  onOpenAdicionarItem,
}: AdicionarProdutoSectionDemoProps) => {
  return (
    <div className="adicionar-produto-section">
      <button onClick={onOpenAdicionarItem} className="btn-adicionar-produto">
        <FaPlusCircle /> Adicionar Novo Produto
      </button>
      <button onClick={onOpenAdicionarCategoria} className="btn-adicionar-produto">
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
  );
};

export default AdicionarProdutoSectionDemo;

