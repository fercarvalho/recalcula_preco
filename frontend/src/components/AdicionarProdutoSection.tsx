import { useState } from 'react';
import { apiService } from '../services/api';
import { mostrarAlert, mostrarPrompt, mostrarPromptNumber } from '../utils/modals';
import SelecaoCategoriaModal from './SelecaoCategoriaModal';
import AdicionarCategoriaModal from './AdicionarCategoriaModal';
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
  const [showAdicionarCategoriaModal, setShowAdicionarCategoriaModal] = useState(false);
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
      <SelecaoCategoriaModal
        isOpen={showCategoriaModal}
        categorias={categorias}
        onSelect={handleCategoriaSelecionada}
        onClose={() => {
          setShowCategoriaModal(false);
          setProdutoData(null);
        }}
      />
      <AdicionarCategoriaModal
        isOpen={showAdicionarCategoriaModal}
        onClose={() => setShowAdicionarCategoriaModal(false)}
        onSave={handleSalvarCategoria}
      />
    </>
  );
};

export default AdicionarProdutoSection;

