import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { mostrarAlert } from '../utils/modals';
import AdicionarCategoriaModal from './AdicionarCategoriaModal';
import EditarItemModal from './EditarItemModal';
import { FaPlusCircle, FaFolderPlus, FaStore, FaCog, FaToggleOn, FaToggleOff, FaImage, FaFilePdf } from 'react-icons/fa';
import './AdicionarProdutoSection.css';

interface AdicionarProdutoSectionProps {
  onItemAdded: () => void;
  categorias: string[];
  onOpenPlataformas?: () => void;
  onOpenPainelAdmin?: () => void;
  onOpenAdicionarCategoria?: () => void;
  onOpenAdicionarItem?: () => void;
}

const AdicionarProdutoSection = ({ onItemAdded, categorias, onOpenPlataformas, onOpenPainelAdmin, onOpenAdicionarCategoria, onOpenAdicionarItem }: AdicionarProdutoSectionProps) => {
  const [showAdicionarCategoriaModal, setShowAdicionarCategoriaModal] = useState(false);
  const [showEditarItemModal, setShowEditarItemModal] = useState(false);
  const [cardapioPublico, setCardapioPublico] = useState(false);
  const [username, setUsername] = useState<string>('');

  // Carregar estado do cardápio público
  useEffect(() => {
    const carregarCardapioPublico = async () => {
      try {
        const response = await apiService.obterDadosUsuario();
        if (response.user) {
          setCardapioPublico(response.user.cardapio_publico === true);
          setUsername(response.user.username || '');
        }
      } catch (error) {
        console.error('Erro ao carregar estado do cardápio:', error);
      }
    };
    carregarCardapioPublico();
  }, []);

  const handleAdicionarProduto = () => {
    if (onOpenAdicionarItem) {
      onOpenAdicionarItem();
    } else {
      if (categorias.length === 0) {
        mostrarAlert('Atenção', 'Não há categorias disponíveis. Por favor, crie uma categoria primeiro.');
        return;
      }
      setShowEditarItemModal(true);
    }
  };

  const handleSalvarItem = () => {
    onItemAdded();
    setShowEditarItemModal(false);
  };

  const handleAdicionarCategoria = () => {
    if (onOpenAdicionarCategoria) {
      onOpenAdicionarCategoria();
    } else {
      setShowAdicionarCategoriaModal(true);
    }
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
      <div className="cardapio-section">
        <div className="cardapio-switch-container">
          <label className="cardapio-switch-label">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="cardapio-switch-text">Modo Cardápio</span>
              <span className="roadmap-tag">Em Beta</span>
            </div>
            <button
              type="button"
              onClick={async (e) => {
                e.preventDefault();
                const novoValor = !cardapioPublico;
                setCardapioPublico(novoValor);
                try {
                  await apiService.atualizarCardapioPublico(novoValor);
                  await mostrarAlert('Sucesso', `Cardápio ${novoValor ? 'tornado público' : 'tornado privado'} com sucesso!`);
                } catch (error: any) {
                  console.error('Erro ao atualizar cardápio público:', error);
                  setCardapioPublico(!novoValor); // Reverter em caso de erro
                  await mostrarAlert('Erro', 'Erro ao atualizar visibilidade do cardápio.');
                }
              }}
              className={`cardapio-switch-btn ${cardapioPublico ? 'active' : ''}`}
            >
              {cardapioPublico ? <FaToggleOn /> : <FaToggleOff />}
            </button>
          </label>
          <small className="cardapio-switch-description">
            {cardapioPublico 
              ? (
                <>
                  Seu cardápio está público. Acesse em:{' '}
                  <a 
                    href={`${window.location.origin}/${username}/cardapio`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontWeight: 'bold', color: 'var(--cor-primaria, #FF6B35)', textDecoration: 'none' }}
                  >
                    {window.location.origin}/{username}/cardapio
                  </a>
                </>
              )
              : 'Um modo especial para exibir seus produtos e preços como um cardápio digital, ideal para mostrar no estabelecimento ou compartilhar online com seus clientes.'}
          </small>
        </div>
      </div>
      <div className="cardapio-section">
        <div className="cardapio-switch-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span className="cardapio-switch-text">Modo Compartilhar Cardápio</span>
            <span className="roadmap-tag">Em Beta</span>
          </div>
          <small className="cardapio-switch-description" style={{ marginBottom: '1rem', display: 'block' }}>
            Compartilhe seu cardápio em diferentes formatos. Ative o modo cardápio para habilitar os botões.
          </small>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              className="btn-compartilhar-cardapio"
              disabled={!cardapioPublico}
              onClick={async () => {
                if (!cardapioPublico || !username) {
                  await mostrarAlert('Atenção', 'Ative o modo cardápio primeiro.');
                  return;
                }
                try {
                  // Abrir o cardápio em uma nova aba com parâmetro para gerar a imagem
                  const cardapioUrl = `${window.location.origin}/${username}/cardapio?gerar_imagem=true`;
                  window.open(cardapioUrl, '_blank');
                } catch (error: any) {
                  console.error('Erro ao gerar imagem do cardápio:', error);
                  await mostrarAlert('Erro', 'Erro ao gerar imagem do cardápio. Tente novamente.');
                }
              }}
              style={{
                opacity: cardapioPublico ? 1 : 0.5,
                cursor: cardapioPublico ? 'pointer' : 'not-allowed'
              }}
            >
              <FaImage /> Compartilhar Cardápio em Imagem
            </button>
            <button
              className="btn-compartilhar-cardapio"
              disabled={!cardapioPublico}
              onClick={async () => {
                if (!cardapioPublico || !username) {
                  await mostrarAlert('Atenção', 'Ative o modo cardápio primeiro.');
                  return;
                }
                try {
                  // Abrir o cardápio em uma nova aba com parâmetro para gerar o PDF
                  const cardapioUrl = `${window.location.origin}/${username}/cardapio?gerar_pdf=true`;
                  window.open(cardapioUrl, '_blank');
                } catch (error: any) {
                  console.error('Erro ao gerar PDF do cardápio:', error);
                  await mostrarAlert('Erro', 'Erro ao gerar PDF do cardápio. Tente novamente.');
                }
              }}
              style={{
                opacity: cardapioPublico ? 1 : 0.5,
                cursor: cardapioPublico ? 'pointer' : 'not-allowed'
              }}
            >
              <FaFilePdf /> Compartilhar Cardápio em PDF
            </button>
          </div>
        </div>
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

