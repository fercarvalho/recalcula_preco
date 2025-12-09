import { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { ItensPorCategoria } from '../types';
import { carregarConfiguracoes, aplicarConfiguracoes } from '../utils/configuracoes';
import './Cardapio.css';

interface CardapioData {
  usuario: {
    id: number;
    username: string;
    nome_estabelecimento: string | null;
  };
  itens: ItensPorCategoria;
}

const Cardapio = () => {
  // Extrair username da URL (formato: /username/cardapio)
  const pathname = window.location.pathname;
  const match = pathname.match(/^\/([^\/]+)\/cardapio$/);
  const username = match ? match[1] : null;
  const [cardapio, setCardapio] = useState<CardapioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cardapioRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const carregarCardapio = async () => {
      if (!username) {
        setError('Username não fornecido');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const API_BASE = import.meta.env.VITE_API_BASE || window.location.origin;
        const response = await fetch(`${API_BASE}/api/cardapio/${username}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('Cardápio não encontrado ou não está público');
          } else {
            setError('Erro ao carregar cardápio');
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        setCardapio(data);
        
        // Carregar e aplicar cores personalizadas do usuário
        if (data.usuario?.id) {
          const config = carregarConfiguracoes(data.usuario.id);
          aplicarConfiguracoes(config, data.usuario.id);
        }
      } catch (err) {
        console.error('Erro ao carregar cardápio:', err);
        setError('Erro ao carregar cardápio');
      } finally {
        setLoading(false);
      }
    };

    carregarCardapio();
  }, [username]);

  // Gerar imagem quando o parâmetro gerar_imagem estiver na URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const gerarImagem = urlParams.get('gerar_imagem');
    
    if (gerarImagem === 'true' && cardapio && !loading) {
      // Aguardar um pouco mais para garantir que tudo está totalmente renderizado
      const timeoutId = setTimeout(async () => {
        try {
          // Verificar novamente se o ref está disponível
          if (!cardapioRef.current) {
            console.error('cardapioRef.current não está disponível após timeout');
            return;
          }
          
          console.log('Iniciando geração de imagem...');
          
          const canvas = await html2canvas(cardapioRef.current, {
            backgroundColor: null,
            scale: 2,
            logging: false,
            useCORS: true,
            allowTaint: false,
            scrollX: 0,
            scrollY: 0,
            windowWidth: cardapioRef.current.scrollWidth,
            windowHeight: cardapioRef.current.scrollHeight,
          });
          
          console.log('Imagem gerada com sucesso, dimensões:', canvas.width, 'x', canvas.height);
          
          // Converter canvas para data URL
          const imageUrl = canvas.toDataURL('image/png');
          
          // Substituir o conteúdo da janela atual pela imagem
          document.body.innerHTML = '';
          document.body.style.margin = '0';
          document.body.style.padding = '20px';
          document.body.style.background = '#f5f5f5';
          document.body.style.display = 'flex';
          document.body.style.justifyContent = 'center';
          document.body.style.alignItems = 'center';
          document.body.style.minHeight = '100vh';
          
          const img = document.createElement('img');
          img.src = imageUrl;
          img.alt = 'Cardápio';
          img.style.maxWidth = '100%';
          img.style.height = 'auto';
          img.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
          img.style.borderRadius = '8px';
          img.style.display = 'block';
          
          document.body.appendChild(img);
          
          // Atualizar o título da página
          document.title = `Cardápio - ${cardapio.usuario.username}`;
          
          console.log('Imagem exibida com sucesso');
        } catch (err) {
          console.error('Erro ao gerar imagem do cardápio:', err);
          if (err instanceof Error) {
            console.error('Detalhes do erro:', err.message, err.stack);
          }
        }
      }, 2000);
      
      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [cardapio, loading]);

  // Gerar PDF quando o parâmetro gerar_pdf estiver na URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const gerarPdf = urlParams.get('gerar_pdf');
    
    if (gerarPdf === 'true' && cardapio && !loading) {
      // Aguardar um pouco mais para garantir que tudo está totalmente renderizado
      const timeoutId = setTimeout(async () => {
        try {
          // Verificar novamente se o ref está disponível
          if (!cardapioRef.current) {
            console.error('cardapioRef.current não está disponível após timeout');
            return;
          }
          
          console.log('Iniciando geração de PDF...');
          
          // Gerar canvas do cardápio
          const canvas = await html2canvas(cardapioRef.current, {
            backgroundColor: null,
            scale: 2,
            logging: false,
            useCORS: true,
            allowTaint: false,
            scrollX: 0,
            scrollY: 0,
            windowWidth: cardapioRef.current.scrollWidth,
            windowHeight: cardapioRef.current.scrollHeight,
          });
          
          console.log('Canvas gerado, dimensões:', canvas.width, 'x', canvas.height);
          
          // Converter canvas para imagem
          const imgData = canvas.toDataURL('image/png');
          
          // Calcular dimensões do PDF (A4 em pixels a 96 DPI)
          const pdfWidth = 210; // mm (A4 width)
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width; // mm (mantendo proporção)
          
          // Criar PDF
          const pdf = new jsPDF({
            orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
            unit: 'mm',
            format: [pdfWidth, pdfHeight]
          });
          
          // Adicionar imagem ao PDF
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          
          // Gerar nome do arquivo
          const fileName = `cardapio-${cardapio.usuario.username}-${new Date().toISOString().split('T')[0]}.pdf`;
          
          // Salvar PDF
          pdf.save(fileName);
          
          console.log('PDF gerado com sucesso');
          
          // Fechar a aba após um pequeno delay
          setTimeout(() => {
            try {
              window.close();
            } catch (e) {
              // Ignorar erro se não conseguir fechar
              console.log('Não foi possível fechar a aba automaticamente');
            }
          }, 500);
        } catch (err) {
          console.error('Erro ao gerar PDF do cardápio:', err);
          if (err instanceof Error) {
            console.error('Detalhes do erro:', err.message, err.stack);
          }
        }
      }, 2000);
      
      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [cardapio, loading]);

  const formatarValor = (valor: number): string => {
    return valor.toFixed(2).replace('.', ',');
  };

  if (loading) {
    return (
      <div className="cardapio-container">
        <div className="cardapio-loading">
          <div className="loading-spinner"></div>
          <p>Carregando cardápio...</p>
        </div>
      </div>
    );
  }

  if (error || !cardapio) {
    return (
      <div className="cardapio-container">
        <div className="cardapio-error">
          <h1>Cardápio não disponível</h1>
          <p>{error || 'Cardápio não encontrado'}</p>
        </div>
      </div>
    );
  }

  const categorias = Object.keys(cardapio.itens);

  return (
    <div className="cardapio-container" ref={cardapioRef}>
      <div className="cardapio-header">
        <h1 className="cardapio-titulo">
          <span className="cardapio-usuario">
            Cardápio do {cardapio.usuario.username.charAt(0).toUpperCase() + cardapio.usuario.username.slice(1).toLowerCase()}
          </span>
          {cardapio.usuario.nome_estabelecimento && (
            <span className="cardapio-estabelecimento">{cardapio.usuario.nome_estabelecimento}</span>
          )}
        </h1>
        {cardapio.usuario.nome_estabelecimento && (
          <p className="cardapio-subtitulo">Cardápio Digital</p>
        )}
      </div>

      <div className="cardapio-content">
        {categorias.map((categoria) => {
          const itens = cardapio.itens[categoria];
          if (!itens || itens.length === 0) return null;

          return (
            <div key={categoria} className="cardapio-categoria">
              <h2 className="categoria-titulo">{categoria}</h2>
              <div className="cardapio-itens">
                {itens.map((item) => (
                  <div key={item.id} className="cardapio-item">
                    <span className="item-nome">{item.nome}</span>
                    <span className="item-valor">R$ {formatarValor(item.valor)}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Cardapio;

