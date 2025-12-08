import { useState, useEffect } from 'react';
import type { ItensPorCategoria } from '../types';
import { carregarConfiguracoes, aplicarConfiguracoes } from '../components/PainelAdmin';
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

  const categorias = Object.keys(cardapio.itens).sort((a, b) => {
    const itensA = cardapio.itens[a];
    const itensB = cardapio.itens[b];
    // Manter ordem original se houver ordem definida, senão ordenar alfabeticamente
    return 0; // A ordem já vem ordenada do backend
  });

  return (
    <div className="cardapio-container">
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

