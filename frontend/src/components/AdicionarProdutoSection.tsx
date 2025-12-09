import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { mostrarAlert } from '../utils/modals';
import AdicionarCategoriaModal from './AdicionarCategoriaModal';
import EditarItemModal from './EditarItemModal';
import { FaPlusCircle, FaFolderPlus, FaStore, FaCog, FaToggleOn, FaToggleOff, FaImage, FaFilePdf, FaComment } from 'react-icons/fa';
import ModalFeedbackBeta from './ModalFeedbackBeta';
import ModoEstudio from './ModoEstudio';
// Dynamic imports para reduzir tamanho do bundle inicial
import { carregarConfiguracoes, aplicarConfiguracoes } from '../utils/configuracoes';
import '../pages/Cardapio.css';
import './AdicionarProdutoSection.css';

interface AdicionarProdutoSectionProps {
  onItemAdded: () => void;
  categorias: string[];
  onOpenPlataformas?: () => void;
  onOpenPainelAdmin?: () => void;
  onOpenAdicionarCategoria?: () => void;
  onOpenAdicionarItem?: () => void;
  onOpenModalPlanos?: () => void;
  onOpenModalUpgrade?: () => void;
}

const AdicionarProdutoSection = ({ onItemAdded, categorias, onOpenPlataformas, onOpenPainelAdmin, onOpenAdicionarCategoria, onOpenAdicionarItem, onOpenModalPlanos, onOpenModalUpgrade }: AdicionarProdutoSectionProps) => {
  const [showAdicionarCategoriaModal, setShowAdicionarCategoriaModal] = useState(false);
  const [showEditarItemModal, setShowEditarItemModal] = useState(false);
  const [cardapioPublico, setCardapioPublico] = useState(false);
  const [username, setUsername] = useState<string>('');
  const [statusPagamento, setStatusPagamento] = useState<{
    temAcesso: boolean;
    tipo: 'anual' | 'unico' | 'vitalicio' | null;
  } | null>(null);
  const [showModalFeedback, setShowModalFeedback] = useState(false);
  const [funcaoFeedback, setFuncaoFeedback] = useState<string>('');

  // Carregar estado do cardápio público e status de pagamento
  useEffect(() => {
    const carregarDados = async () => {
      try {
        const response = await apiService.obterDadosUsuario();
        if (response.user) {
          setCardapioPublico(response.user.cardapio_publico === true);
          setUsername(response.user.username || '');
        }
        
        // Carregar status de pagamento
        const status = await apiService.verificarStatusPagamento();
        setStatusPagamento(status);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };
    carregarDados();
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

  const gerarImagemCardapio = async () => {
    try {
      // Buscar dados do cardápio
      const API_BASE = import.meta.env.VITE_API_BASE || window.location.origin;
      const response = await fetch(`${API_BASE}/api/cardapio/${username}`);
      if (!response.ok) {
        throw new Error('Erro ao carregar cardápio');
      }
      const cardapioData = await response.json();

      // Aplicar configurações de cores
      if (cardapioData.usuario?.id) {
        const config = carregarConfiguracoes(cardapioData.usuario.id);
        aplicarConfiguracoes(config, cardapioData.usuario.id);
      }

      // Criar elemento oculto para renderizar o cardápio
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '1200px';
      container.className = 'cardapio-container';
      document.body.appendChild(container);

      // Renderizar cardápio no elemento oculto
      const header = document.createElement('div');
      header.className = 'cardapio-header';
      const titulo = document.createElement('h1');
      titulo.className = 'cardapio-titulo';
      const usuarioSpan = document.createElement('span');
      usuarioSpan.className = 'cardapio-usuario';
      usuarioSpan.textContent = `Cardápio do ${cardapioData.usuario.username.charAt(0).toUpperCase() + cardapioData.usuario.username.slice(1).toLowerCase()}`;
      titulo.appendChild(usuarioSpan);
      if (cardapioData.usuario.nome_estabelecimento) {
        const estabelecimentoSpan = document.createElement('span');
        estabelecimentoSpan.className = 'cardapio-estabelecimento';
        estabelecimentoSpan.textContent = cardapioData.usuario.nome_estabelecimento;
        titulo.appendChild(estabelecimentoSpan);
        const subtitulo = document.createElement('p');
        subtitulo.className = 'cardapio-subtitulo';
        subtitulo.textContent = 'Cardápio Digital';
        header.appendChild(subtitulo);
      }
      header.appendChild(titulo);
      container.appendChild(header);

      const content = document.createElement('div');
      content.className = 'cardapio-content';
      
      const categorias = Object.keys(cardapioData.itens).sort();
      categorias.forEach((categoria) => {
        const itens = cardapioData.itens[categoria];
        if (!itens || itens.length === 0) return;

        const categoriaDiv = document.createElement('div');
        categoriaDiv.className = 'cardapio-categoria';
        
        const categoriaTitulo = document.createElement('h2');
        categoriaTitulo.className = 'categoria-titulo';
        categoriaTitulo.textContent = categoria;
        categoriaDiv.appendChild(categoriaTitulo);

        const itensDiv = document.createElement('div');
        itensDiv.className = 'cardapio-itens';
        
        itens.forEach((item: any) => {
          const itemDiv = document.createElement('div');
          itemDiv.className = 'cardapio-item';
          
          const nomeSpan = document.createElement('span');
          nomeSpan.className = 'item-nome';
          nomeSpan.textContent = item.nome;
          
          const valorSpan = document.createElement('span');
          valorSpan.className = 'item-valor';
          valorSpan.textContent = `R$ ${item.valor.toFixed(2).replace('.', ',')}`;
          
          itemDiv.appendChild(nomeSpan);
          itemDiv.appendChild(valorSpan);
          itensDiv.appendChild(itemDiv);
        });
        
        categoriaDiv.appendChild(itensDiv);
        content.appendChild(categoriaDiv);
      });
      
      container.appendChild(content);

      // Aguardar um pouco para garantir renderização
      await new Promise(resolve => setTimeout(resolve, 500));

      // Carregar html2canvas dinamicamente apenas quando necessário
      const html2canvas = (await import('html2canvas')).default;

      // Gerar canvas
      const canvas = await html2canvas(container, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: false,
      });

      // Remover elemento oculto
      document.body.removeChild(container);

      // Converter para imagem e abrir em nova aba
      const imageUrl = canvas.toDataURL('image/png');
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Cardápio - ${cardapioData.usuario.username}</title>
              <meta charset="UTF-8">
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                  margin: 0;
                  padding: 20px;
                  background: #f5f5f5;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                }
                img {
                  max-width: 100%;
                  height: auto;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                  border-radius: 8px;
                  display: block;
                }
              </style>
            </head>
            <body>
              <img src="${imageUrl}" alt="Cardápio" />
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    } catch (error: any) {
      console.error('Erro ao gerar imagem do cardápio:', error);
      await mostrarAlert('Erro', 'Erro ao gerar imagem do cardápio. Tente novamente.');
    }
  };

  const gerarPdfCardapio = async () => {
    try {
      // Buscar dados do cardápio
      const API_BASE = import.meta.env.VITE_API_BASE || window.location.origin;
      const response = await fetch(`${API_BASE}/api/cardapio/${username}`);
      if (!response.ok) {
        throw new Error('Erro ao carregar cardápio');
      }
      const cardapioData = await response.json();

      // Aplicar configurações de cores
      if (cardapioData.usuario?.id) {
        const config = carregarConfiguracoes(cardapioData.usuario.id);
        aplicarConfiguracoes(config, cardapioData.usuario.id);
      }

      // Criar elemento oculto para renderizar o cardápio
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '1200px';
      container.className = 'cardapio-container';
      document.body.appendChild(container);

      // Renderizar cardápio no elemento oculto (mesmo código da função de imagem)
      const header = document.createElement('div');
      header.className = 'cardapio-header';
      const titulo = document.createElement('h1');
      titulo.className = 'cardapio-titulo';
      const usuarioSpan = document.createElement('span');
      usuarioSpan.className = 'cardapio-usuario';
      usuarioSpan.textContent = `Cardápio do ${cardapioData.usuario.username.charAt(0).toUpperCase() + cardapioData.usuario.username.slice(1).toLowerCase()}`;
      titulo.appendChild(usuarioSpan);
      if (cardapioData.usuario.nome_estabelecimento) {
        const estabelecimentoSpan = document.createElement('span');
        estabelecimentoSpan.className = 'cardapio-estabelecimento';
        estabelecimentoSpan.textContent = cardapioData.usuario.nome_estabelecimento;
        titulo.appendChild(estabelecimentoSpan);
        const subtitulo = document.createElement('p');
        subtitulo.className = 'cardapio-subtitulo';
        subtitulo.textContent = 'Cardápio Digital';
        header.appendChild(subtitulo);
      }
      header.appendChild(titulo);
      container.appendChild(header);

      const content = document.createElement('div');
      content.className = 'cardapio-content';
      
      const categorias = Object.keys(cardapioData.itens).sort();
      categorias.forEach((categoria) => {
        const itens = cardapioData.itens[categoria];
        if (!itens || itens.length === 0) return;

        const categoriaDiv = document.createElement('div');
        categoriaDiv.className = 'cardapio-categoria';
        
        const categoriaTitulo = document.createElement('h2');
        categoriaTitulo.className = 'categoria-titulo';
        categoriaTitulo.textContent = categoria;
        categoriaDiv.appendChild(categoriaTitulo);

        const itensDiv = document.createElement('div');
        itensDiv.className = 'cardapio-itens';
        
        itens.forEach((item: any) => {
          const itemDiv = document.createElement('div');
          itemDiv.className = 'cardapio-item';
          
          const nomeSpan = document.createElement('span');
          nomeSpan.className = 'item-nome';
          nomeSpan.textContent = item.nome;
          
          const valorSpan = document.createElement('span');
          valorSpan.className = 'item-valor';
          valorSpan.textContent = `R$ ${item.valor.toFixed(2).replace('.', ',')}`;
          
          itemDiv.appendChild(nomeSpan);
          itemDiv.appendChild(valorSpan);
          itensDiv.appendChild(itemDiv);
        });
        
        categoriaDiv.appendChild(itensDiv);
        content.appendChild(categoriaDiv);
      });
      
      container.appendChild(content);

      // Aguardar um pouco para garantir renderização
      await new Promise(resolve => setTimeout(resolve, 500));

      // Carregar bibliotecas dinamicamente apenas quando necessário
      const [html2canvasModule, jsPDFModule] = await Promise.all([
        import('html2canvas'),
        import('jspdf')
      ]);
      const html2canvas = html2canvasModule.default;
      const jsPDF = jsPDFModule.default;

      // Gerar canvas
      const canvas = await html2canvas(container, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: false,
      });

      // Remover elemento oculto
      document.body.removeChild(container);

      // Converter para imagem e criar PDF
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Calcular dimensões do PDF em mm (A4 width = 210mm)
      const pdfWidth = 210; // mm
      const pdfHeight = (imgHeight * pdfWidth) / imgWidth; // mm (mantendo proporção)

      console.log('Criando PDF com dimensões:', pdfWidth, 'x', pdfHeight, 'mm');

      // Criar PDF
      const pdf = new jsPDF({
        orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
        unit: 'mm',
        format: [pdfWidth, pdfHeight]
      });

      // Adicionar imagem ao PDF
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      
      // Gerar nome do arquivo
      const fileName = `cardapio_${cardapioData.usuario.username}.pdf`;
      
      // Salvar PDF
      pdf.save(fileName);
      
      console.log('PDF gerado e salvo com sucesso:', fileName);
    } catch (error: any) {
      console.error('Erro ao gerar PDF do cardápio:', error);
      await mostrarAlert('Erro', 'Erro ao gerar PDF do cardápio. Tente novamente.');
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="cardapio-switch-text">Modo Cardápio</span>
              <span className="roadmap-tag">Em Beta</span>
              {(statusPagamento?.tipo === 'anual' || statusPagamento?.tipo === 'vitalicio') && statusPagamento?.temAcesso && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setFuncaoFeedback('Modo Cardápio');
                    setShowModalFeedback(true);
                  }}
                  className="btn-feedback-beta"
                  title="Enviar feedback sobre esta função"
                >
                  <FaComment /> Feedback
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={async (e) => {
                e.preventDefault();
                
                // Se está tentando ativar, verificar se tem plano anual
                if (!cardapioPublico) {
                  // Verificar status de pagamento
                  const status = await apiService.verificarStatusPagamento();
                  
                  if (!status.temAcesso) {
                    // Usuário não tem plano ativo - abrir modal de planos
                    if (onOpenModalPlanos) {
                      onOpenModalPlanos();
                    }
                    return;
                  }
                  
                  if (status.tipo === 'unico') {
                    // Usuário tem plano único - abrir modal de upgrade
                    if (onOpenModalUpgrade) {
                      onOpenModalUpgrade();
                    }
                    return;
                  }
                  
                  if (status.tipo !== 'anual') {
                    // Usuário não tem plano anual - abrir modal de planos
                    if (onOpenModalPlanos) {
                      onOpenModalPlanos();
                    }
                    return;
                  }
                }
                
                // Se chegou aqui, pode ativar/desativar
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <span className="cardapio-switch-text">Modo Compartilhar Cardápio</span>
            <span className="roadmap-tag">Em Beta</span>
            {(statusPagamento?.tipo === 'anual' || statusPagamento?.tipo === 'vitalicio') && statusPagamento?.temAcesso && (
              <button
                type="button"
                onClick={() => {
                  setFuncaoFeedback('Modo Compartilhar Cardápio');
                  setShowModalFeedback(true);
                }}
                className="btn-feedback-beta"
                title="Enviar feedback sobre esta função"
              >
                <FaComment /> Feedback
              </button>
            )}
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
                await gerarImagemCardapio();
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
                await gerarPdfCardapio();
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
      <ModoEstudio
        statusPagamento={statusPagamento}
        onOpenModalPlanos={onOpenModalPlanos}
        onOpenModalUpgrade={onOpenModalUpgrade}
        onOpenFeedback={(funcao) => {
          setFuncaoFeedback(funcao);
          setShowModalFeedback(true);
        }}
      />
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

      <ModalFeedbackBeta
        isOpen={showModalFeedback}
        onClose={() => {
          setShowModalFeedback(false);
          setFuncaoFeedback('');
        }}
        funcaoTitulo={funcaoFeedback}
      />
    </>
  );
};

export default AdicionarProdutoSection;

