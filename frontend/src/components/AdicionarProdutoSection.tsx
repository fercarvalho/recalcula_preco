import { useState } from 'react';
import { apiService } from '../services/api';
import { mostrarAlert, mostrarPrompt, mostrarPromptNumber } from '../utils/modals';
import SelecaoCategoriaModal from './SelecaoCategoriaModal';
import { FaPlusCircle, FaFolderPlus, FaStore, FaCog } from 'react-icons/fa';
import './AdicionarProdutoSection.css';

interface AdicionarProdutoSectionProps {
  onItemAdded: () => void;
  categorias: string[];
  onOpenPlataformas?: () => void;
  onOpenPainelAdmin?: () => void;
}

const AdicionarProdutoSection = ({ onItemAdded, categorias, onOpenPlataformas, onOpenPainelAdmin }: AdicionarProdutoSectionProps) => {
  const [showCategoriaModal, setShowCategoriaModal] = useState(false);
  const [produtoData, setProdutoData] = useState<{ nome: string; valor: number } | null>(null);

  const handleAdicionarProduto = async () => {
    if (categorias.length === 0) {
      await mostrarAlert('Atenção', 'Não há categorias disponíveis. Por favor, crie uma categoria primeiro.');
      return;
    }

    const nome = await mostrarPrompt('Adicionar Produto', 'Digite o nome do novo produto:');
    if (!nome || nome.trim() === '') {
      return;
    }

    const valorStr = await mostrarPromptNumber('Adicionar Produto', 'Digite o preço do produto (ex: 10.50):');
    if (!valorStr) {
      return;
    }

    const valor = parseFloat(valorStr);
    if (isNaN(valor) || valor < 0) {
      await mostrarAlert('Erro', 'Valor inválido! O produto não foi adicionado.');
      return;
    }

    setProdutoData({ nome: nome.trim(), valor });
    setShowCategoriaModal(true);
  };

  const handleCategoriaSelecionada = async (categoria: string) => {
    setShowCategoriaModal(false);
    if (!produtoData) return;

    try {
      await apiService.criarItem(categoria, produtoData.nome, produtoData.valor);
      await mostrarAlert('Sucesso', 'Produto adicionado com sucesso!');
      setProdutoData(null);
      onItemAdded();
    } catch (error) {
      await mostrarAlert('Erro', 'Erro ao adicionar o produto. Tente novamente.');
    }
  };

  const handleAdicionarCategoria = async () => {
    const nome = await mostrarPrompt('Adicionar Categoria', 'Digite o nome da nova categoria:');
    if (!nome || nome.trim() === '') {
      return;
    }

    try {
      await apiService.criarCategoria(nome.trim());
      await mostrarAlert('Sucesso', `Categoria "${nome.trim()}" criada com sucesso!`);
      onItemAdded();
    } catch (error: any) {
      const mensagemErro = error.message?.includes('UNIQUE') 
        ? 'Esta categoria já existe!' 
        : 'Erro ao criar a categoria. Tente novamente.';
      await mostrarAlert('Erro', mensagemErro);
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
      <SelecaoCategoriaModal
        isOpen={showCategoriaModal}
        categorias={categorias}
        onSelect={handleCategoriaSelecionada}
        onClose={() => {
          setShowCategoriaModal(false);
          setProdutoData(null);
        }}
      />
    </>
  );
};

export default AdicionarProdutoSection;

