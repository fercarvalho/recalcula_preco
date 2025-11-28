import { useState, useEffect } from 'react';
import Modal from './Modal';
import { mostrarAlert, mostrarConfirm } from '../utils/modals';
import { carregarPlataformas, salvarPlataformas, limparCachePlataformas, type Plataforma } from '../utils/plataformas';
import { apiService } from '../services/api';
import { getUser } from '../services/auth';
import { FaStore, FaPlus, FaEdit, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';
import './GerenciamentoPlataformas.css';

interface GerenciamentoPlataformasProps {
  isOpen: boolean;
  onClose: () => void;
}

type TipoCalculo = 'percentual' | 'valor';
type PeriodoCalculo = '1mes' | '3meses';

interface ValoresMensais {
  valorVendido: string;
  valorCobrado: string;
}

interface PlataformaLinha {
  nome: string;
  taxa: string;
  tipoCalculo: TipoCalculo;
  periodoCalculo?: PeriodoCalculo;
  valorVendido?: string;
  valorCobrado?: string;
  valoresMensais?: ValoresMensais[];
}

const GerenciamentoPlataformas = ({ isOpen, onClose }: GerenciamentoPlataformasProps) => {
  const user = getUser();
  const userId = user?.id;
  const [plataformas, setPlataformas] = useState<Plataforma[]>([]);
  const [editingPlataforma, setEditingPlataforma] = useState<Plataforma | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [modoMultiplo, setModoMultiplo] = useState(false);
  const [formNome, setFormNome] = useState('');
  const [formTaxa, setFormTaxa] = useState('');
  const [formTipoCalculo, setFormTipoCalculo] = useState<TipoCalculo>('percentual');
  const [formPeriodoCalculo, setFormPeriodoCalculo] = useState<PeriodoCalculo>('1mes');
  const [formValorVendido, setFormValorVendido] = useState('');
  const [formValorCobrado, setFormValorCobrado] = useState('');
  const [formValoresMensais, setFormValoresMensais] = useState<ValoresMensais[]>([
    { valorVendido: '', valorCobrado: '' },
    { valorVendido: '', valorCobrado: '' },
    { valorVendido: '', valorCobrado: '' },
  ]);
  const [plataformasLinhas, setPlataformasLinhas] = useState<PlataformaLinha[]>([
    { nome: '', taxa: '', tipoCalculo: 'percentual', periodoCalculo: '1mes' },
  ]);

  useEffect(() => {
    if (isOpen) {
      carregarPlataformas(userId).then(plataformas => {
        setPlataformas(plataformas);
      }).catch(error => {
        console.error('Erro ao carregar plataformas:', error);
        setPlataformas([]);
      });
    }
  }, [isOpen, userId]);

  const handleAdicionar = () => {
    setEditingPlataforma(null);
    setModoMultiplo(false);
    setFormNome('');
    setFormTaxa('');
    setFormTipoCalculo('percentual');
    setFormPeriodoCalculo('1mes');
    setFormValorVendido('');
    setFormValorCobrado('');
    setFormValoresMensais([
      { valorVendido: '', valorCobrado: '' },
      { valorVendido: '', valorCobrado: '' },
      { valorVendido: '', valorCobrado: '' },
    ]);
    setPlataformasLinhas([{ nome: '', taxa: '', tipoCalculo: 'percentual', periodoCalculo: '1mes' }]);
    setShowFormModal(true);
  };

  const adicionarLinha = () => {
    setPlataformasLinhas([...plataformasLinhas, { nome: '', taxa: '', tipoCalculo: 'percentual', periodoCalculo: '1mes' }]);
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

  const calcularMediaPercentual = (valoresMensais: ValoresMensais[]): number => {
    const percentuais: number[] = [];
    
    for (const valores of valoresMensais) {
      const valorVendido = parseFloat(valores.valorVendido || '0');
      const valorCobrado = parseFloat(valores.valorCobrado || '0');
      
      if (valorVendido > 0) {
        percentuais.push(calcularPercentual(valorVendido, valorCobrado));
      }
    }
    
    if (percentuais.length === 0) return 0;
    
    const soma = percentuais.reduce((acc, val) => acc + val, 0);
    return soma / percentuais.length;
  };

  const handleEditar = (plataforma: Plataforma) => {
    setEditingPlataforma(plataforma);
    setModoMultiplo(false);
    setFormNome(plataforma.nome);
    setFormTaxa(plataforma.taxa.toString());
    setFormTipoCalculo('percentual');
    setFormPeriodoCalculo('1mes');
    setFormValorVendido('');
    setFormValorCobrado('');
    setFormValoresMensais([
      { valorVendido: '', valorCobrado: '' },
      { valorVendido: '', valorCobrado: '' },
      { valorVendido: '', valorCobrado: '' },
    ]);
    setPlataformasLinhas([{ nome: '', taxa: '', tipoCalculo: 'percentual', periodoCalculo: '1mes' }]);
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
          if (linha.periodoCalculo === '1mes') {
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
          } else {
            // Últimos 3 meses - calcular média
            if (!linha.valoresMensais || linha.valoresMensais.length !== 3) continue;
            
            const valoresValidos = linha.valoresMensais.filter(
              v => parseFloat(v.valorVendido || '0') > 0
            );
            
            if (valoresValidos.length === 0) continue;
            
            // Validar cada mês
            for (let i = 0; i < linha.valoresMensais.length; i++) {
              const valores = linha.valoresMensais[i];
              const valorVendido = parseFloat(valores.valorVendido || '0');
              const valorCobrado = parseFloat(valores.valorCobrado || '0');
              
              if (valorVendido > 0) {
                if (isNaN(valorCobrado) || valorCobrado < 0) {
                  await mostrarAlert('Erro', `Na plataforma "${linha.nome.trim()}", o mês ${i + 1} tem valor vendido mas não tem valor cobrado.`);
                  return;
                }
                if (valorCobrado > valorVendido) {
                  await mostrarAlert('Erro', `Na plataforma "${linha.nome.trim()}", no mês ${i + 1}, o valor cobrado não pode ser maior que o valor vendido.`);
                  return;
                }
              }
            }
            
            taxa = calcularMediaPercentual(linha.valoresMensais);
            if (taxa > 100) continue;
          }
        }

        plataformasValidas.push({ nome: linha.nome.trim(), taxa });
      }

      if (plataformasValidas.length === 0) {
        await mostrarAlert('Erro', 'Adicione pelo menos uma plataforma válida.');
        return;
      }

      try {
        const novasPlataformas = [...plataformas];
        
        // Criar plataformas no banco de dados
        for (const plataforma of plataformasValidas) {
          const novaPlataforma = await apiService.criarPlataforma(plataforma.nome, plataforma.taxa);
          novasPlataformas.push(novaPlataforma);
        }

        setPlataformas(novasPlataformas);
        limparCachePlataformas();
        await salvarPlataformas(novasPlataformas, userId);
        setShowFormModal(false);
        setModoMultiplo(false);
        await mostrarAlert('Sucesso', `${plataformasValidas.length} plataforma(s) adicionada(s) com sucesso!`);
      } catch (error: any) {
        await mostrarAlert('Erro', error.response?.data?.error || error.message || 'Erro ao adicionar plataformas.');
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
        if (formPeriodoCalculo === '1mes') {
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
        } else {
          // Últimos 3 meses - calcular média
          const valoresValidos = formValoresMensais.filter(
            v => parseFloat(v.valorVendido || '0') > 0
          );
          
          if (valoresValidos.length === 0) {
            await mostrarAlert('Erro', 'Adicione pelo menos um mês com valor vendido maior que zero.');
            return;
          }
          
          // Validar cada mês
          for (let i = 0; i < formValoresMensais.length; i++) {
            const valores = formValoresMensais[i];
            const valorVendido = parseFloat(valores.valorVendido || '0');
            const valorCobrado = parseFloat(valores.valorCobrado || '0');
            
            if (valorVendido > 0) {
              if (isNaN(valorCobrado) || valorCobrado < 0) {
                await mostrarAlert('Erro', `O mês ${i + 1} tem valor vendido mas não tem valor cobrado.`);
                return;
              }
              if (valorCobrado > valorVendido) {
                await mostrarAlert('Erro', `No mês ${i + 1}, o valor cobrado não pode ser maior que o valor vendido.`);
                return;
              }
            }
          }
          
          taxa = calcularMediaPercentual(formValoresMensais);
          if (taxa > 100) {
            await mostrarAlert('Erro', 'A média percentual calculada não pode ser maior que 100%.');
            return;
          }
        }
      }

      try {
        if (editingPlataforma) {
          // Atualizar plataforma existente
          const plataformaAtualizada = await apiService.atualizarPlataforma(editingPlataforma.id, formNome.trim(), taxa);
          const novasPlataformas = plataformas.map(p => 
            p.id === editingPlataforma.id ? plataformaAtualizada : p
          );
          setPlataformas(novasPlataformas);
          limparCachePlataformas();
          await salvarPlataformas(novasPlataformas, userId);
        } else {
          // Criar nova plataforma
          const novaPlataforma = await apiService.criarPlataforma(formNome.trim(), taxa);
          const novasPlataformas = [...plataformas, novaPlataforma];
          setPlataformas(novasPlataformas);
          limparCachePlataformas();
          await salvarPlataformas(novasPlataformas, userId);
        }
        
        setShowFormModal(false);
        setEditingPlataforma(null);
        await mostrarAlert('Sucesso', `Plataforma ${editingPlataforma ? 'atualizada' : 'adicionada'} com sucesso!`);
      } catch (error: any) {
        await mostrarAlert('Erro', error.response?.data?.error || error.message || `Erro ao ${editingPlataforma ? 'atualizar' : 'adicionar'} plataforma.`);
      }
    }
  };

  const handleDeletar = async (plataforma: Plataforma) => {
    const confirmado = await mostrarConfirm(
      'Confirmar Exclusão',
      `Tem certeza que deseja deletar a plataforma "${plataforma.nome}"?`
    );

    if (confirmado) {
      try {
        await apiService.deletarPlataforma(plataforma.id);
        const novasPlataformas = plataformas.filter(p => p.id !== plataforma.id);
        setPlataformas(novasPlataformas);
        limparCachePlataformas();
        await salvarPlataformas(novasPlataformas, userId);
        await mostrarAlert('Sucesso', 'Plataforma deletada com sucesso!');
      } catch (error: any) {
        await mostrarAlert('Erro', error.response?.data?.error || error.message || 'Erro ao deletar plataforma.');
      }
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
            {plataformasLinhas.map((linha, index) => {
              const valoresMensais = linha.valoresMensais || [
                { valorVendido: '', valorCobrado: '' },
                { valorVendido: '', valorCobrado: '' },
                { valorVendido: '', valorCobrado: '' },
              ];
              const atualizarValoresMensais = (campo: 'valorVendido' | 'valorCobrado', valor: string, mesIndex: number) => {
                const novasLinhas = [...plataformasLinhas];
                if (!novasLinhas[index].valoresMensais) {
                  novasLinhas[index].valoresMensais = [
                    { valorVendido: '', valorCobrado: '' },
                    { valorVendido: '', valorCobrado: '' },
                    { valorVendido: '', valorCobrado: '' },
                  ];
                }
                novasLinhas[index].valoresMensais![mesIndex] = {
                  ...novasLinhas[index].valoresMensais![mesIndex],
                  [campo]: valor,
                };
                setPlataformasLinhas(novasLinhas);
              };
              return (
                <div key={index} className="item-linha-wrapper">
                  <div className="item-linha">
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
                        <div className="form-group periodo">
                          <label>Período:</label>
                          <select
                            value={linha.periodoCalculo || '1mes'}
                            onChange={(e) => {
                              const novoPeriodo = e.target.value as PeriodoCalculo;
                              atualizarLinha(index, 'periodoCalculo', novoPeriodo);
                              if (novoPeriodo === '3meses' && !linha.valoresMensais) {
                                const novasLinhas = [...plataformasLinhas];
                                novasLinhas[index].valoresMensais = [
                                  { valorVendido: '', valorCobrado: '' },
                                  { valorVendido: '', valorCobrado: '' },
                                  { valorVendido: '', valorCobrado: '' },
                                ];
                                setPlataformasLinhas(novasLinhas);
                              }
                            }}
                          >
                            <option value="1mes">Último Mês</option>
                            <option value="3meses">Últimos 3 Meses</option>
                          </select>
                        </div>
                        {linha.periodoCalculo === '1mes' ? (
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
                        ) : null}
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
                  {linha.tipoCalculo === 'valor' && linha.periodoCalculo === '3meses' && (
                    <div className="item-linha-segunda">
                      <div className="meses-container">
                        {[0, 1, 2].map((mesIndex) => (
                          <div key={mesIndex} className="mes-item">
                            <div className="mes-header">Mês {mesIndex + 1}</div>
                            <div className="form-group">
                              <label>Valor Vendido (R$):</label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={valoresMensais[mesIndex]?.valorVendido || ''}
                                onChange={(e) => atualizarValoresMensais('valorVendido', e.target.value, mesIndex)}
                                placeholder="0,00"
                              />
                            </div>
                            <div className="form-group">
                              <label>Taxa Cobrada (R$):</label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={valoresMensais[mesIndex]?.valorCobrado || ''}
                                onChange={(e) => atualizarValoresMensais('valorCobrado', e.target.value, mesIndex)}
                                placeholder="0,00"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      {linha.valoresMensais && linha.valoresMensais.some(v => parseFloat(v.valorVendido || '0') > 0) && (
                        <div className="media-percentual-container">
                          <label>Média Percentual:</label>
                          <div className="percentual-display">
                            {calcularMediaPercentual(linha.valoresMensais).toFixed(2)}%
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
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
                  <label htmlFor="plataforma-periodo">Período:</label>
                  <select
                    id="plataforma-periodo"
                    className="form-input"
                    value={formPeriodoCalculo}
                    onChange={(e) => setFormPeriodoCalculo(e.target.value as PeriodoCalculo)}
                  >
                    <option value="1mes">Último Mês</option>
                    <option value="3meses">Últimos 3 Meses</option>
                  </select>
                </div>
                {formPeriodoCalculo === '1mes' ? (
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
                ) : (
                  <>
                    {[0, 1, 2].map((mesIndex) => (
                      <div key={mesIndex} style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label htmlFor={`mes-${mesIndex}-vendido`}>Mês {mesIndex + 1} - Valor Vendido (R$):</label>
                          <input
                            type="number"
                            id={`mes-${mesIndex}-vendido`}
                            className="form-input"
                            step="0.01"
                            min="0"
                            value={formValoresMensais[mesIndex]?.valorVendido || ''}
                            onChange={(e) => {
                              const novosValores = [...formValoresMensais];
                              novosValores[mesIndex] = { ...novosValores[mesIndex], valorVendido: e.target.value };
                              setFormValoresMensais(novosValores);
                            }}
                            placeholder="0,00"
                          />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label htmlFor={`mes-${mesIndex}-cobrado`}>Mês {mesIndex + 1} - Taxa Cobrada (R$):</label>
                          <input
                            type="number"
                            id={`mes-${mesIndex}-cobrado`}
                            className="form-input"
                            step="0.01"
                            min="0"
                            value={formValoresMensais[mesIndex]?.valorCobrado || ''}
                            onChange={(e) => {
                              const novosValores = [...formValoresMensais];
                              novosValores[mesIndex] = { ...novosValores[mesIndex], valorCobrado: e.target.value };
                              setFormValoresMensais(novosValores);
                            }}
                            placeholder="0,00"
                          />
                        </div>
                      </div>
                    ))}
                    {formValoresMensais.some(v => parseFloat(v.valorVendido || '0') > 0) && (
                      <div className="form-group">
                        <label>Média Percentual:</label>
                        <div className="percentual-display">
                          {calcularMediaPercentual(formValoresMensais).toFixed(2)}%
                        </div>
                      </div>
                    )}
                  </>
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

