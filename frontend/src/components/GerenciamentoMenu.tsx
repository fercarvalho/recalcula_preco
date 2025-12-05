import { useState, useEffect } from 'react';
import { FaBars, FaToggleOn, FaToggleOff, FaSave, FaGripVertical } from 'react-icons/fa';
import Modal from './Modal';
import { mostrarAlert } from '../utils/modals';
import { apiService } from '../services/api';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import './GerenciamentoMenu.css';

export interface SecaoMenu {
  id: string;
  nome: string;
  ativa: boolean;
  ordem?: number;
}

interface GerenciamentoMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const GerenciamentoMenu = ({ isOpen, onClose }: GerenciamentoMenuProps) => {
  const [secoes, setSecoes] = useState<SecaoMenu[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      console.log('GerenciamentoMenu - Modal aberto, carregando configurações...');
      carregarConfiguracoes();
    } else {
      // Limpar estado quando fechar
      setSecoes([]);
      setLoading(false);
    }
  }, [isOpen]);

  const carregarConfiguracoes = async () => {
    try {
      setLoading(true);
      const configuracoes = await apiService.obterConfiguracoesMenu();
      console.log('Configurações carregadas:', configuracoes);
      setSecoes(configuracoes);
    } catch (error) {
      console.error('Erro ao carregar configurações do menu:', error);
      // Não mostrar alert durante carregamento inicial para evitar bloquear o modal
      // Apenas logar o erro e usar valores padrão
      setSecoes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSecao = async (id: string) => {
    try {
      const secao = secoes.find(s => s.id === id);
      if (!secao) return;

      const novaAtiva = !secao.ativa;
      
      // Atualizar estado local imediatamente para feedback visual e preparar dados para API
      let secoesAtualizadas: SecaoMenu[] = [];
      setSecoes(prevSecoes => {
        secoesAtualizadas = prevSecoes.map(s =>
          s.id === id ? { ...s, ativa: novaAtiva } : s
        );
        return secoesAtualizadas;
      });

      // Salvar na API imediatamente usando o estado atualizado
      const configuracoesParaSalvar = secoesAtualizadas.map(s => ({
        id: s.id,
        ativa: s.ativa
      }));
      
      await apiService.atualizarConfiguracoesMenu(configuracoesParaSalvar);
      
      // Disparar evento para atualizar instantaneamente na landing page
      console.log('Disparando evento menu-config-updated');
      window.dispatchEvent(new CustomEvent('menu-config-updated'));
    } catch (error) {
      console.error('Erro ao atualizar seção do menu:', error);
      // Reverter mudança em caso de erro
      setSecoes(prevSecoes =>
        prevSecoes.map(s =>
          s.id === id ? { ...s, ativa: !s.ativa } : s
        )
      );
      await mostrarAlert('Erro', 'Erro ao atualizar seção do menu. Tente novamente.');
    }
  };

  const handleSalvar = async () => {
    try {
      setLoading(true);
      const configuracoesParaSalvar = secoes.map(s => ({ id: s.id, ativa: s.ativa }));
      await apiService.atualizarConfiguracoesMenu(configuracoesParaSalvar);
      
      // Disparar evento para atualizar o menu na landing page
      window.dispatchEvent(new CustomEvent('menu-config-updated'));
      
      await mostrarAlert('Sucesso', 'Configurações do menu salvas com sucesso!');
      onClose();
    } catch (error) {
      console.error('Erro ao salvar configurações do menu:', error);
      await mostrarAlert('Erro', 'Erro ao salvar configurações do menu. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetar = async () => {
    try {
      setLoading(true);
      
      // Ordem padrão das seções do menu
      const ordemPadrao: { [key: string]: number } = {
        'sobre': 0,
        'funcionalidades': 1,
        'roadmap': 2,
        'planos': 3,
        'faq': 4
      };
      
      // Restaurar estado ativo e ordem padrão
      const secoesPadrao = secoes.map(s => ({ 
        ...s, 
        ativa: true,
        ordem: ordemPadrao[s.id] !== undefined ? ordemPadrao[s.id] : s.ordem || 0
      }));
      
      // Ordenar pela ordem padrão
      const secoesOrdenadas = [...secoesPadrao].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
      
      // Atualizar estado local
      setSecoes(secoesOrdenadas);
      
      // Salvar configurações (ativa)
      const configuracoesParaSalvar = secoesOrdenadas.map(s => ({ id: s.id, ativa: s.ativa }));
      await apiService.atualizarConfiguracoesMenu(configuracoesParaSalvar);
      
      // Salvar ordem
      const secaoIds = secoesOrdenadas.map(s => s.id);
      await apiService.atualizarOrdemMenu(secaoIds);
      
      // Disparar evento para atualizar o menu na landing page
      window.dispatchEvent(new CustomEvent('menu-config-updated'));
      
      await mostrarAlert('Sucesso', 'Configurações do menu resetadas para os valores padrão!');
    } catch (error) {
      console.error('Erro ao resetar configurações do menu:', error);
      await mostrarAlert('Erro', 'Erro ao resetar configurações do menu. Tente novamente.');
      // Recarregar configurações em caso de erro
      await carregarConfiguracoes();
    } finally {
      setLoading(false);
    }
  };

  // Drag and drop para reordenar seções do menu
  const handleReorderMenu = async (novasSecoes: SecaoMenu[]) => {
    // Atualizar localmente primeiro para feedback imediato
    setSecoes(novasSecoes);
    
    try {
      console.log('handleReorderMenu chamado com:', novasSecoes);
      
      // Criar array com os IDs das seções na nova ordem
      const secaoIds = novasSecoes.map(s => s.id);
      
      if (secaoIds.length === 0) {
        throw new Error('Nenhuma seção encontrada');
      }
      
      await apiService.atualizarOrdemMenu(secaoIds);
      
      // Disparar evento para atualizar o menu na landing page
      window.dispatchEvent(new CustomEvent('menu-config-updated'));
    } catch (error) {
      console.error('Erro ao atualizar ordem do menu:', error);
      await mostrarAlert('Erro', 'Erro ao atualizar ordem do menu. Tente novamente.');
      // Recarregar seções em caso de erro
      await carregarConfiguracoes();
    }
  };

  // Garantir que todas as seções tenham ID para o drag and drop
  const secoesComIds = secoes.map((s, index) => ({
    ...s,
    id: s.id || `secao-${index}`
  }));

  const {
    handleDragStart: handleDragStartMenu,
    handleDragEnd: handleDragEndMenu,
    handleDragOver: handleDragOverMenu,
    handleDrop: handleDropMenu,
    handleDragLeave: handleDragLeaveMenu,
  } = useDragAndDrop(secoesComIds, handleReorderMenu);

  console.log('GerenciamentoMenu render - isOpen:', isOpen, 'secoes:', secoes.length, 'loading:', loading);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gerenciamento de Menu"
      size="medium"
      className="modal-nested"
      footer={
        <>
          <button onClick={handleResetar} className="btn-secondary" disabled={loading}>
            Resetar para Padrão
          </button>
          <button onClick={onClose} className="btn-secondary" disabled={loading}>Cancelar</button>
          <button onClick={handleSalvar} className="btn-primary" disabled={loading}>
            <FaSave /> {loading ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </>
      }
    >
      <div className="gerenciamento-menu-container">
        {loading && secoes.length === 0 ? (
          <div className="loading">Carregando...</div>
        ) : (
          <>
            <div className="menu-info">
              <p>Selecione quais seções da landing page devem aparecer no menu de navegação do header.</p>
            </div>
            {secoes.length === 0 && !loading ? (
              <div className="empty-state">
                <p>Nenhuma seção encontrada. Por favor, recarregue a página.</p>
              </div>
            ) : (
              <div className="secoes-list">
                {secoesComIds.map((secao) => {
                  const secaoId = secao.id;
                  return (
                    <div
                      key={secaoId}
                      className="secao-item"
                      draggable
                      onDragStart={(e) => handleDragStartMenu(e, secaoId, 'item')}
                      onDragEnd={handleDragEndMenu}
                      onDragOver={(e) => handleDragOverMenu(e, secaoId)}
                      onDrop={(e) => handleDropMenu(e, secaoId)}
                      onDragLeave={handleDragLeaveMenu}
                    >
                      <div className="secao-drag-handle">
                        <FaGripVertical />
                      </div>
                      <div className="secao-info">
                        <FaBars className="secao-icon" />
                        <span className="secao-nome">{secao.nome}</span>
                      </div>
                      <button
                        onClick={() => handleToggleSecao(secao.id)}
                        className={`toggle-btn ${secao.ativa ? 'active' : ''}`}
                        title={secao.ativa ? 'Ocultar do menu' : 'Mostrar no menu'}
                        disabled={loading}
                      >
                        {secao.ativa ? <FaToggleOn /> : <FaToggleOff />}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="menu-preview">
              <h4>Preview do Menu:</h4>
              <div className="preview-menu">
                {secoes.filter(s => s.ativa).length === 0 ? (
                  <p className="preview-empty">Nenhuma seção selecionada. O menu estará vazio.</p>
                ) : (
                  secoes
                    .filter(s => s.ativa)
                    .map(secao => (
                      <span key={secao.id} className="preview-item">
                        {secao.nome}
                      </span>
                    ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

// Função exportada para obter seções ativas (usada na LandingPage)
export const obterSecoesMenuAtivas = async (): Promise<string[]> => {
  try {
    const configuracoes = await apiService.obterConfiguracoesMenu();
    return configuracoes.filter(s => s.ativa).map(s => s.id);
  } catch (error) {
    console.error('Erro ao obter seções do menu:', error);
    // Retornar todas as seções como padrão em caso de erro
    return ['sobre', 'funcionalidades', 'roadmap', 'planos', 'faq'];
  }
};

export default GerenciamentoMenu;
