import { useState, useEffect } from 'react';
import { FaSave, FaSpinner } from 'react-icons/fa';
import { apiService } from '../services/api';
import { mostrarAlert } from '../utils/modals';
import Modal from './Modal';
import './GerenciamentoFuncoesEspeciais.css';

interface Permissao {
  id?: number;
  funcao_especial: string;
  tipo_acesso: string;
  habilitado: boolean;
}

interface Plano {
  id: number;
  nome: string;
  tipo: string;
  ativo: boolean;
}

interface GerenciamentoFuncoesEspeciaisProps {
  isOpen: boolean;
  onClose: () => void;
}

const FUNCOES_ESPECIAIS = [
  { id: 'modo_cardapio', nome: 'Modo Cardápio' },
  { id: 'modo_compartilhar_cardapio', nome: 'Modo Compartilhar Cardápio' },
  { id: 'modo_estudio', nome: 'Modo Estúdio' }
];

const TIPOS_ACESSO_BASE = [
  { id: 'todos', nome: 'Todos' },
  { id: 'admin', nome: 'Somente Admin' },
  { id: 'vitalicio', nome: 'Vitalícios' }
];

const GerenciamentoFuncoesEspeciais = ({ isOpen, onClose }: GerenciamentoFuncoesEspeciaisProps) => {
  const [permissoes, setPermissoes] = useState<Record<string, Record<string, boolean>>>({});
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (isOpen) {
      carregarDados();
    }
  }, [isOpen]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [permissoesData, planosData] = await Promise.all([
        apiService.obterPermissoesFuncoesEspeciais(),
        apiService.obterPlanosAdmin()
      ]);

      // Inicializar estrutura de permissões
      const permissoesMap: Record<string, Record<string, boolean>> = {};

      FUNCOES_ESPECIAIS.forEach(funcao => {
        permissoesMap[funcao.id] = {};
        
        // Adicionar tipos de acesso base
        TIPOS_ACESSO_BASE.forEach(tipo => {
          const permissao = permissoesData.find(
            (p: Permissao) => p.funcao_especial === funcao.id && p.tipo_acesso === tipo.id
          );
          permissoesMap[funcao.id][tipo.id] = permissao ? permissao.habilitado : false;
        });

        // Adicionar planos
        planosData.forEach((plano: Plano) => {
          if (plano.ativo) {
            const permissao = permissoesData.find(
              (p: Permissao) => p.funcao_especial === funcao.id && p.tipo_acesso === plano.id.toString()
            );
            permissoesMap[funcao.id][`plano_${plano.id}`] = permissao ? permissao.habilitado : false;
          }
        });
      });

      setPermissoes(permissoesMap);
      setPlanos(planosData.filter((p: Plano) => p.ativo));
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      await mostrarAlert('Erro', error?.response?.data?.error || 'Erro ao carregar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const togglePermissao = (funcaoId: string, tipoAcesso: string) => {
    setPermissoes(prev => {
      const novoEstado = !prev[funcaoId]?.[tipoAcesso];
      const novasPermissoes = { ...prev[funcaoId] };
      
      // Se estiver ativando "admin", desativar todos os outros
      if (tipoAcesso === 'admin' && novoEstado) {
        // Desativar todos exceto admin
        Object.keys(novasPermissoes).forEach(key => {
          if (key !== 'admin') {
            novasPermissoes[key] = false;
          }
        });
        novasPermissoes.admin = true;
      } else if (tipoAcesso !== 'admin' && novoEstado) {
        // Se estiver ativando qualquer outro switch, desativar "admin"
        novasPermissoes.admin = false;
        novasPermissoes[tipoAcesso] = true;
      } else {
        // Se estiver desativando, comportamento normal
        novasPermissoes[tipoAcesso] = novoEstado;
      }
      
      return {
        ...prev,
        [funcaoId]: novasPermissoes
      };
    });
  };

  const toggleTodos = (funcaoId: string) => {
    const todosHabilitado = permissoes[funcaoId]?.todos || false;
    const novoEstado = !todosHabilitado;

    setPermissoes(prev => {
      const novasPermissoes = { ...prev[funcaoId] };
      
      // Se estiver ativando "todos", desativar "admin" primeiro
      if (novoEstado && novasPermissoes.admin) {
        novasPermissoes.admin = false;
      }
      
      // Ativar/desativar todos os tipos de acesso
      Object.keys(novasPermissoes).forEach(key => {
        novasPermissoes[key] = novoEstado;
      });

      return {
        ...prev,
        [funcaoId]: novasPermissoes
      };
    });
  };

  const handleSalvar = async () => {
    try {
      setSalvando(true);
      
      const permissoesArray: Permissao[] = [];

      FUNCOES_ESPECIAIS.forEach(funcao => {
        Object.keys(permissoes[funcao.id] || {}).forEach(tipoAcesso => {
          const habilitado = permissoes[funcao.id][tipoAcesso];
          
          // Converter plano_X para o ID do plano
          let tipoAcessoFinal = tipoAcesso;
          if (tipoAcesso.startsWith('plano_')) {
            tipoAcessoFinal = tipoAcesso.replace('plano_', '');
          }

          permissoesArray.push({
            funcao_especial: funcao.id,
            tipo_acesso: tipoAcessoFinal,
            habilitado
          });
        });
      });

      await apiService.atualizarPermissoesFuncoesEspeciais(permissoesArray);
      await mostrarAlert('Sucesso', 'Permissões atualizadas com sucesso!');
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar permissões:', error);
      await mostrarAlert('Erro', error?.response?.data?.error || 'Erro ao salvar permissões. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title="Gerenciar Funções Especiais" 
        size="large"
        className="modal-nested"
      >
        <div className="funcoes-especiais-loading">
          <FaSpinner className="spinner" />
          <p>Carregando...</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Gerenciar Funções Especiais" 
      size="large"
      className="modal-nested"
    >
      <div className="funcoes-especiais-container">
        {FUNCOES_ESPECIAIS.map(funcao => (
          <div key={funcao.id} className="funcao-especial-section">
            <h3 className="funcao-especial-title">{funcao.nome}</h3>
            
            <div className="permissoes-grid">
              {/* Switch Master - Todos */}
              <div className="permissao-item master">
                <label className="permissao-label">
                  <span className="permissao-nome">Todos</span>
                  <span className="permissao-descricao">Ativa para todos os usuários</span>
                </label>
                <label className="switch-container">
                  <input
                    type="checkbox"
                    className="switch-input"
                    checked={permissoes[funcao.id]?.todos || false}
                    onChange={() => toggleTodos(funcao.id)}
                  />
                  <span className="switch-slider"></span>
                </label>
              </div>

              {/* Somente Admin */}
              <div className="permissao-item">
                <label className="permissao-label">
                  <span className="permissao-nome">Somente Admin</span>
                  <span className="permissao-descricao">Apenas administradores</span>
                </label>
                <label className="switch-container">
                  <input
                    type="checkbox"
                    className="switch-input"
                    checked={permissoes[funcao.id]?.admin || false}
                    onChange={() => togglePermissao(funcao.id, 'admin')}
                  />
                  <span className="switch-slider"></span>
                </label>
              </div>

              {/* Vitalícios */}
              <div className="permissao-item">
                <label className="permissao-label">
                  <span className="permissao-nome">Vitalícios</span>
                  <span className="permissao-descricao">Usuários com acesso vitalício</span>
                </label>
                <label className="switch-container">
                  <input
                    type="checkbox"
                    className="switch-input"
                    checked={permissoes[funcao.id]?.vitalicio || false}
                    onChange={() => togglePermissao(funcao.id, 'vitalicio')}
                  />
                  <span className="switch-slider"></span>
                </label>
              </div>

              {/* Planos */}
              {planos.map(plano => (
                <div key={plano.id} className="permissao-item">
                  <label className="permissao-label">
                    <span className="permissao-nome">{plano.nome}</span>
                    <span className="permissao-descricao">Usuários do plano {plano.nome}</span>
                  </label>
                  <label className="switch-container">
                    <input
                      type="checkbox"
                      className="switch-input"
                      checked={permissoes[funcao.id]?.[`plano_${plano.id}`] || false}
                      onChange={() => togglePermissao(funcao.id, `plano_${plano.id}`)}
                    />
                    <span className="switch-slider"></span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="funcoes-especiais-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={salvando}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSalvar}
            disabled={salvando}
          >
            {salvando ? (
              <>
                <FaSpinner className="spinner" />
                Salvando...
              </>
            ) : (
              <>
                <FaSave />
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default GerenciamentoFuncoesEspeciais;

