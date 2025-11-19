import { useState, useEffect } from 'react';
import { apiService } from './services/api';
import type { ItensPorCategoria, Item, TipoReajuste } from './types';
import Header from './components/Header';
import ReajusteForm from './components/ReajusteForm';
import ItensSection from './components/ItensSection';
import AdicionarProdutoSection from './components/AdicionarProdutoSection';
import ConfirmacaoReajusteModal from './components/ConfirmacaoReajusteModal';
import PainelAdmin from './components/PainelAdmin';
import GerenciamentoPlataformas from './components/GerenciamentoPlataformas';
import { mostrarAlert, mostrarConfirm } from './utils/modals';
import './App.css';

function App() {
  const [itensPorCategoria, setItensPorCategoria] = useState<ItensPorCategoria>({});
  const [itensSelecionados, setItensSelecionados] = useState<Set<number>>(new Set());
  const [categoriasColapsadas, setCategoriasColapsadas] = useState<Set<string>>(new Set());
  const [tipoReajuste, setTipoReajuste] = useState<TipoReajuste>('fixo');
  const [valorReajuste, setValorReajuste] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showConfirmacaoModal, setShowConfirmacaoModal] = useState(false);
  const [itensParaReajustar, setItensParaReajustar] = useState<Item[]>([]);
  const [showPainelAdmin, setShowPainelAdmin] = useState(false);
  const [showPlataformas, setShowPlataformas] = useState(false);

  useEffect(() => {
    carregarItens();
  }, []);

  const carregarItens = async () => {
    try {
      setLoading(true);
      const itens = await apiService.obterTodosItens();
      setItensPorCategoria(itens);
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleItemSelecionado = (itemId: number) => {
    setItensSelecionados(prev => {
      const novo = new Set(prev);
      if (novo.has(itemId)) {
        novo.delete(itemId);
      } else {
        novo.add(itemId);
      }
      return novo;
    });
  };

  const selecionarTodos = () => {
    const todosIds = new Set<number>();
    Object.values(itensPorCategoria).forEach(itens => {
      itens.forEach(item => todosIds.add(item.id));
    });
    setItensSelecionados(todosIds);
  };

  const deselecionarTodos = () => {
    setItensSelecionados(new Set());
  };

  const aplicarReajuste = async () => {
    if (itensSelecionados.size === 0) {
      await mostrarAlert('Atenção', 'Selecione pelo menos um item para aplicar o reajuste.');
      return;
    }

    if (!valorReajuste || parseFloat(valorReajuste) <= 0) {
      await mostrarAlert('Erro', 'Informe um valor válido para o reajuste.');
      return;
    }

    const itens: Item[] = [];

    Object.values(itensPorCategoria).forEach(categoriaItens => {
      categoriaItens.forEach(item => {
        if (itensSelecionados.has(item.id)) {
          itens.push(item);
        }
      });
    });

    setItensParaReajustar(itens);
    setShowConfirmacaoModal(true);
  };

  const confirmarReajuste = async () => {
    setShowConfirmacaoModal(false);
    const valor = parseFloat(valorReajuste);

    try {
      for (const item of itensParaReajustar) {
        let novoValor: number;
        
        if (tipoReajuste === 'fixo') {
          novoValor = item.valor + valor;
        } else {
          novoValor = item.valor * (1 + valor / 100);
        }

        // Salvar backup antes de aplicar
        await apiService.salvarBackupValor(item.id, item.valor);
        await apiService.atualizarValorNovo(item.id, novoValor);
      }

      await carregarItens();
      setItensSelecionados(new Set());
      await mostrarAlert('Sucesso', 'Reajuste aplicado com sucesso!');
    } catch (error) {
      console.error('Erro ao aplicar reajuste:', error);
      await mostrarAlert('Erro', 'Erro ao aplicar reajuste. Tente novamente.');
    }
  };

  const resetarValores = async () => {
    const confirmado = await mostrarConfirm(
      'Resetar Valores',
      'Tem certeza que deseja resetar todos os valores para os padrões?'
    );
    
    if (!confirmado) {
      return;
    }

    try {
      await apiService.resetarValores();
      await carregarItens();
      await mostrarAlert('Sucesso', 'Valores resetados com sucesso!');
    } catch (error) {
      console.error('Erro ao resetar valores:', error);
      await mostrarAlert('Erro', 'Erro ao resetar valores. Tente novamente.');
    }
  };

  const toggleCategoria = (categoria: string) => {
    setCategoriasColapsadas(prev => {
      const novo = new Set(prev);
      if (novo.has(categoria)) {
        novo.delete(categoria);
      } else {
        novo.add(categoria);
      }
      return novo;
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="patinha patinha-top-left">
        <img src="/patinha.png" alt="Patinha" />
      </div>
      <div className="patinha patinha-top-right">
        <img src="/patinha.png" alt="Patinha" />
      </div>
      <div className="patinha patinha-bottom-left">
        <img src="/patinha.png" alt="Patinha" />
      </div>
      <div className="patinha patinha-bottom-right">
        <img src="/patinha.png" alt="Patinha" />
      </div>

      <div className="container">
        <Header />
        
        <div className="main-content">
          <ReajusteForm
            tipoReajuste={tipoReajuste}
            valorReajuste={valorReajuste}
            onTipoReajusteChange={setTipoReajuste}
            onValorReajusteChange={setValorReajuste}
            onSelecionarTodos={selecionarTodos}
            onDeselecionarTodos={deselecionarTodos}
            onAplicarReajuste={aplicarReajuste}
            onResetarValores={resetarValores}
          />

          <AdicionarProdutoSection
            categorias={Object.keys(itensPorCategoria)}
            onItemAdded={carregarItens}
          />

          <div className="adicionar-produto-section">
            <button onClick={() => setShowPlataformas(true)} className="btn-adicionar-produto btn-plataformas">
              <i className="fas fa-store"></i> Gerenciar Plataformas
            </button>
            <button onClick={() => setShowPainelAdmin(true)} className="btn-adicionar-produto btn-admin">
              <i className="fas fa-cog"></i> Painel de Personalização
            </button>
          </div>

          <ItensSection
            itensPorCategoria={itensPorCategoria}
            itensSelecionados={itensSelecionados}
            categoriasColapsadas={categoriasColapsadas}
            onToggleItem={toggleItemSelecionado}
            onToggleCategoria={toggleCategoria}
            onItemUpdated={carregarItens}
          />
        </div>
      </div>

      <ConfirmacaoReajusteModal
        isOpen={showConfirmacaoModal}
        tipoReajuste={tipoReajuste}
        valorReajuste={parseFloat(valorReajuste) || 0}
        itens={itensParaReajustar}
        onConfirm={confirmarReajuste}
        onCancel={() => setShowConfirmacaoModal(false)}
      />

      <PainelAdmin
        isOpen={showPainelAdmin}
        onClose={() => setShowPainelAdmin(false)}
      />

      <GerenciamentoPlataformas
        isOpen={showPlataformas}
        onClose={() => setShowPlataformas(false)}
      />
    </div>
  );
}

export default App;
