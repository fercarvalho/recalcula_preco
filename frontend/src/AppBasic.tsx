import { useState, useEffect } from 'react';
import type { ItensPorCategoria, Item, TipoReajuste } from './types';
import HeaderDemo from './components/HeaderDemo';
import ReajusteFormDemo from './components/ReajusteFormDemo';
import ItensSectionDemo from './components/ItensSectionDemo';
import AdicionarProdutoSectionDemo from './components/AdicionarProdutoSectionDemo';
import ConfirmacaoReajusteModal from './components/ConfirmacaoReajusteModal';
import AdicionarCategoriaModalDemo from './components/AdicionarCategoriaModalDemo';
import EditarItemModalDemo from './components/EditarItemModalDemo';
import GerenciamentoPlataformasDemo from './components/GerenciamentoPlataformasDemo';
import PainelAdminDemo from './components/PainelAdminDemo';
import { sessionStorageService } from './services/sessionStorage';
import { mostrarAlert, mostrarConfirm } from './utils/modals';
import { aplicarConfiguracoesDemo } from './utils/configuracoesDemo';
import './App.css';

function AppBasic() {
  const [itensPorCategoria, setItensPorCategoria] = useState<ItensPorCategoria>({});
  const [itensSelecionados, setItensSelecionados] = useState<Set<number>>(new Set());
  const [categoriasColapsadas, setCategoriasColapsadas] = useState<Set<string>>(new Set());
  const [tipoReajuste, setTipoReajuste] = useState<TipoReajuste>('fixo');
  const [valorReajuste, setValorReajuste] = useState<string>('');
  const [showConfirmacaoModal, setShowConfirmacaoModal] = useState(false);
  const [itensParaReajustar, setItensParaReajustar] = useState<Item[]>([]);
  const [showPlataformas, setShowPlataformas] = useState(false);
  const [showAdicionarCategoriaModal, setShowAdicionarCategoriaModal] = useState(false);
  const [showEditarItemModal, setShowEditarItemModal] = useState(false);
  const [showPainelAdmin, setShowPainelAdmin] = useState(false);

  useEffect(() => {
    // Aplicar configurações de cores
    const config = sessionStorageService.obterConfiguracoes();
    aplicarConfiguracoesDemo(config);
    
    // Carregar itens
    carregarItens();
  }, []);

  const carregarItens = () => {
    const itens = sessionStorageService.obterTodosItens();
    setItensPorCategoria(itens);
    
    // Selecionar todos por padrão
    const todosIds = new Set<number>();
    Object.values(itens).forEach(itensDaCategoria => {
      itensDaCategoria.forEach(item => todosIds.add(item.id));
    });
    setItensSelecionados(todosIds);
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

  const toggleCategoriaSelecionada = (categoria: string) => {
    const itensDaCategoria = itensPorCategoria[categoria] || [];
    const todosSelecionados = itensDaCategoria.every(item => itensSelecionados.has(item.id));
    
    setItensSelecionados(prev => {
      const novo = new Set(prev);
      if (todosSelecionados) {
        itensDaCategoria.forEach(item => novo.delete(item.id));
      } else {
        itensDaCategoria.forEach(item => novo.add(item.id));
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
        const valorBase = item.valorNovo !== null && item.valorNovo !== undefined ? item.valorNovo : item.valor;
        let novoValor: number;
        
        if (tipoReajuste === 'fixo') {
          novoValor = valorBase + valor;
        } else {
          novoValor = valorBase * (1 + valor / 100);
        }

        sessionStorageService.salvarBackupValor(item.id, valorBase);
        sessionStorageService.atualizarValorNovo(item.id, novoValor);
      }

      carregarItens();
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
    
    if (!confirmado) return;

    try {
      sessionStorageService.resetarValores();
      carregarItens();
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
        <HeaderDemo
          onReiniciarSistema={async () => {
            const confirmado = await mostrarConfirm(
              'Reiniciar Sistema',
              'Tem certeza? Todos os dados serão apagados.'
            );
            if (confirmado) {
              sessionStorage.clear();
              carregarItens();
              await mostrarAlert('Sucesso', 'Sistema reiniciado!');
            }
          }}
          onReexibirTutorial={() => {}}
        />
        
        <div className="main-content">
          <ReajusteFormDemo
            tipoReajuste={tipoReajuste}
            valorReajuste={valorReajuste}
            onTipoReajusteChange={setTipoReajuste}
            onValorReajusteChange={setValorReajuste}
            onSelecionarTodos={selecionarTodos}
            onDeselecionarTodos={deselecionarTodos}
            onAplicarReajuste={aplicarReajuste}
            onResetarValores={resetarValores}
          />

          <AdicionarProdutoSectionDemo
            categorias={Object.keys(itensPorCategoria)}
            onItemAdded={carregarItens}
            onOpenPlataformas={() => setShowPlataformas(true)}
            onOpenPainelAdmin={() => setShowPainelAdmin(true)}
            onOpenAdicionarCategoria={() => setShowAdicionarCategoriaModal(true)}
            onOpenAdicionarItem={() => {
              if (Object.keys(itensPorCategoria).length === 0) {
                mostrarAlert('Atenção', 'Crie uma categoria primeiro.');
                return;
              }
              setShowEditarItemModal(true);
            }}
          />

          <ItensSectionDemo
            itensPorCategoria={itensPorCategoria}
            itensSelecionados={itensSelecionados}
            categoriasColapsadas={categoriasColapsadas}
            onToggleItem={toggleItemSelecionado}
            onToggleCategoria={toggleCategoria}
            onToggleCategoriaSelecionada={toggleCategoriaSelecionada}
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

      {showPainelAdmin && (
        <PainelAdminDemo
          isOpen={showPainelAdmin}
          onClose={() => setShowPainelAdmin(false)}
        />
      )}

      {showPlataformas && (
        <GerenciamentoPlataformasDemo
          isOpen={showPlataformas}
          onClose={() => setShowPlataformas(false)}
        />
      )}

      <AdicionarCategoriaModalDemo
        isOpen={showAdicionarCategoriaModal}
        onClose={() => setShowAdicionarCategoriaModal(false)}
        onSave={async (nome: string, icone: string | null) => {
          try {
            sessionStorageService.criarCategoria(nome, icone);
            await mostrarAlert('Sucesso', `Categoria "${nome}" criada!`);
            carregarItens();
            setShowAdicionarCategoriaModal(false);
          } catch (error: any) {
            await mostrarAlert('Erro', error.message || 'Erro ao criar categoria.');
          }
        }}
      />

      <EditarItemModalDemo
        isOpen={showEditarItemModal}
        item={null}
        categorias={Object.keys(itensPorCategoria)}
        modoAdicionar={true}
        onClose={() => setShowEditarItemModal(false)}
        onSave={() => {
          carregarItens();
          setShowEditarItemModal(false);
        }}
      />
    </div>
  );
}

export default AppBasic;

