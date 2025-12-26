import { useState, useEffect } from 'react';
import Modal from './Modal';
import { sessionStorageService } from '../services/sessionStorage';
import { mostrarAlert } from '../utils/modals';
import type { Item } from '../types';
import { FaTimes, FaPlus, FaCheck } from 'react-icons/fa';
import './EditarItemModal.css';

interface EditarItemModalDemoProps {
  isOpen: boolean;
  item: Item | null;
  categorias: string[];
  categoriaAtual?: string;
  modoAdicionar?: boolean;
  onClose: () => void;
  onSave: () => void;
}

interface ItemLinha {
  nome: string;
  valor: string;
  categoria: string;
}

const EditarItemModalDemo = ({
  isOpen,
  item,
  categorias,
  categoriaAtual,
  modoAdicionar = false,
  onClose,
  onSave,
}: EditarItemModalDemoProps) => {
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
    if (modoMultiplo) {
      const itensValidos = itensLinhas.filter(
        linha => linha.nome.trim() && linha.valor && parseFloat(linha.valor) >= 0 && linha.categoria
      );

      if (itensValidos.length === 0) {
        await mostrarAlert('Erro', 'Adicione pelo menos um item válido.');
        return;
      }

      try {
        let sucessos = 0;
        for (const itemLinha of itensValidos) {
          try {
            sessionStorageService.criarItem(
              itemLinha.categoria,
              itemLinha.nome.trim(),
              parseFloat(itemLinha.valor)
            );
            sucessos++;
          } catch (error: any) {
            console.error('Erro ao adicionar item:', itemLinha, error);
          }
        }

        await mostrarAlert('Sucesso', `${sucessos} produto(s) adicionado(s) com sucesso!`);
        onSave();
        onClose();
      } catch (error) {
        await mostrarAlert('Erro', 'Erro ao adicionar os produtos. Tente novamente.');
      }
    } else {
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
          sessionStorageService.criarItem(categoria, nome.trim(), parseFloat(valor));
          await mostrarAlert('Sucesso', 'Produto adicionado com sucesso!');
        } else if (item) {
          sessionStorageService.atualizarItem(item.id, { nome: nome.trim(), valor: parseFloat(valor), categoria });
          await mostrarAlert('Sucesso', 'Item atualizado com sucesso!');
        }
        onSave();
        onClose();
      } catch (error: any) {
        await mostrarAlert('Erro', error.message || 'Erro ao salvar o item. Tente novamente.');
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
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={linha.valor}
                  onChange={(e) => atualizarLinha(index, 'valor', e.target.value)}
                  placeholder="0,00"
                />
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
                  type="button"
                  onClick={() => removerLinha(index)}
                  className="btn-remover-linha"
                >
                  <FaTimes />
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={adicionarLinha} className="btn-adicionar-linha">
            <FaPlus /> Adicionar Linha
          </button>
        </div>
      ) : (
        <div className="editar-item-form">
          <div className="form-group">
            <label htmlFor="item-nome">Nome do Item:</label>
            <input
              id="item-nome"
              type="text"
              className="form-input"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Digite o nome do item"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="item-valor">Valor (R$):</label>
            <input
              id="item-valor"
              type="number"
              step="0.01"
              min="0"
              className="form-input"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
            />
          </div>
          <div className="form-group">
            <label htmlFor="item-categoria">Categoria:</label>
            <select
              id="item-categoria"
              className="form-input"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            >
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

export default EditarItemModalDemo;

