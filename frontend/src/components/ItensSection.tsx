import { useState, useEffect } from 'react';
import type { ItensPorCategoria } from '../types';
import { apiService } from '../services/api';
import CategoriaGroup from './CategoriaGroup';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import './ItensSection.css';

interface ItensSectionProps {
  itensPorCategoria: ItensPorCategoria;
  itensSelecionados: Set<number>;
  categoriasColapsadas: Set<string>;
  onToggleItem: (itemId: number) => void;
  onToggleCategoria: (categoria: string) => void;
  onToggleCategoriaSelecionada: (categoria: string) => void;
  onItemUpdated: () => void;
  temAcesso?: boolean;
  onAbrirModalPlanos?: () => void;
}

const ItensSection = ({
  itensPorCategoria,
  itensSelecionados,
  categoriasColapsadas,
  onToggleItem,
  onToggleCategoria,
  onToggleCategoriaSelecionada,
  onItemUpdated,
  temAcesso = true,
  onAbrirModalPlanos,
}: ItensSectionProps) => {
  const [categoriasOrdenadas, setCategoriasOrdenadas] = useState<string[]>(Object.keys(itensPorCategoria));

  // Drag and drop para categorias
  const categoriaDragDrop = useDragAndDrop(
    categoriasOrdenadas.map(cat => ({ id: cat })),
    async (newOrder) => {
      const novasCategorias = newOrder.map(item => item.id as string);
      setCategoriasOrdenadas(novasCategorias);
      try {
        await apiService.atualizarOrdemCategorias(novasCategorias);
        onItemUpdated();
      } catch (error) {
        console.error('Erro ao salvar ordem das categorias:', error);
      }
    }
  );

  // Atualizar categorias ordenadas quando itensPorCategoria mudar
  useEffect(() => {
    const novasCategorias = Object.keys(itensPorCategoria);
    if (JSON.stringify(novasCategorias) !== JSON.stringify(categoriasOrdenadas)) {
      setCategoriasOrdenadas(novasCategorias);
    }
  }, [itensPorCategoria, categoriasOrdenadas]);

  return (
    <section className="itens-section">
      <h2>Itens Disponíveis</h2>
      <div className="categorias-container">
        {categoriasOrdenadas.map((categoria) => {
          if (!itensPorCategoria[categoria]) return null;
          
          const itens = itensPorCategoria[categoria];
          const isCollapsed = categoriasColapsadas.has(categoria);

          return (
            <CategoriaGroup
              key={categoria}
              categoria={categoria}
              itens={itens}
              itensSelecionados={itensSelecionados}
              isCollapsed={isCollapsed}
              categorias={categoriasOrdenadas}
              onToggleItem={onToggleItem}
              onToggleCategoria={() => onToggleCategoria(categoria)}
              onToggleCategoriaSelecionada={() => onToggleCategoriaSelecionada(categoria)}
              onItemUpdated={onItemUpdated}
              onDragStart={(e) => categoriaDragDrop.handleDragStart(e, categoria, 'categoria')}
              onDragEnd={categoriaDragDrop.handleDragEnd}
              onDragOver={(e) => categoriaDragDrop.handleDragOver(e, categoria)}
              onDrop={(e) => categoriaDragDrop.handleDrop(e, categoria)}
              onDragLeave={categoriaDragDrop.handleDragLeave}
              temAcesso={temAcesso}
              onAbrirModalPlanos={onAbrirModalPlanos}
            />
          );
        })}
      </div>
    </section>
  );
};

export default ItensSection;

