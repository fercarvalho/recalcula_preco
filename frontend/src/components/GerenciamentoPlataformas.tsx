import { useState, useEffect } from 'react';
import Modal from './Modal';
import { mostrarAlert, mostrarConfirm } from '../utils/modals';
import { carregarPlataformas, type Plataforma } from '../utils/plataformas';
import { FaStore, FaPlus, FaEdit, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';
import './GerenciamentoPlataformas.css';

const PLATAFORMAS_STORAGE_KEY = 'calculadora_plataformas';

const salvarPlataformas = (plataformas: Plataforma[]) => {
  localStorage.setItem(PLATAFORMAS_STORAGE_KEY, JSON.stringify(plataformas));
  // Disparar evento customizado para atualizar outros componentes
  window.dispatchEvent(new CustomEvent('plataformas-updated', { detail: plataformas }));
};

interface GerenciamentoPlataformasProps {
  isOpen: boolean;
  onClose: () => void;
}

type TipoCalculo = 'percentual' | 'valor';

interface PlataformaLinha {
  nome: string;
  taxa: string;
  tipoCalculo: TipoCalculo;
  valorVendido?: string;
  valorCobrado?: string;
}

const GerenciamentoPlataformas = ({ isOpen, onClose }: GerenciamentoPlataformasProps) => {
  const [plataformas, setPlataformas] = useState<Plataforma[]>([]);
  const [editingPlataforma, setEditingPlataforma] = useState<Plataforma | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [modoMultiplo, setModoMultiplo] = useState(false);
  const [formNome, setFormNome] = useState('');
  const [formTaxa, setFormTaxa] = useState('');
  const [formTipoCalculo, setFormTipoCalculo] = useState<TipoCalculo>('percentual');
  const [formValorVendido, setFormValorVendido] = useState('');
  const [formValorCobrado, setFormValorCobrado] = useState('');
  const [plataformasLinhas, setPlataformasLinhas] = useState<PlataformaLinha[]>([
    { nome: '', taxa: '', tipoCalculo: 'percentual' },
  ]);

  useEffect(() => {
    if (isOpen) {
      setPlataformas(carregarPlataformas());
    }
  }, [isOpen]);

  const handleAdicionar = () => {
    setEditingPlataforma(null);
    setModoMultiplo(false);
    setFormNome('');
    setFormTaxa('');
    setFormTipoCalculo('percentual');
    setFormValorVendido('');
    setFormValorCobrado('');
    setPlataformasLinhas([{ nome: '', taxa: '', tipoCalculo: 'percentual' }]);
    setShowFormModal(true);
  };

  const adicionarLinha = () => {
    setPlataformasLinhas([...plataformasLinhas, { nome: '', taxa: '', tipoCalculo: 'percentual' }]);
  };

  const removerLinha = (index: number) => {
    if (plataformasLinhas.length > 1) {
      setPlataformasLinhas(plataformasLinhas.filter((_, i) => i !== index));
    }
  };

  const atualizarLinha = (index: number, campo: keyof PlataformaLinha, valor: string | TipoCalculo) => {
    const novasLinhas = [...plataformasLinhas];
    novasLinhas[index] = { ...novasLinhas[index], [campo]: valor };
    setPlataformasLinhas(novasLinhas);
  };

  const calcularPercentual = (valorVendido: number, valorCobrado: number): number => {
    if (valorVendido === 0) return 0;
    return (valorCobrado / valorVendido) * 100;
  };

  const handleEditar = (plataforma: Plataforma) => {
    setEditingPlataforma(plataforma);
    setModoMultiplo(false);
    setFormNome(plataforma.nome);
    setFormTaxa(plataforma.taxa.toString());
    setFormTipoCalculo('percentual');
    setFormValorVendido('');
    setFormValorCobrado('');
    setPlataformasLinhas([{ nome: '', taxa: '', tipoCalculo: 'percentual' }]);
    setShowFormModal(true);
  };

  const handleSalvarPlataforma = async () => {
    if (modoMultiplo) {
      // Modo múltiplo: adicionar várias plataformas
      const plataformasValidas: Array<{ nome: string; taxa: number }> = [];

      for (const linha of plataformasLinhas) {
        if (!linha.nome.trim()) continue;

        let taxa: number;

        if (linha.tipoCalculo === 'percentual') {
          taxa = parseFloat(linha.taxa);
          if (isNaN(taxa) || taxa < 0 || taxa > 100) continue;
        } else {
          const valorVendido = parseFloat(linha.valorVendido || '0');
          const valorCobrado = parseFloat(linha.valorCobrado || '0');
          
          if (isNaN(valorVendido) || valorVendido <= 0) continue;
          if (isNaN(valorCobrado) || valorCobrado < 0) continue;
          if (valorCobrado > valorVendido) {
            await mostrarAlert('Erro', `Na plataforma "${linha.nome.trim()}", o valor cobrado não pode ser maior que o valor vendido.`);
            return;
          }

          taxa = calcularPercentual(valorVendido, valorCobrado);
          if (taxa > 100) continue;
        }

        plataformasValidas.push({ nome: linha.nome.trim(), taxa });
      }

      if (plataformasValidas.length === 0) {
        await mostrarAlert('Erro', 'Adicione pelo menos uma plataforma válida.');
        return;
      }

      try {
        const novasPlataformas = [...plataformas];
        let novoId = plataformas.length > 0 
          ? Math.max(...plataformas.map(p => p.id)) + 1 
          : 1;

        for (const plataforma of plataformasValidas) {
          novasPlataformas.push({ 
            id: novoId++, 
            nome: plataforma.nome, 
            taxa: plataforma.taxa 
          });
        }

        setPlataformas(novasPlataformas);
        salvarPlataformas(novasPlataformas);
        setShowFormModal(false);
        setModoMultiplo(false);
        await mostrarAlert('Sucesso', `${plataformasValidas.length} plataforma(s) adicionada(s) com sucesso!`);
      } catch (error: any) {
        await mostrarAlert('Erro', error.message || 'Erro ao adicionar plataformas.');
      }
    } else {
      // Modo simples: adicionar ou editar uma plataforma
      if (!formNome.trim()) {
        await mostrarAlert('Erro', 'O nome da plataforma é obrigatório.');
        return;
      }

      let taxa: number;

      if (formTipoCalculo === 'percentual') {
        taxa = parseFloat(formTaxa);
        if (isNaN(taxa) || taxa < 0 || taxa > 100) {
          await mostrarAlert('Erro', 'A taxa deve ser um número entre 0 e 100.');
          return;
        }
      } else {
        const valorVendido = parseFloat(formValorVendido);
        const valorCobrado = parseFloat(formValorCobrado);
        
        if (isNaN(valorVendido) || valorVendido <= 0) {
          await mostrarAlert('Erro', 'O valor vendido deve ser um número maior que zero.');
          return;
        }
        if (isNaN(valorCobrado) || valorCobrado < 0) {
          await mostrarAlert('Erro', 'O valor cobrado deve ser um número maior ou igual a zero.');
          return;
        }
        if (valorCobrado > valorVendido) {
          await mostrarAlert('Erro', 'O valor cobrado não pode ser maior que o valor vendido.');
          return;
        }

        taxa = calcularPercentual(valorVendido, valorCobrado);
        if (taxa > 100) {
          await mostrarAlert('Erro', 'O percentual calculado não pode ser maior que 100%.');
          return;
        }
      }

      const novasPlataformas = [...plataformas];
      
      if (editingPlataforma) {
        const index = novasPlataformas.findIndex(p => p.id === editingPlataforma.id);
        if (index !== -1) {
          novasPlataformas[index] = { ...editingPlataforma, nome: formNome.trim(), taxa };
        }
      } else {
        const novoId = plataformas.length > 0 
          ? Math.max(...plataformas.map(p => p.id)) + 1 
          : 1;
        novasPlataformas.push({ id: novoId, nome: formNome.trim(), taxa });
      }

      setPlataformas(novasPlataformas);
      salvarPlataformas(novasPlataformas);
      setShowFormModal(false);
      setEditingPlataforma(null);
      await mostrarAlert('Sucesso', `Plataforma ${editingPlataforma ? 'atualizada' : 'adicionada'} com sucesso!`);
    }
  };

  const handleDeletar = async (plataforma: Plataforma) => {
    const confirmado = await mostrarConfirm(
      'Confirmar Exclusão',
      `Tem certeza que deseja deletar a plataforma "${plataforma.nome}"?`
    );

    if (confirmado) {
      const novasPlataformas = plataformas.filter(p => p.id !== plataforma.id);
      setPlataformas(novasPlataformas);
      salvarPlataformas(novasPlataformas);
      await mostrarAlert('Sucesso', 'Plataforma deletada com sucesso!');
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Gerenciar Plataformas"
        size="large"
        footer={
          <>
            <button onClick={onClose} className="btn-secondary">Fechar</button>
          </>
        }
      >
        <div className="admin-section">
          <h3><FaStore /> Plataformas Cadastradas</h3>
          <div style={{ marginBottom: '20px' }}>
            <button onClick={handleAdicionar} className="btn-primary">
              <FaPlus /> Adicionar Plataforma
            </button>
          </div>
          <div className="plataformas-container">
            {plataformas.length === 0 ? (
              <p style={{ color: '#666', fontStyle: 'italic' }}>
                Nenhuma plataforma cadastrada. Clique em "Adicionar Plataforma" para começar.
              </p>
            ) : (
              plataformas.map((plataforma) => (
                <div key={plataforma.id} className="plataforma-item">
                  <div className="plataforma-info">
                    <div className="plataforma-nome">{plataforma.nome}</div>
                    <div className="plataforma-taxa">Taxa: {plataforma.taxa.toFixed(2)}%</div>
                  </div>
                  <div className="plataforma-actions">
                    <button
                      onClick={() => handleEditar(plataforma)}
                      className="btn-editar-plataforma"
                    >
                      <FaEdit /> Editar
                    </button>
                    <button
                      onClick={() => handleDeletar(plataforma)}
                      className="btn-excluir-plataforma"
                    >
                      <FaTrash /> Excluir
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setEditingPlataforma(null);
          setModoMultiplo(false);
        }}
        title={editingPlataforma ? 'Editar Plataforma' : 'Adicionar Plataforma'}
        size={modoMultiplo ? 'large' : 'small'}
        footer={
          <>
            <button
              onClick={() => {
                setShowFormModal(false);
                setEditingPlataforma(null);
                setModoMultiplo(false);
              }}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button onClick={handleSalvarPlataforma} className="btn-primary">
              Salvar
            </button>
          </>
        }
      >
        {!editingPlataforma && (
          <div style={{ marginBottom: '20px' }}>
            <button
              type="button"
              className={`btn-toggle-multiplo ${modoMultiplo ? 'active' : ''}`}
              onClick={() => setModoMultiplo(!modoMultiplo)}
            >
              {modoMultiplo ? <FaCheck /> : <FaPlus />} {modoMultiplo ? 'Modo Múltiplas Plataformas Ativo' : 'Adicionar Múltiplas Plataformas'}
            </button>
          </div>
        )}

        {modoMultiplo && !editingPlataforma ? (
          <div className="itens-linhas-container">
            {plataformasLinhas.map((linha, index) => (
              <div key={index} className="item-linha">
                <div className="form-group nome">
                  <label>Nome da Plataforma:</label>
                  <input
                    type="text"
                    value={linha.nome}
                    onChange={(e) => atualizarLinha(index, 'nome', e.target.value)}
                    placeholder="Ex: iFood, Uber Eats, etc."
                  />
                </div>
                <div className="form-group tipo-calculo">
                  <label>Tipo de Cálculo:</label>
                  <select
                    value={linha.tipoCalculo}
                    onChange={(e) => atualizarLinha(index, 'tipoCalculo', e.target.value as TipoCalculo)}
                  >
                    <option value="percentual">Percentual Direto</option>
                    <option value="valor">Valor Vendido + Taxa Cobrada</option>
                  </select>
                </div>
                {linha.tipoCalculo === 'percentual' ? (
                  <div className="form-group valor">
                    <label>Taxa (%):</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={linha.taxa}
                      onChange={(e) => atualizarLinha(index, 'taxa', e.target.value)}
                      placeholder="0,00"
                    />
                  </div>
                ) : (
                  <>
                    <div className="form-group valor">
                      <label>Valor Vendido (R$):</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={linha.valorVendido || ''}
                        onChange={(e) => atualizarLinha(index, 'valorVendido', e.target.value)}
                        placeholder="0,00"
                      />
                    </div>
                    <div className="form-group valor">
                      <label>Taxa Cobrada (R$):</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={linha.valorCobrado || ''}
                        onChange={(e) => atualizarLinha(index, 'valorCobrado', e.target.value)}
                        placeholder="0,00"
                      />
                    </div>
                    {linha.valorVendido && linha.valorCobrado && parseFloat(linha.valorVendido) > 0 && (
                      <div className="form-group percentual-calculado">
                        <label>Percentual Calculado:</label>
                        <div className="percentual-display">
                          {calcularPercentual(parseFloat(linha.valorVendido), parseFloat(linha.valorCobrado || '0')).toFixed(2)}%
                        </div>
                      </div>
                    )}
                  </>
                )}
                {plataformasLinhas.length > 1 && (
                  <button
                    className="btn-remover-linha"
                    onClick={() => removerLinha(index)}
                    title="Remover linha"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
            ))}
            <div style={{ textAlign: 'center', marginTop: '15px' }}>
              <button onClick={adicionarLinha} className="btn-secondary">
                <FaPlus /> Adicionar Outra Linha
              </button>
            </div>
          </div>
        ) : (
          <div className="modal-editar-item-form-simples">
            <div className="form-group">
              <label htmlFor="plataforma-nome">Nome da Plataforma:</label>
              <input
                type="text"
                id="plataforma-nome"
                className="form-input"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                placeholder="Ex: iFood, Uber Eats, etc."
              />
            </div>
            <div className="form-group">
              <label htmlFor="plataforma-tipo-calculo">Tipo de Cálculo:</label>
              <select
                id="plataforma-tipo-calculo"
                className="form-input"
                value={formTipoCalculo}
                onChange={(e) => setFormTipoCalculo(e.target.value as TipoCalculo)}
              >
                <option value="percentual">Percentual Direto</option>
                <option value="valor">Valor Vendido + Taxa Cobrada</option>
              </select>
            </div>
            {formTipoCalculo === 'percentual' ? (
              <div className="form-group">
                <label htmlFor="plataforma-taxa">Taxa da Plataforma (%):</label>
                <input
                  type="number"
                  id="plataforma-taxa"
                  className="form-input"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formTaxa}
                  onChange={(e) => setFormTaxa(e.target.value)}
                  placeholder="0,00"
                />
                <small className="form-help">Percentual que a plataforma cobra sobre cada venda</small>
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label htmlFor="plataforma-valor-vendido">Valor Vendido (R$):</label>
                  <input
                    type="number"
                    id="plataforma-valor-vendido"
                    className="form-input"
                    step="0.01"
                    min="0"
                    value={formValorVendido}
                    onChange={(e) => setFormValorVendido(e.target.value)}
                    placeholder="0,00"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="plataforma-valor-cobrado">Taxa Cobrada (R$):</label>
                  <input
                    type="number"
                    id="plataforma-valor-cobrado"
                    className="form-input"
                    step="0.01"
                    min="0"
                    value={formValorCobrado}
                    onChange={(e) => setFormValorCobrado(e.target.value)}
                    placeholder="0,00"
                  />
                </div>
                {formValorVendido && formValorCobrado && parseFloat(formValorVendido) > 0 && (
                  <div className="form-group">
                    <label>Percentual Calculado:</label>
                    <div className="percentual-display">
                      {calcularPercentual(parseFloat(formValorVendido), parseFloat(formValorCobrado)).toFixed(2)}%
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default GerenciamentoPlataformas;

