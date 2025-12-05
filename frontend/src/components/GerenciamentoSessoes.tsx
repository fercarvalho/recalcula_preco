import { useState, useEffect } from 'react';
import { FaLayerGroup, FaToggleOn, FaToggleOff, FaSave } from 'react-icons/fa';
import Modal from './Modal';
import { mostrarAlert } from '../utils/modals';
import { apiService } from '../services/api';
import './GerenciamentoSessoes.css';

export interface SessaoLanding {
  id: string;
  nome: string;
  ativa: boolean;
  ordem?: number;
}

interface GerenciamentoSessoesProps {
  isOpen: boolean;
  onClose: () => void;
}

const GerenciamentoSessoes = ({ isOpen, onClose }: GerenciamentoSessoesProps) => {
  const [sessoes, setSessoes] = useState<SessaoLanding[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      console.log('GerenciamentoSessoes - Modal aberto, carregando configurações...');
      carregarConfiguracoes();
    } else {
      // Limpar estado quando fechar
      setSessoes([]);
      setLoading(false);
    }
  }, [isOpen]);

  const carregarConfiguracoes = async () => {
    try {
      setLoading(true);
      const configuracoes = await apiService.obterConfiguracoesSessoes();
      console.log('Configurações de sessões carregadas:', configuracoes);
      setSessoes(configuracoes);
    } catch (error) {
      console.error('Erro ao carregar configurações de sessões:', error);
      // Não mostrar alert durante carregamento inicial para evitar bloquear o modal
      // Apenas logar o erro e usar valores padrão
      setSessoes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSessao = async (id: string) => {
    try {
      const sessao = sessoes.find(s => s.id === id);
      if (!sessao) return;

      const novaAtiva = !sessao.ativa;
      
      // Atualizar estado local imediatamente para feedback visual e preparar dados para API
      let sessoesAtualizadas: SessaoLanding[] = [];
      setSessoes(prevSessoes => {
        sessoesAtualizadas = prevSessoes.map(s =>
          s.id === id ? { ...s, ativa: novaAtiva } : s
        );
        return sessoesAtualizadas;
      });

      // Salvar na API imediatamente usando o estado atualizado
      const configuracoesParaSalvar = sessoesAtualizadas.map(s => ({
        id: s.id,
        ativa: s.ativa
      }));
      
      await apiService.atualizarConfiguracoesSessoes(configuracoesParaSalvar);
      
      // Disparar evento para atualizar instantaneamente na landing page
      console.log('Disparando evento sessoes-config-updated');
      window.dispatchEvent(new CustomEvent('sessoes-config-updated'));
    } catch (error) {
      console.error('Erro ao atualizar sessão:', error);
      // Reverter mudança em caso de erro
      setSessoes(prevSessoes =>
        prevSessoes.map(s =>
          s.id === id ? { ...s, ativa: !s.ativa } : s
        )
      );
      await mostrarAlert('Erro', 'Erro ao atualizar sessão. Tente novamente.');
    }
  };

  const handleSalvar = async () => {
    try {
      setLoading(true);
      const configuracoesParaSalvar = sessoes.map(s => ({ id: s.id, ativa: s.ativa }));
      await apiService.atualizarConfiguracoesSessoes(configuracoesParaSalvar);
      
      // Disparar evento para atualizar as sessões na landing page
      window.dispatchEvent(new CustomEvent('sessoes-config-updated'));
      
      await mostrarAlert('Sucesso', 'Configurações das sessões salvas com sucesso!');
      onClose();
    } catch (error) {
      console.error('Erro ao salvar configurações de sessões:', error);
      await mostrarAlert('Erro', 'Erro ao salvar configurações de sessões. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetar = async () => {
    try {
      setLoading(true);
      const sessoesPadrao = sessoes.map(s => ({ ...s, ativa: true }));
      const configuracoesParaSalvar = sessoesPadrao.map(s => ({ id: s.id, ativa: s.ativa }));
      await apiService.atualizarConfiguracoesSessoes(configuracoesParaSalvar);
      setSessoes(sessoesPadrao);
      
      // Disparar evento para atualizar as sessões na landing page
      window.dispatchEvent(new CustomEvent('sessoes-config-updated'));
      
      await mostrarAlert('Sucesso', 'Configurações das sessões resetadas para os valores padrão!');
    } catch (error) {
      console.error('Erro ao resetar configurações de sessões:', error);
      await mostrarAlert('Erro', 'Erro ao resetar configurações de sessões. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  console.log('GerenciamentoSessoes render - isOpen:', isOpen, 'sessoes:', sessoes.length, 'loading:', loading);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gerenciamento de Sessões da Landing Page"
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
      <div className="gerenciamento-sessoes-container">
        {loading && sessoes.length === 0 ? (
          <div className="loading">Carregando...</div>
        ) : (
          <>
            <div className="sessoes-info">
              <p>Selecione quais sessões da landing page devem ser exibidas. Lembre-se: todas as sessões com funções são uma sessão só.</p>
            </div>
            {sessoes.length === 0 && !loading ? (
              <div className="empty-state">
                <p>Nenhuma sessão encontrada. Por favor, recarregue a página.</p>
              </div>
            ) : (
              <div className="sessoes-list">
                {sessoes.map((sessao) => (
                  <div key={sessao.id} className="sessao-item">
                    <div className="sessao-info">
                      <FaLayerGroup className="sessao-icon" />
                      <span className="sessao-nome">{sessao.nome}</span>
                    </div>
                    <button
                      onClick={() => handleToggleSessao(sessao.id)}
                      className={`toggle-btn ${sessao.ativa ? 'active' : ''}`}
                      title={sessao.ativa ? 'Ocultar sessão' : 'Mostrar sessão'}
                      disabled={loading}
                    >
                      {sessao.ativa ? <FaToggleOn /> : <FaToggleOff />}
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="sessoes-preview">
              <h4>Preview das Sessões:</h4>
              <div className="preview-sessoes">
                {sessoes.filter(s => s.ativa).length === 0 ? (
                  <p className="preview-empty">Nenhuma sessão selecionada. A landing page estará vazia.</p>
                ) : (
                  sessoes
                    .filter(s => s.ativa)
                    .map(sessao => (
                      <span key={sessao.id} className="preview-item">
                        {sessao.nome}
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

// Função exportada para obter sessões ativas (usada na LandingPage)
export const obterSessoesAtivas = async (): Promise<string[]> => {
  try {
    const configuracoes = await apiService.obterConfiguracoesSessoes();
    return configuracoes.filter(s => s.ativa).map(s => s.id);
  } catch (error) {
    console.error('Erro ao obter sessões:', error);
    // Retornar todas as sessões como padrão em caso de erro
    return ['hero', 'sobre', 'funcionalidades', 'whatsapp-ia-ativas', 'roadmap', 'whatsapp-integracao', 'planos', 'faq', 'cta-final'];
  }
};

export default GerenciamentoSessoes;

