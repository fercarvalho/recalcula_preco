import { useState, useEffect } from 'react';
import Modal from './Modal';
import { apiService } from '../services/api';
import { mostrarAlert } from '../utils/modals';
import type { Item } from '../types';
import { FaTimes, FaPlus, FaCheck } from 'react-icons/fa';
import './EditarItemModal.css';

interface EditarItemModalProps {
  isOpen: boolean;
  item: Item | null;
  categorias: string[];
  categoriaAtual?: string;
  modoAdicionar?: boolean;
  onClose: () => void;
  onSave: () => void;
  temAcesso?: boolean;
  onAbrirModalPlanos?: () => void;
}

interface ItemLinha {
  nome: string;
  valor: string;
  categoria: string;
}

const EditarItemModal = ({
  isOpen,
  item,
  categorias,
  categoriaAtual,
  modoAdicionar = false,
  onClose,
  onSave,
  temAcesso = true,
  onAbrirModalPlanos,
}: EditarItemModalProps) => {
  const [modoMultiplo, setModoMultiplo] = useState(false);
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState('');
  const [categoria, setCategoria] = useState('');
  const [itensLinhas, setItensLinhas] = useState<ItemLinha[]>([
    { nome: '', valor: '', categoria: categorias[0] || '' },
  ]);

  useEffect(() => {
    if (isOpen) {
      if (modoAdicionar) {
        setModoMultiplo(false);
        setNome('');
        setValor('');
        // Usar categoriaAtual se fornecida, senão usar a primeira categoria disponível
        const categoriaInicial = categoriaAtual || categorias[0] || '';
        setCategoria(categoriaInicial);
        setItensLinhas([{ nome: '', valor: '', categoria: categoriaInicial }]);
      } else if (item) {
        setModoMultiplo(false);
        setNome(item.nome);
        setValor(item.valor.toString());
        setCategoria(categoriaAtual || categorias[0] || '');
        setItensLinhas([{ nome: item.nome, valor: item.valor.toString(), categoria: categoriaAtual || categorias[0] || '' }]);
      }
    }
  }, [isOpen, item, modoAdicionar, categorias, categoriaAtual]);

  const adicionarLinha = () => {
    // Ao adicionar nova linha, usar categoriaAtual se disponível, senão usar a primeira categoria
    const categoriaPadrao = categoriaAtual || categorias[0] || '';
    setItensLinhas([...itensLinhas, { nome: '', valor: '', categoria: categoriaPadrao }]);
  };

  const removerLinha = (index: number) => {
    if (itensLinhas.length > 1) {
      setItensLinhas(itensLinhas.filter((_, i) => i !== index));
    }
  };

  const atualizarLinha = (index: number, campo: keyof ItemLinha, valor: string) => {
    const novasLinhas = [...itensLinhas];
    novasLinhas[index] = { ...novasLinhas[index], [campo]: valor };
    setItensLinhas(novasLinhas);
  };

  const handleSalvar = async () => {
    // Se estiver editando (não adicionando) e não tiver acesso, bloquear edição de valor
    if (!modoAdicionar && !temAcesso) {
      await mostrarAlert('Acesso Bloqueado', 'Para editar preços, é necessário ter acesso pago. Clique no botão abaixo para liberar acesso.');
      onAbrirModalPlanos?.();
      return;
    }

    if (modoMultiplo) {
      // Modo múltiplo: adicionar vários itens
      const itensValidos = itensLinhas.filter(
        linha => linha.nome.trim() && linha.valor && parseFloat(linha.valor) >= 0 && linha.categoria
      );

      if (itensValidos.length === 0) {
        await mostrarAlert('Erro', 'Adicione pelo menos um item válido.');
        return;
      }

      try {
        let sucessos = 0;
        let erros = 0;

        for (const itemLinha of itensValidos) {
          try {
            await apiService.criarItem(
              itemLinha.categoria,
              itemLinha.nome.trim(),
              parseFloat(itemLinha.valor)
            );
            sucessos++;
          } catch (error: any) {
            console.error('Erro ao adicionar item:', itemLinha, error);
            // Se for erro de item duplicado, informar qual item
            if (error.response?.status === 409 || error.response?.data?.codigo === 'ITEM_DUPLICADO') {
              console.error(`Item duplicado: ${itemLinha.nome} na categoria ${itemLinha.categoria}`);
            }
            erros++;
          }
        }

        if (erros === 0) {
          await mostrarAlert('Sucesso', `${sucessos} produto(s) adicionado(s) com sucesso!`);
        } else {
          await mostrarAlert('Atenção', `${sucessos} produto(s) adicionado(s) com sucesso, mas ${erros} falharam.`);
        }

        onSave();
        onClose();
      } catch (error) {
        await mostrarAlert('Erro', 'Erro ao adicionar os produtos. Tente novamente.');
      }
    } else {
      // Modo simples: editar ou adicionar um item
      if (!nome.trim()) {
        await mostrarAlert('Erro', 'O nome do item é obrigatório.');
        return;
      }

      if (!valor || parseFloat(valor) < 0) {
        await mostrarAlert('Erro', 'O valor do item é obrigatório e deve ser maior ou igual a zero.');
        return;
      }

      if (!categoria) {
        await mostrarAlert('Erro', 'Selecione uma categoria.');
        return;
      }

      try {
        if (modoAdicionar) {
          await apiService.criarItem(categoria, nome.trim(), parseFloat(valor));
          await mostrarAlert('Sucesso', 'Produto adicionado com sucesso!');
        } else if (item) {
          await apiService.atualizarItem(item.id, nome.trim(), parseFloat(valor), categoria || undefined);
          await mostrarAlert('Sucesso', 'Item atualizado com sucesso!');
        }
        onSave();
        onClose();
      } catch (error: any) {
        console.error('Erro completo ao salvar item:', error);
        console.error('Response:', error.response);
        console.error('Data:', error.response?.data);
        
        // Verificar se é erro de item duplicado
        if (error.response?.status === 409 || error.response?.data?.codigo === 'ITEM_DUPLICADO') {
          const mensagem = error.response?.data?.error || 'Já existe um item com este nome nesta categoria.';
          await mostrarAlert('Item Duplicado', mensagem);
        } else {
          // Mostrar mensagem de erro mais detalhada
          const mensagemErro = error.response?.data?.error || error.message || 'Erro ao salvar o item. Tente novamente.';
          console.error('Mensagem de erro:', mensagemErro);
          await mostrarAlert('Erro', mensagemErro);
        }
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modoAdicionar ? 'Adicionar Produto' : 'Editar Item'}
      size="large"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={handleSalvar} className="btn-primary">Salvar</button>
        </>
      }
    >
      {modoAdicionar && (
        <div style={{ marginBottom: '20px' }}>
          <button
            type="button"
            className={`btn-toggle-multiplo ${modoMultiplo ? 'active' : ''}`}
            onClick={() => setModoMultiplo(!modoMultiplo)}
          >
            {modoMultiplo ? <FaCheck /> : <FaPlus />} {modoMultiplo ? 'Modo Múltiplos Itens Ativo' : 'Adicionar Múltiplos Itens'}
          </button>
        </div>
      )}

      {modoMultiplo ? (
        <div className="itens-linhas-container">
          {itensLinhas.map((linha, index) => (
            <div key={index} className="item-linha">
              <div className="form-group nome">
                <label>Nome:</label>
                <input
                  type="text"
                  value={linha.nome}
                  onChange={(e) => atualizarLinha(index, 'nome', e.target.value)}
                  placeholder="Digite o nome do item"
                />
              </div>
              <div className="form-group valor">
                <label>Valor (R$):</label>
                {!temAcesso ? (
                  <div style={{
                    padding: '8px',
                    background: '#fff3cd',
                    border: '2px solid #ffc107',
                    borderRadius: '6px',
                    textAlign: 'center',
                    fontSize: '0.85em',
                    color: '#856404',
                  }}>
                    🔒 Bloqueado
                  </div>
                ) : (
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={linha.valor}
                    onChange={(e) => atualizarLinha(index, 'valor', e.target.value)}
                    placeholder="0,00"
                  />
                )}
              </div>
              <div className="form-group categoria">
                <label>Categoria:</label>
                <select
                  value={linha.categoria}
                  onChange={(e) => atualizarLinha(index, 'categoria', e.target.value)}
                >
                  {categorias.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              {itensLinhas.length > 1 && (
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
            <label htmlFor="modal-editar-item-nome">Nome do Item:</label>
            <input
              type="text"
              id="modal-editar-item-nome"
              className="form-input"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Digite o nome do item"
            />
          </div>
          <div className="form-group">
            <label htmlFor="modal-editar-item-valor">Preço (R$):</label>
            {!modoAdicionar && !temAcesso ? (
              <div style={{
                padding: '10px',
                background: '#fff3cd',
                border: '2px solid #ffc107',
                borderRadius: '6px',
                textAlign: 'center',
              }}>
                <p style={{ margin: '0 0 10px 0', color: '#856404', fontSize: '0.9em' }}>
                  🔒 Edição de preço bloqueada
                </p>
                <button
                  onClick={() => {
                    onAbrirModalPlanos?.();
                  }}
                  style={{
                    background: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.9em',
                    fontWeight: 'bold',
                  }}
                >
                  Clique para liberar acesso
                </button>
              </div>
            ) : (
              <input
                type="number"
                id="modal-editar-item-valor"
                className="form-input"
                step="0.01"
                min="0"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
                disabled={!modoAdicionar && !temAcesso}
              />
            )}
          </div>
          <div className="form-group">
            <label htmlFor="modal-editar-item-categoria">Categoria:</label>
            <select
              id="modal-editar-item-categoria"
              className="form-input"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            >
              <option value="">Selecione uma categoria...</option>
              {categorias.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default EditarItemModal;

