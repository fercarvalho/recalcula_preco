import { useState, useEffect, useCallback, useRef } from 'react';
import { FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaArrowsAlt } from 'react-icons/fa';
import * as FaIcons from 'react-icons/fa';
import Modal from './Modal';
import { mostrarAlert, mostrarConfirm } from '../utils/modals';
import SelecionarIconeModal from './SelecionarIconeModal';
import { apiService } from '../services/api';
import './GerenciamentoFuncoes.css';

export interface Funcao {
  id?: number;
  titulo: string;
  descricao: string;
  icone?: string;
  icone_upload?: string;
  ativa: boolean;
  eh_ia: boolean;
  em_beta?: boolean;
  ordem?: number;
}

interface GerenciamentoFuncoesProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenOrganizar?: () => void;
}

const GerenciamentoFuncoes = ({ isOpen, onClose, onOpenOrganizar }: GerenciamentoFuncoesProps) => {
  const [funcoes, setFuncoes] = useState<Funcao[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModalAdicionar, setShowModalAdicionar] = useState(false);
  const [funcaoEditando, setFuncaoEditando] = useState<Funcao | null>(null);
  const carregandoRef = useRef(false);
  const jaCarregouRef = useRef(false);

  const carregarFuncoes = useCallback(async () => {
    // Evitar múltiplas chamadas simultâneas usando ref
    if (carregandoRef.current) {
      return;
    }
    
    try {
      carregandoRef.current = true;
      setLoading(true);
      const funcoesCarregadas = await apiService.obterFuncoes();
      // Garantir que sempre seja um array
      if (Array.isArray(funcoesCarregadas)) {
        // Atualizar sempre, mas usar uma comparação simples
        console.log('Funções carregadas:', funcoesCarregadas);
        console.log('Funções de IA:', funcoesCarregadas.filter(f => f.eh_ia));
        console.log('Funções de IA inativas:', funcoesCarregadas.filter(f => f.eh_ia && !f.ativa));
        setFuncoes(funcoesCarregadas);
      } else {
        console.warn('Resposta da API não é um array:', funcoesCarregadas);
        setFuncoes([]);
      }
    } catch (error: any) {
      console.error('Erro ao carregar funções:', error);
      // Não mostrar alert durante carregamento inicial para evitar piscar
      // Apenas logar o erro
      setFuncoes([]); // Garantir que a lista fique vazia em caso de erro
    } finally {
      setLoading(false);
      // Usar setTimeout para garantir que o ref seja resetado após o render
      setTimeout(() => {
        carregandoRef.current = false;
      }, 100);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Só carregar uma vez quando o modal abrir
      if (!jaCarregouRef.current && !carregandoRef.current) {
        jaCarregouRef.current = true;
        carregarFuncoes();
      }
    } else {
      // Limpar quando o modal fechar
      setFuncoes([]);
      carregandoRef.current = false;
      jaCarregouRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleToggleAtiva = async (funcao: Funcao) => {
    if (!funcao.id) return;
    
    try {
      const novaAtiva = !funcao.ativa;
      const funcaoAtualizada = {
        titulo: funcao.titulo,
        descricao: funcao.descricao,
        icone: funcao.icone || null,
        icone_upload: funcao.icone_upload || null,
        ativa: novaAtiva,
        // Manter o eh_ia como está - não resetar automaticamente
        eh_ia: funcao.eh_ia,
        // Se desativar a função, também desativar em_beta
        em_beta: novaAtiva ? (funcao.em_beta || false) : false,
        ordem: funcao.ordem || 0
      };
      await apiService.atualizarFuncao(funcao.id, funcaoAtualizada);
      
      // Atualizar localmente sem recarregar toda a lista
      setFuncoes(prevFuncoes => 
        prevFuncoes.map(f => 
          f.id === funcao.id ? { ...f, ativa: novaAtiva } : f
        )
      );
    } catch (error: any) {
      console.error('Erro ao atualizar função:', error);
      const mensagem = error.response?.data?.error || error.message || 'Erro ao atualizar função. Tente novamente.';
      await mostrarAlert('Erro', mensagem);
      // Em caso de erro, recarregar para garantir sincronização
      await carregarFuncoes();
    }
  };

  const handleToggleIA = async (funcao: Funcao) => {
    if (!funcao.id) return;
    
    try {
      const novaEhIA = !funcao.eh_ia;
      const funcaoAtualizada = {
        titulo: funcao.titulo,
        descricao: funcao.descricao,
        icone: funcao.icone || null,
        icone_upload: funcao.icone_upload || null,
        ativa: funcao.ativa,
        eh_ia: novaEhIA,
        em_beta: funcao.em_beta || false,
        ordem: funcao.ordem || 0
      };
      await apiService.atualizarFuncao(funcao.id, funcaoAtualizada);
      
      // Atualizar localmente sem recarregar toda a lista
      setFuncoes(prevFuncoes => 
        prevFuncoes.map(f => 
          f.id === funcao.id ? { ...f, eh_ia: novaEhIA } : f
        )
      );
    } catch (error: any) {
      console.error('Erro ao atualizar função:', error);
      const mensagem = error.response?.data?.error || error.message || 'Erro ao atualizar função. Tente novamente.';
      await mostrarAlert('Erro', mensagem);
      // Em caso de erro, recarregar para garantir sincronização
      await carregarFuncoes();
    }
  };

  const handleDeletar = async (funcao: Funcao) => {
    const confirmado = await mostrarConfirm(
      'Confirmar Exclusão',
      `Tem certeza que deseja deletar a função "${funcao.titulo}"?`
    );
    if (!confirmado) return;

    try {
      await apiService.deletarFuncao(funcao.id!);
      await carregarFuncoes();
      await mostrarAlert('Sucesso', 'Função deletada com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar função:', error);
      await mostrarAlert('Erro', 'Erro ao deletar função. Tente novamente.');
    }
  };

  const handleSalvar = async (funcao: Funcao) => {
    try {
      if (funcao.id) {
        await apiService.atualizarFuncao(funcao.id, funcao);
      } else {
        await apiService.criarFuncao(funcao);
      }
      await carregarFuncoes();
      setShowModalAdicionar(false);
      setFuncaoEditando(null);
      await mostrarAlert('Sucesso', `Função ${funcao.id ? 'atualizada' : 'criada'} com sucesso!`);
    } catch (error) {
      console.error('Erro ao salvar função:', error);
      await mostrarAlert('Erro', 'Erro ao salvar função. Tente novamente.');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Gerenciamento de Funções"
        size="large"
        className="modal-funcoes"
        footer={
          <>
            <button onClick={onClose} className="btn-secondary">Fechar</button>
            <button 
              onClick={() => {
                if (onOpenOrganizar) {
                  onOpenOrganizar();
                }
              }} 
              className="btn-secondary"
            >
              <FaArrowsAlt /> Organizar Funções
            </button>
            <button onClick={() => {
              setFuncaoEditando(null);
              setShowModalAdicionar(true);
            }} className="btn-primary">
              <FaPlus /> Adicionar Função
            </button>
          </>
        }
      >
        <div className="funcoes-container">
          {loading ? (
            <div className="loading">Carregando...</div>
          ) : funcoes.length === 0 ? (
            <div className="empty-state">
              <p>Nenhuma função cadastrada. Clique em "Adicionar Função" para começar.</p>
            </div>
          ) : (
            <div className="funcoes-list">
              {funcoes.map((funcao) => (
                <div key={funcao.id} className="funcao-card">
                  <div className="funcao-header">
                    <div className="funcao-icon">
                      {funcao.icone_upload ? (
                        <img src={funcao.icone_upload} alt={funcao.titulo} />
                      ) : funcao.icone ? (
                        (() => {
                          try {
                            const IconComponent = (FaIcons as any)[funcao.icone];
                            return IconComponent ? <IconComponent /> : <span>📦</span>;
                          } catch {
                            return <span>📦</span>;
                          }
                        })()
                      ) : (
                        <span>📦</span>
                      )}
                    </div>
                    <div className="funcao-info">
                      <h3>
                        {funcao.titulo}
                        {funcao.eh_ia && (
                          <span className="funcao-ia-badge" title="Função de IA">🤖 IA</span>
                        )}
                      </h3>
                      <p>{funcao.descricao}</p>
                    </div>
                  </div>
                  <div className="funcao-switches">
                    <div className="switch-group">
                      <label>
                        <span>Função Ativa</span>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleToggleAtiva(funcao);
                          }}
                          className={`switch-btn ${funcao.ativa ? 'active' : ''}`}
                        >
                          {funcao.ativa ? <FaToggleOn /> : <FaToggleOff />}
                        </button>
                      </label>
                    </div>
                    <div className="switch-group">
                      <label>
                        <span>É função de IA?</span>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleToggleIA(funcao);
                          }}
                          className={`switch-btn ${funcao.eh_ia ? 'active' : ''}`}
                        >
                          {funcao.eh_ia ? <FaToggleOn /> : <FaToggleOff />}
                        </button>
                      </label>
                    </div>
                    {funcao.ativa && (
                      <div className="switch-group">
                        <label>
                          <span>Função em Beta</span>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleToggleBeta(funcao);
                            }}
                            className={`switch-btn ${funcao.em_beta ? 'active' : ''}`}
                          >
                            {funcao.em_beta ? <FaToggleOn /> : <FaToggleOff />}
                          </button>
                        </label>
                      </div>
                    )}
                  </div>
                  <div className="funcao-actions">
                    <button
                      onClick={() => {
                        setFuncaoEditando(funcao);
                        setShowModalAdicionar(true);
                      }}
                      className="btn-edit"
                    >
                      <FaEdit /> Editar
                    </button>
                    <button
                      onClick={() => handleDeletar(funcao)}
                      className="btn-delete"
                    >
                      <FaTrash /> Deletar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {showModalAdicionar && (
        <ModalAdicionarFuncao
          funcao={funcaoEditando}
          onClose={() => {
            setShowModalAdicionar(false);
            setFuncaoEditando(null);
          }}
          onSave={handleSalvar}
        />
      )}

    </>
  );
};

interface ModalAdicionarFuncaoProps {
  funcao: Funcao | null;
  onClose: () => void;
  onSave: (funcao: Funcao) => void;
}

const ModalAdicionarFuncao = ({ funcao, onClose, onSave }: ModalAdicionarFuncaoProps) => {
  const [titulo, setTitulo] = useState(funcao?.titulo || '');
  const [descricao, setDescricao] = useState(funcao?.descricao || '');
  const [icone, setIcone] = useState(funcao?.icone || '');
  const [iconeUpload, setIconeUpload] = useState(funcao?.icone_upload || '');
  const [ativa, setAtiva] = useState(funcao?.ativa ?? true);
  const [ehIA, setEhIA] = useState(funcao?.eh_ia ?? false);
  const [emBeta, setEmBeta] = useState(funcao?.em_beta ?? false);
  const [showIconeModal, setShowIconeModal] = useState(false);

  const handleIconeSelecionado = (iconeNome: string) => {
    // Garantir que o nome do ícone tenha o prefixo "Fa" se necessário
    const nomeIcone = iconeNome.startsWith('Fa') ? iconeNome : `Fa${iconeNome}`;
    setIcone(nomeIcone);
    setShowIconeModal(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      mostrarAlert('Erro', 'Por favor, selecione um arquivo de imagem.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setIconeUpload(dataUrl);
      setIcone(''); // Limpar ícone React se houver upload
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!titulo.trim() || !descricao.trim()) {
      mostrarAlert('Erro', 'Por favor, preencha título e descrição.');
      return;
    }

    const funcaoData: Funcao = {
      id: funcao?.id,
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      icone: icone || undefined,
      icone_upload: iconeUpload || undefined,
      ativa,
      eh_ia: ehIA,
      em_beta: ativa ? emBeta : false, // Só pode estar em beta se estiver ativa
      ordem: funcao?.ordem,
    };

    onSave(funcaoData);
  };

  return (
    <>
      <Modal
        isOpen={true}
        onClose={onClose}
        title={funcao ? 'Editar Função' : 'Adicionar Nova Função'}
        className="modal-adicionar-funcao"
        footer={
          <>
            <button onClick={onClose} className="btn-secondary">Cancelar</button>
            <button onClick={handleSubmit} className="btn-primary">Salvar</button>
          </>
        }
      >
        <div className="form-group">
          <label htmlFor="funcao-titulo">Título:</label>
          <input
            type="text"
            id="funcao-titulo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="form-input"
            placeholder="Ex: Reajustes Automáticos"
          />
        </div>

        <div className="form-group">
          <label htmlFor="funcao-descricao">Descrição:</label>
          <textarea
            id="funcao-descricao"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="form-input"
            rows={4}
            placeholder="Descreva a funcionalidade..."
          />
        </div>

        <div className="form-group">
          <label>Ícone:</label>
          <div className="icone-options">
            <button
              type="button"
              onClick={() => setShowIconeModal(true)}
              className="btn-secondary"
            >
              Selecionar React Icon
            </button>
            <span className="icone-separator">ou</span>
            <label className="file-upload-label">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="file-input"
              />
              <span className="file-upload-text">Enviar Imagem</span>
            </label>
          </div>
          {(icone || iconeUpload) && (
            <div className="icone-preview">
              {iconeUpload ? (
                <img src={iconeUpload} alt="Preview" />
              ) : icone ? (
                (() => {
                  try {
                    const IconComponent = (FaIcons as any)[icone];
                    return IconComponent ? <IconComponent /> : null;
                  } catch {
                    return null;
                  }
                })()
              ) : null}
            </div>
          )}
        </div>

        <div className="form-group switches-container">
          <div className="switch-group">
            <label>
              <span>Função Ativa</span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const novaAtiva = !ativa;
                  setAtiva(novaAtiva);
                  // Se desativar, também desativar em_beta
                  if (!novaAtiva) {
                    setEmBeta(false);
                  }
                }}
                className={`switch-btn ${ativa ? 'active' : ''}`}
              >
                {ativa ? <FaToggleOn /> : <FaToggleOff />}
              </button>
            </label>
          </div>
          <div className="switch-group">
            <label>
              <span>É função de IA?</span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setEhIA(!ehIA);
                }}
                className={`switch-btn ${ehIA ? 'active' : ''}`}
              >
                {ehIA ? <FaToggleOn /> : <FaToggleOff />}
              </button>
            </label>
          </div>
        </div>
      </Modal>

      {showIconeModal && (
        <SelecionarIconeModal
          isOpen={showIconeModal}
          iconeAtual={icone || null}
          onClose={() => setShowIconeModal(false)}
          onSelect={handleIconeSelecionado}
          tipo="funcao"
        />
      )}

    </>
  );
};

export default GerenciamentoFuncoes;
