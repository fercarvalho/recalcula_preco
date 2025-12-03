import { useState, useEffect } from 'react';
import { FaCreditCard, FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaSave, FaStar } from 'react-icons/fa';
import Modal from './Modal';
import { mostrarAlert, mostrarConfirm } from '../utils/modals';
import { apiService } from '../services/api';
import './GerenciamentoPlanos.css';

export interface Plano {
  id?: number;
  nome: string;
  tipo: 'unico' | 'parcelado' | 'recorrente';
  valor: number;
  valor_parcelado?: number | null;
  valor_total?: number | null;
  periodo?: string | null;
  desconto_percentual?: number;
  desconto_valor?: number;
  mais_popular?: boolean;
  mostrar_valor_total?: boolean;
  mostrar_valor_parcelado?: boolean;
  ativo?: boolean;
  ordem?: number;
  beneficios?: string[];
}

interface GerenciamentoPlanosProps {
  isOpen: boolean;
  onClose: () => void;
}

const GerenciamentoPlanos = ({ isOpen, onClose }: GerenciamentoPlanosProps) => {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModalPlano, setShowModalPlano] = useState(false);
  const [planoEditando, setPlanoEditando] = useState<Plano | null>(null);

  useEffect(() => {
    if (isOpen) {
      carregarPlanos();
    }
  }, [isOpen]);

  const carregarPlanos = async () => {
    try {
      setLoading(true);
      const planosCarregados = await apiService.obterPlanosAdmin();
      setPlanos(planosCarregados);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      await mostrarAlert('Erro', 'Erro ao carregar planos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletar = async (plano: Plano) => {
    if (!plano.id) return;
    
    const confirmado = await mostrarConfirm(
      'Confirmar Exclusão',
      `Tem certeza que deseja deletar o plano "${plano.nome}"?`
    );
    
    if (!confirmado) return;

    try {
      await apiService.deletarPlano(plano.id);
      await carregarPlanos();
      
      // Disparar evento para atualizar os planos na landing page
      window.dispatchEvent(new CustomEvent('planos-updated'));
      
      await mostrarAlert('Sucesso', 'Plano deletado com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar plano:', error);
      await mostrarAlert('Erro', 'Erro ao deletar plano. Tente novamente.');
    }
  };

  const handleToggleAtivo = async (plano: Plano) => {
    if (!plano.id) return;
    
    try {
      const planoAtualizado = {
        ...plano,
        ativo: !plano.ativo
      };
      await apiService.atualizarPlano(plano.id, planoAtualizado);
      await carregarPlanos();
      
      // Disparar evento para atualizar os planos na landing page
      window.dispatchEvent(new CustomEvent('planos-updated'));
    } catch (error) {
      console.error('Erro ao atualizar plano:', error);
      await mostrarAlert('Erro', 'Erro ao atualizar plano. Tente novamente.');
    }
  };

  const handleToggleMaisPopular = async (plano: Plano) => {
    if (!plano.id) return;
    
    try {
      const planoAtualizado = {
        ...plano,
        mais_popular: !plano.mais_popular
      };
      await apiService.atualizarPlano(plano.id, planoAtualizado);
      await carregarPlanos();
      
      // Disparar evento para atualizar os planos na landing page
      window.dispatchEvent(new CustomEvent('planos-updated'));
    } catch (error) {
      console.error('Erro ao atualizar plano:', error);
      await mostrarAlert('Erro', 'Erro ao atualizar plano. Tente novamente.');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Gerenciamento de Planos"
        size="large"
        className="modal-nested"
        footer={
          <>
            <button onClick={onClose} className="btn-secondary">Fechar</button>
            <button
              onClick={() => {
                setPlanoEditando(null);
                setShowModalPlano(true);
              }}
              className="btn-primary"
            >
              <FaPlus /> Adicionar Plano
            </button>
          </>
        }
      >
        <div className="planos-container">
          {loading && planos.length === 0 ? (
            <div className="loading">Carregando...</div>
          ) : planos.length === 0 ? (
            <div className="empty-state">
              <p>Nenhum plano cadastrado. Clique em "Adicionar Plano" para começar.</p>
            </div>
          ) : (
            <div className="planos-list">
              {planos.map((plano) => (
                <div key={plano.id} className="plano-card">
                  <div className="plano-header">
                    <div className="plano-info">
                      <h3>
                        {plano.nome}
                        {plano.mais_popular && (
                          <span className="badge-popular" title="Mais Popular">
                            <FaStar /> Mais Popular
                          </span>
                        )}
                        {!plano.ativo && (
                          <span className="badge-inativo">Inativo</span>
                        )}
                      </h3>
                      <div className="plano-detalhes">
                        <span className="plano-tipo">{plano.tipo}</span>
                        <span className="plano-valor">R$ {plano.valor.toFixed(2)}</span>
                        {plano.valor_total && plano.mostrar_valor_total && (
                          <span className="plano-total">Total: R$ {plano.valor_total.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                    <div className="plano-switches">
                      <div className="switch-group">
                        <label>
                          <span>Ativo</span>
                          <button
                            onClick={() => handleToggleAtivo(plano)}
                            className={`switch-btn ${plano.ativo ? 'active' : ''}`}
                          >
                            {plano.ativo ? <FaToggleOn /> : <FaToggleOff />}
                          </button>
                        </label>
                      </div>
                      <div className="switch-group">
                        <label>
                          <span>Mais Popular</span>
                          <button
                            onClick={() => handleToggleMaisPopular(plano)}
                            className={`switch-btn ${plano.mais_popular ? 'active' : ''}`}
                          >
                            {plano.mais_popular ? <FaToggleOn /> : <FaToggleOff />}
                          </button>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="plano-actions">
                    <button
                      onClick={() => {
                        setPlanoEditando(plano);
                        setShowModalPlano(true);
                      }}
                      className="btn-edit"
                    >
                      <FaEdit /> Editar
                    </button>
                    <button
                      onClick={() => handleDeletar(plano)}
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

      {showModalPlano && (
        <ModalPlano
          plano={planoEditando}
          onClose={() => {
            setShowModalPlano(false);
            setPlanoEditando(null);
          }}
          onSave={async () => {
            await carregarPlanos();
            setShowModalPlano(false);
            setPlanoEditando(null);
          }}
        />
      )}
    </>
  );
};

interface ModalPlanoProps {
  plano: Plano | null;
  onClose: () => void;
  onSave: () => Promise<void>;
}

const ModalPlano = ({ plano, onClose, onSave }: ModalPlanoProps) => {
  const [nome, setNome] = useState(plano?.nome || '');
  const [tipo, setTipo] = useState<Plano['tipo']>(plano?.tipo || 'recorrente');
  const [valor, setValor] = useState(plano?.valor?.toString() || '');
  const [valorParcelado, setValorParcelado] = useState(plano?.valor_parcelado?.toString() || '');
  const [valorTotal, setValorTotal] = useState(plano?.valor_total?.toString() || '');
  const [periodo, setPeriodo] = useState(plano?.periodo || '');
  const [tipoDesconto, setTipoDesconto] = useState<'percentual' | 'valor_fixo' | 'nenhum'>(() => {
    if (plano?.desconto_percentual && plano.desconto_percentual > 0) return 'percentual';
    if (plano?.desconto_valor && plano.desconto_valor > 0) return 'valor_fixo';
    return 'nenhum';
  });
  const [descontoPercentual, setDescontoPercentual] = useState(plano?.desconto_percentual?.toString() || '0');
  const [descontoValor, setDescontoValor] = useState(plano?.desconto_valor?.toString() || '0');
  const [mostrarValorTotal, setMostrarValorTotal] = useState(plano?.mostrar_valor_total !== undefined ? plano.mostrar_valor_total : true);
  const [mostrarValorParcelado, setMostrarValorParcelado] = useState(plano?.mostrar_valor_parcelado !== undefined ? plano.mostrar_valor_parcelado : true);
  const [ativo, setAtivo] = useState(plano?.ativo !== undefined ? plano.ativo : true);
  const [ordem, setOrdem] = useState(plano?.ordem?.toString() || '1');
  const [beneficios, setBeneficios] = useState<string[]>(plano?.beneficios || []);
  const [novoBeneficio, setNovoBeneficio] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (plano) {
      setNome(plano.nome || '');
      setTipo(plano.tipo || 'recorrente');
      setValor(plano.valor?.toString() || '');
      setValorParcelado(plano.valor_parcelado?.toString() || '');
      setValorTotal(plano.valor_total?.toString() || '');
      setPeriodo(plano.periodo || '');
      setDescontoPercentual(plano.desconto_percentual?.toString() || '0');
      setDescontoValor(plano.desconto_valor?.toString() || '0');
      // Determinar tipo de desconto
      if (plano.desconto_percentual && plano.desconto_percentual > 0) {
        setTipoDesconto('percentual');
      } else if (plano.desconto_valor && plano.desconto_valor > 0) {
        setTipoDesconto('valor_fixo');
      } else {
        setTipoDesconto('nenhum');
      }
      setMostrarValorTotal(plano.mostrar_valor_total !== undefined ? plano.mostrar_valor_total : true);
      setMostrarValorParcelado(plano.mostrar_valor_parcelado !== undefined ? plano.mostrar_valor_parcelado : true);
      setAtivo(plano.ativo !== undefined ? plano.ativo : true);
      setOrdem(plano.ordem?.toString() || '1');
      setBeneficios(plano.beneficios || []);
    }
  }, [plano]);

  const handleAdicionarBeneficio = () => {
    if (novoBeneficio.trim()) {
      setBeneficios([...beneficios, novoBeneficio.trim()]);
      setNovoBeneficio('');
    }
  };

  const handleRemoverBeneficio = (index: number) => {
    setBeneficios(beneficios.filter((_, i) => i !== index));
  };

  const handleSalvar = async () => {
    if (!nome.trim()) {
      await mostrarAlert('Erro', 'O nome do plano é obrigatório.');
      return;
    }

    if (!valor || parseFloat(valor) < 0) {
      await mostrarAlert('Erro', 'O valor do plano é obrigatório e deve ser maior ou igual a zero.');
      return;
    }

    setLoading(true);
    try {
      // Calcular valores finais antes de salvar
      let valorFinal = parseFloat(valor);
      let valorParceladoFinal: number | null = null;
      let valorTotalFinal: number | null = null;

      if (tipo === 'unico') {
        valorFinal = parseFloat(valor);
        valorTotalFinal = valorFinal;
      } else if (tipo === 'recorrente') {
        valorFinal = parseFloat(valor);
        valorTotalFinal = valorTotal ? parseFloat(valorTotal) : null;
      } else if (tipo === 'parcelado') {
        valorTotalFinal = valorTotal ? parseFloat(valorTotal) : null;
        valorParceladoFinal = valorParcelado ? parseFloat(valorParcelado) : null;
        valorFinal = valorParceladoFinal || 0; // Para parcelado, o valor é o parcelado
      }

      const planoData: Plano = {
        nome: nome.trim(),
        tipo,
        valor: valorFinal,
        valor_parcelado: valorParceladoFinal,
        valor_total: valorTotalFinal,
        periodo: periodo || null,
        desconto_percentual: tipoDesconto === 'percentual' && descontoPercentual ? parseFloat(descontoPercentual) : 0,
        desconto_valor: tipoDesconto === 'valor_fixo' && descontoValor ? parseFloat(descontoValor) : 0,
        mais_popular: plano?.mais_popular || false, // Manter o valor atual do plano
        mostrar_valor_total: tipo === 'unico' ? false : mostrarValorTotal, // Único não mostra valor total
        mostrar_valor_parcelado: tipo === 'parcelado' ? mostrarValorParcelado : false, // Só parcelado mostra valor parcelado
        ativo,
        ordem: parseInt(ordem) || 1,
        beneficios
      };

      if (plano?.id) {
        await apiService.atualizarPlano(plano.id, planoData);
        await mostrarAlert('Sucesso', 'Plano atualizado com sucesso!');
      } else {
        await apiService.criarPlano(planoData);
        await mostrarAlert('Sucesso', 'Plano criado com sucesso!');
      }

      // Disparar evento para atualizar os planos na landing page
      window.dispatchEvent(new CustomEvent('planos-updated'));

      await onSave();
    } catch (error) {
      console.error('Erro ao salvar plano:', error);
      await mostrarAlert('Erro', 'Erro ao salvar plano. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={plano ? 'Editar Plano' : 'Adicionar Novo Plano'}
      size="large"
      className="modal-nested"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary" disabled={loading}>
            Cancelar
          </button>
          <button onClick={handleSalvar} className="btn-primary" disabled={loading}>
            <FaSave /> {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </>
      }
    >
      <div className="plano-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="plano-nome">Nome do Plano <span className="required">*</span>:</label>
            <input
              type="text"
              id="plano-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="form-input"
              placeholder="Ex: Plano Anual"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="plano-tipo">Tipo <span className="required">*</span>:</label>
            <select
              id="plano-tipo"
              value={tipo}
              onChange={(e) => {
                const novoTipo = e.target.value as Plano['tipo'];
                setTipo(novoTipo);
                
                // Resetar valores quando mudar o tipo
                if (novoTipo === 'unico') {
                  setValorParcelado('');
                  setValorTotal('');
                  // Resetar período se não for válido
                  if (!['mensal', 'trimestral', 'semestral', 'anual', '24 horas', 'vitalicio'].includes(periodo)) {
                    setPeriodo('');
                  }
                } else if (novoTipo === 'recorrente') {
                  setValorParcelado('');
                  setValorTotal('');
                  // Resetar período se não for válido
                  if (!['mensal', 'trimestral', 'semestral', 'anual'].includes(periodo)) {
                    setPeriodo('');
                  }
                } else if (novoTipo === 'parcelado') {
                  setValor('');
                  setValorParcelado('');
                  // Resetar período se não for válido (parcelado não tem mensal)
                  if (!['trimestral', 'semestral', 'anual'].includes(periodo)) {
                    setPeriodo('');
                  }
                }
              }}
              className="form-input"
              disabled={loading}
            >
              <option value="recorrente">Recorrente</option>
              <option value="parcelado">Parcelado</option>
              <option value="unico">Único</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          {tipo === 'unico' && (
            <div className="form-group">
              <label htmlFor="plano-valor">Valor (R$) <span className="required">*</span>:</label>
              <input
                type="number"
                id="plano-valor"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="form-input"
                step="0.01"
                min="0"
                placeholder="0.00"
                disabled={loading}
              />
            </div>
          )}

          {tipo === 'recorrente' && (
            <>
              <div className="form-group">
                <label htmlFor="plano-valor">Valor (R$) <span className="required">*</span>:</label>
                <input
                  type="number"
                  id="plano-valor"
                  value={valor}
                  onChange={(e) => {
                    setValor(e.target.value);
                    // Calcular valor total automaticamente
                    if (e.target.value && periodo) {
                      const valorNum = parseFloat(e.target.value);
                      if (!isNaN(valorNum)) {
                        const multiplicador = periodo === 'mensal' ? 12 : periodo === 'trimestral' ? 4 : periodo === 'semestral' ? 2 : periodo === 'anual' ? 1 : 1;
                        setValorTotal((valorNum * multiplicador).toFixed(2));
                      }
                    }
                  }}
                  className="form-input"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="plano-valor-total">Valor Total (R$):</label>
                <input
                  type="number"
                  id="plano-valor-total"
                  value={valorTotal}
                  onChange={(e) => setValorTotal(e.target.value)}
                  className="form-input"
                  step="0.01"
                  min="0"
                  placeholder="Calculado automaticamente"
                  disabled={loading}
                  readOnly
                  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                />
                <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                  Calculado automaticamente baseado no valor e período
                </small>
              </div>
            </>
          )}

          {tipo === 'parcelado' && (
            <>
              <div className="form-group">
                <label htmlFor="plano-valor-total">Valor Total (R$) <span className="required">*</span>:</label>
                <input
                  type="number"
                  id="plano-valor-total"
                  value={valorTotal}
                  onChange={(e) => {
                    setValorTotal(e.target.value);
                    // Calcular valor parcelado automaticamente
                    if (e.target.value && periodo) {
                      const valorTotalNum = parseFloat(e.target.value);
                      if (!isNaN(valorTotalNum)) {
                        const numParcelas = periodo === 'trimestral' ? 3 : periodo === 'semestral' ? 6 : periodo === 'anual' ? 12 : 3;
                        setValorParcelado((valorTotalNum / numParcelas).toFixed(2));
                        setValor((valorTotalNum / numParcelas).toFixed(2)); // Valor também é o parcelado
                      }
                    }
                  }}
                  className="form-input"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="plano-valor-parcelado">Valor Parcelado (R$):</label>
                <input
                  type="number"
                  id="plano-valor-parcelado"
                  value={valorParcelado}
                  onChange={(e) => setValorParcelado(e.target.value)}
                  className="form-input"
                  step="0.01"
                  min="0"
                  placeholder="Calculado automaticamente"
                  disabled={loading}
                  readOnly
                  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                />
                <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                  {periodo && (
                    <>
                      Calculado automaticamente: {valorTotal ? parseFloat(valorTotal).toFixed(2) : '0.00'} ÷ {
                        periodo === 'trimestral' ? 3 : periodo === 'semestral' ? 6 : periodo === 'anual' ? 12 : 3
                      } parcelas
                    </>
                  )}
                </small>
              </div>
            </>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="plano-periodo">Período:</label>
            <select
              id="plano-periodo"
              value={periodo}
              onChange={(e) => {
                const novoPeriodo = e.target.value;
                setPeriodo(novoPeriodo);
                
                // Recalcular valores quando o período mudar
                if (tipo === 'recorrente' && valor) {
                  const valorNum = parseFloat(valor);
                  if (!isNaN(valorNum)) {
                    const multiplicador = novoPeriodo === 'mensal' ? 12 : novoPeriodo === 'trimestral' ? 4 : novoPeriodo === 'semestral' ? 2 : novoPeriodo === 'anual' ? 1 : 1;
                    setValorTotal((valorNum * multiplicador).toFixed(2));
                  }
                } else if (tipo === 'parcelado' && valorTotal) {
                  const valorTotalNum = parseFloat(valorTotal);
                  if (!isNaN(valorTotalNum)) {
                    const numParcelas = novoPeriodo === 'trimestral' ? 3 : novoPeriodo === 'semestral' ? 6 : novoPeriodo === 'anual' ? 12 : 3;
                    setValorParcelado((valorTotalNum / numParcelas).toFixed(2));
                    setValor((valorTotalNum / numParcelas).toFixed(2));
                  }
                }
              }}
              className="form-input"
              disabled={loading}
            >
              <option value="">Selecione o período</option>
              {tipo === 'unico' ? (
                <>
                  <option value="mensal">Mensal</option>
                  <option value="trimestral">Trimestral</option>
                  <option value="semestral">Semestral</option>
                  <option value="anual">Anual</option>
                  <option value="24 horas">24 horas</option>
                  <option value="vitalicio">Vitalício</option>
                </>
              ) : tipo === 'parcelado' ? (
                <>
                  <option value="trimestral">Trimestral</option>
                  <option value="semestral">Semestral</option>
                  <option value="anual">Anual</option>
                </>
              ) : (
                <>
                  <option value="mensal">Mensal</option>
                  <option value="trimestral">Trimestral</option>
                  <option value="semestral">Semestral</option>
                  <option value="anual">Anual</option>
                </>
              )}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="plano-tipo-desconto">Tipo de Desconto:</label>
            <select
              id="plano-tipo-desconto"
              value={tipoDesconto}
              onChange={(e) => {
                const novoTipo = e.target.value as 'percentual' | 'valor_fixo' | 'nenhum';
                setTipoDesconto(novoTipo);
                if (novoTipo === 'nenhum') {
                  setDescontoPercentual('0');
                  setDescontoValor('0');
                }
              }}
              className="form-input"
              disabled={loading}
            >
              <option value="nenhum">Nenhum desconto</option>
              <option value="percentual">Percentual (%)</option>
              <option value="valor_fixo">Valor Fixo (R$)</option>
            </select>
          </div>

          {tipoDesconto === 'percentual' && (
            <div className="form-group">
              <label htmlFor="plano-desconto-percentual">Desconto Percentual (%) <span className="required">*</span>:</label>
              <input
                type="number"
                id="plano-desconto-percentual"
                value={descontoPercentual}
                onChange={(e) => setDescontoPercentual(e.target.value)}
                className="form-input"
                step="0.01"
                min="0"
                max="100"
                placeholder="0"
                disabled={loading}
              />
            </div>
          )}

          {tipoDesconto === 'valor_fixo' && (
            <div className="form-group">
              <label htmlFor="plano-desconto-valor">Desconto em Valor (R$) <span className="required">*</span>:</label>
              <input
                type="number"
                id="plano-desconto-valor"
                value={descontoValor}
                onChange={(e) => setDescontoValor(e.target.value)}
                className="form-input"
                step="0.01"
                min="0"
                placeholder="0.00"
                disabled={loading}
              />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="plano-ordem">Ordem:</label>
            <input
              type="number"
              id="plano-ordem"
              value={ordem}
              onChange={(e) => setOrdem(e.target.value)}
              className="form-input"
              min="0"
              placeholder="0"
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-group switches-container">
          <div className="switch-group">
            <label>
              <span>Ativo</span>
              <button
                type="button"
                onClick={() => setAtivo(!ativo)}
                className={`switch-btn ${ativo ? 'active' : ''}`}
                disabled={loading}
              >
                {ativo ? <FaToggleOn /> : <FaToggleOff />}
              </button>
            </label>
          </div>

          {(tipo === 'recorrente' || tipo === 'parcelado') && (
            <div className="switch-group">
              <label>
                <span>Mostrar Valor Total</span>
                <button
                  type="button"
                  onClick={() => setMostrarValorTotal(!mostrarValorTotal)}
                  className={`switch-btn ${mostrarValorTotal ? 'active' : ''}`}
                  disabled={loading}
                >
                  {mostrarValorTotal ? <FaToggleOn /> : <FaToggleOff />}
                </button>
              </label>
            </div>
          )}

          {tipo === 'parcelado' && (
            <div className="switch-group">
              <label>
                <span>Mostrar Valor Parcelado</span>
                <button
                  type="button"
                  onClick={() => setMostrarValorParcelado(!mostrarValorParcelado)}
                  className={`switch-btn ${mostrarValorParcelado ? 'active' : ''}`}
                  disabled={loading}
                >
                  {mostrarValorParcelado ? <FaToggleOn /> : <FaToggleOff />}
                </button>
              </label>
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Benefícios:</label>
          <div className="beneficios-list">
            {beneficios.map((beneficio, index) => (
              <div key={index} className="beneficio-item">
                <span>{beneficio}</span>
                <button
                  type="button"
                  onClick={() => handleRemoverBeneficio(index)}
                  className="btn-remove-beneficio"
                  disabled={loading}
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>
          <div className="adicionar-beneficio">
            <input
              type="text"
              value={novoBeneficio}
              onChange={(e) => setNovoBeneficio(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAdicionarBeneficio()}
              className="form-input"
              placeholder="Digite um benefício e pressione Enter"
              disabled={loading}
            />
            <button
              type="button"
              onClick={handleAdicionarBeneficio}
              className="btn-secondary"
              disabled={loading}
            >
              <FaPlus /> Adicionar
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default GerenciamentoPlanos;
