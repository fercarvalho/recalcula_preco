import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff } from 'react-icons/fa';
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
  ordem?: number;
}

interface GerenciamentoFuncoesProps {
  isOpen: boolean;
  onClose: () => void;
}

const GerenciamentoFuncoes = ({ isOpen, onClose }: GerenciamentoFuncoesProps) => {
  const [funcoes, setFuncoes] = useState<Funcao[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModalAdicionar, setShowModalAdicionar] = useState(false);
  const [funcaoEditando, setFuncaoEditando] = useState<Funcao | null>(null);
  const [showIconeModal, setShowIconeModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      carregarFuncoes();
    }
  }, [isOpen]);

  const carregarFuncoes = async () => {
    try {
      setLoading(true);
      const funcoesCarregadas = await apiService.obterFuncoes();
      setFuncoes(funcoesCarregadas);
    } catch (error) {
      console.error('Erro ao carregar funções:', error);
      await mostrarAlert('Erro', 'Erro ao carregar funções. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAtiva = async (funcao: Funcao) => {
    try {
      const funcaoAtualizada: Funcao = {
        ...funcao,
        ativa: !funcao.ativa,
        eh_ia: funcao.eh_ia
      };
      await apiService.atualizarFuncao(funcao.id!, funcaoAtualizada);
      await carregarFuncoes();
    } catch (error) {
      console.error('Erro ao atualizar função:', error);
      await mostrarAlert('Erro', 'Erro ao atualizar função. Tente novamente.');
    }
  };

  const handleToggleIA = async (funcao: Funcao) => {
    try {
      const funcaoAtualizada: Funcao = {
        ...funcao,
        ativa: funcao.ativa,
        eh_ia: !funcao.eh_ia
      };
      await apiService.atualizarFuncao(funcao.id!, funcaoAtualizada);
      await carregarFuncoes();
    } catch (error) {
      console.error('Erro ao atualizar função:', error);
      await mostrarAlert('Erro', 'Erro ao atualizar função. Tente novamente.');
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
                      <h3>{funcao.titulo}</h3>
                      <p>{funcao.descricao}</p>
                    </div>
                  </div>
                  <div className="funcao-switches">
                    <div className="switch-group">
                      <label>
                        <span>Função Ativa</span>
                        <button
                          onClick={() => handleToggleAtiva(funcao)}
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
                          onClick={() => handleToggleIA(funcao)}
                          className={`switch-btn ${funcao.eh_ia ? 'active' : ''}`}
                          disabled={!funcao.ativa}
                        >
                          {funcao.eh_ia ? <FaToggleOn /> : <FaToggleOff />}
                        </button>
                      </label>
                    </div>
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
  const [iconeSelecionado, setIconeSelecionado] = useState<string | null>(null);
  const [showIconeModal, setShowIconeModal] = useState(false);

  const handleIconeSelecionado = (iconeNome: string) => {
    // Garantir que o nome do ícone tenha o prefixo "Fa" se necessário
    const nomeIcone = iconeNome.startsWith('Fa') ? iconeNome : `Fa${iconeNome}`;
    setIcone(nomeIcone);
    setIconeSelecionado(nomeIcone);
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
            <span>ou</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="form-input"
            />
          </div>
          {(icone || iconeUpload) && (
            <div className="icone-preview">
              {iconeUpload ? (
                <img src={iconeUpload} alt="Preview" style={{ width: '48px', height: '48px' }} />
              ) : icone ? (
                (() => {
                  try {
                    const IconComponent = (FaIcons as any)[icone];
                    return IconComponent ? <IconComponent style={{ fontSize: '48px' }} /> : null;
                  } catch {
                    return null;
                  }
                })()
              ) : null}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={ativa}
              onChange={(e) => setAtiva(e.target.checked)}
            />
            Função Ativa
          </label>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={ehIA}
              onChange={(e) => setEhIA(e.target.checked)}
              disabled={!ativa}
            />
            É função de IA?
          </label>
        </div>
      </Modal>

      {showIconeModal && (
        <SelecionarIconeModal
          isOpen={showIconeModal}
          iconeAtual={icone || null}
          onClose={() => setShowIconeModal(false)}
          onSelect={handleIconeSelecionado}
        />
      )}
    </>
  );
};

export default GerenciamentoFuncoes;
