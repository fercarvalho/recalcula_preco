import { useState, useEffect } from 'react';
import type { ItensPorCategoria } from '../types';
import CategoriaGroupDemo from './CategoriaGroupDemo';
import './ItensSection.css';

interface ItensSectionDemoProps {
  itensPorCategoria: ItensPorCategoria;
  itensSelecionados: Set<number>;
  categoriasColapsadas: Set<string>;
  onToggleItem: (itemId: number) => void;
  onToggleCategoria: (categoria: string) => void;
  onToggleCategoriaSelecionada: (categoria: string) => void;
  onItemUpdated: () => void;
}

const ItensSectionDemo = ({
  itensPorCategoria,
  itensSelecionados,
  categoriasColapsadas,
  onToggleItem,
  onToggleCategoria,
  onToggleCategoriaSelecionada,
  onItemUpdated,
}: ItensSectionDemoProps) => {
  const [categoriasOrdenadas, setCategoriasOrdenadas] = useState<string[]>(Object.keys(itensPorCategoria));

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
            <CategoriaGroupDemo
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
              onDragStart={() => {}}
              onDragEnd={() => {}}
              onDragOver={() => {}}
              onDrop={() => {}}
              onDragLeave={() => {}}
              temAcesso={true}
              onAbrirModalPlanos={() => {}}
              temPlanoMasEmailNaoValidado={false}
            />
          );
        })}
      </div>
    </section>
  );
};

export default ItensSectionDemo;

