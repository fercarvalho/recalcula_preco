import { useState } from 'react';
import type { DragEvent } from 'react';

interface DragState {
  draggedId: string | number | null;
  draggedType: 'categoria' | 'item' | null;
  draggedElement: HTMLElement | null;
  dragOverId: string | number | null;
  dragOverPosition: 'before' | 'after' | null;
}

export const useDragAndDrop = <T extends { id: string | number }>(
  items: T[],
  onReorder: (newOrder: T[]) => void
) => {
  const [dragState, setDragState] = useState<DragState>({
    draggedId: null,
    draggedType: null,
    draggedElement: null,
    dragOverId: null,
    dragOverPosition: null,
  });

  const handleDragStart = (e: DragEvent, id: string | number, type: 'categoria' | 'item') => {
    setDragState({
      draggedId: id,
      draggedType: type,
      draggedElement: e.currentTarget as HTMLElement,
      dragOverId: null,
      dragOverPosition: null,
    });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(id));
    (e.currentTarget as HTMLElement).classList.add('dragging');
  };

  const handleDragEnd = (e: DragEvent) => {
    const element = e.currentTarget as HTMLElement;
    element.classList.remove('dragging');
    
    // Limpar estados de drag-over
    document.querySelectorAll('.drag-over').forEach(el => {
      el.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
    });

    setDragState({
      draggedId: null,
      draggedType: null,
      draggedElement: null,
      dragOverId: null,
      dragOverPosition: null,
    });
  };

  const handleDragOver = (e: DragEvent, id: string | number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (dragState.draggedId === id) return;

    const element = e.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const midpoint = rect.height / 2;

    const position = y < midpoint ? 'before' : 'after';

    // Limpar outros drag-over
    document.querySelectorAll('.drag-over').forEach(el => {
      if (el !== element) {
        el.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
      }
    });

    element.classList.add('drag-over');
    element.classList.remove('drag-over-top', 'drag-over-bottom');
    element.classList.add(`drag-over-${position}`);

    setDragState(prev => ({
      ...prev,
      dragOverId: id,
      dragOverPosition: position,
    }));
  };

  const handleDrop = (e: DragEvent, id: string | number) => {
    e.preventDefault();
    e.stopPropagation();

    const element = e.currentTarget as HTMLElement;
    element.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');

    if (!dragState.draggedId || dragState.draggedId === id) return;

    const draggedIndex = items.findIndex(item => item.id === dragState.draggedId);
    const dropIndex = items.findIndex(item => item.id === id);

    if (draggedIndex === -1 || dropIndex === -1) return;

    const newItems = [...items];
    const [draggedItem] = newItems.splice(draggedIndex, 1);

    const insertIndex = dragState.dragOverPosition === 'before' ? dropIndex : dropIndex + 1;
    newItems.splice(insertIndex, 0, draggedItem);

    onReorder(newItems);
  };

  const handleDragLeave = (e: DragEvent) => {
    const element = e.currentTarget as HTMLElement;
    if (!element.contains(e.relatedTarget as Node)) {
      element.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
    }
  };

  return {
    dragState,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
    handleDragLeave,
  };
};

