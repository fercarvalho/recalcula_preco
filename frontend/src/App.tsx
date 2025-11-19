import { useState, useEffect } from 'react';
import { apiService } from './services/api';
import type { ItensPorCategoria, Item, TipoReajuste } from './types';
import Header from './components/Header';
import ReajusteForm from './components/ReajusteForm';
import ItensSection from './components/ItensSection';
import AdicionarProdutoSection from './components/AdicionarProdutoSection';
import ConfirmacaoReajusteModal from './components/ConfirmacaoReajusteModal';
import PainelAdmin from './components/PainelAdmin';
import AdminPanel from './components/AdminPanel';
import GerenciamentoPlataformas from './components/GerenciamentoPlataformas';
import TutorialOnboarding, { isTutorialCompleted } from './components/TutorialOnboarding';
import Login from './components/Login';
import AdicionarCategoriaModal from './components/AdicionarCategoriaModal';
import EditarItemModal from './components/EditarItemModal';
import { isAuthenticated, getToken, getUser, saveAuth } from './services/auth';
import { carregarPlataformas } from './utils/plataformas';
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
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showPlataformas, setShowPlataformas] = useState(false);
  const [showAdicionarCategoriaModal, setShowAdicionarCategoriaModal] = useState(false);
  const [showEditarItemModal, setShowEditarItemModal] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [totalPlataformas, setTotalPlataformas] = useState(0);
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Verificar autenticação
    const checkAuth = async () => {
      if (isAuthenticated()) {
        try {
          // Verificar se o token ainda é válido
          const API_BASE = import.meta.env.VITE_API_BASE || window.location.origin;
          const token = getToken();
          const response = await fetch(`${API_BASE}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            // Atualizar dados do usuário no localStorage incluindo is_admin
            if (data.user) {
              saveAuth(getToken() || '', data.user);
            }
            setAuthenticated(true);
            carregarItens();
            // Verificar se é a primeira vez e mostrar tutorial
            if (!isTutorialCompleted()) {
              setShowTutorial(true);
            }
          } else {
            setAuthenticated(false);
          }
        } catch (error) {
          console.error('Erro ao verificar autenticação:', error);
          setAuthenticated(false);
        }
      } else {
        setAuthenticated(false);
      }
      setCheckingAuth(false);
    };
    
    checkAuth();
    
    // Atualizar contagem de plataformas
    setTotalPlataformas(carregarPlataformas().length);
    
    // Listener para atualizar quando plataformas mudarem
    const handlePlataformasUpdate = () => {
      setTotalPlataformas(carregarPlataformas().length);
    };
    
    window.addEventListener('plataformas-updated', handlePlataformasUpdate);
    
    return () => {
      window.removeEventListener('plataformas-updated', handlePlataformasUpdate);
    };
  }, []);

  const carregarItens = async () => {
    try {
      setLoading(true);
      const itens = await apiService.obterTodosItens();
      setItensPorCategoria(itens);
      
      // Selecionar todos os itens por padrão
      const todosIds = new Set<number>();
      Object.values(itens).forEach(itensDaCategoria => {
        itensDaCategoria.forEach(item => todosIds.add(item.id));
      });
      setItensSelecionados(todosIds);
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

  const toggleCategoriaSelecionada = (categoria: string) => {
    const itensDaCategoria = itensPorCategoria[categoria] || [];
    const todosSelecionados = itensDaCategoria.every(item => itensSelecionados.has(item.id));
    
    setItensSelecionados(prev => {
      const novo = new Set(prev);
      if (todosSelecionados) {
        // Deselecionar todos os itens da categoria
        itensDaCategoria.forEach(item => novo.delete(item.id));
      } else {
        // Selecionar todos os itens da categoria
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

  const handleReiniciarSistema = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || window.location.origin;
      const token = getToken();

      const response = await fetch(`${API_BASE}/api/auth/reiniciar-sistema`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao reiniciar sistema');
      }

      await mostrarAlert('Sucesso', 'Sistema reiniciado com sucesso! Todos os dados foram apagados.');
      await carregarItens();
    } catch (error: any) {
      console.error('Erro ao reiniciar sistema:', error);
      await mostrarAlert('Erro', error.message || 'Erro ao reiniciar sistema. Tente novamente.');
    }
  };

  const handleReexibirTutorial = () => {
    // Limpar flag de tutorial completo
    localStorage.removeItem('calculadora_tutorial_completed');
    localStorage.removeItem('calculadora_tutorial_step');
    setShowTutorial(true);
  };

  if (checkingAuth) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando...</p>
      </div>
    );
  }

  if (!authenticated) {
    return <Login onLoginSuccess={() => {
      setAuthenticated(true);
      carregarItens();
      if (!isTutorialCompleted()) {
        setShowTutorial(true);
      }
    }} />;
  }

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
        <Header
          onReiniciarSistema={handleReiniciarSistema}
          onReexibirTutorial={handleReexibirTutorial}
          onOpenAdminPanel={() => setShowAdminPanel(true)}
          isAdmin={getUser()?.is_admin || false}
        />
        
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
            onOpenPlataformas={() => setShowPlataformas(true)}
            onOpenPainelAdmin={() => setShowPainelAdmin(true)}
            onOpenAdicionarCategoria={() => setShowAdicionarCategoriaModal(true)}
            onOpenAdicionarItem={() => {
              if (Object.keys(itensPorCategoria).length === 0) {
                mostrarAlert('Atenção', 'Não há categorias disponíveis. Por favor, crie uma categoria primeiro.');
                return;
              }
              setShowEditarItemModal(true);
            }}
          />

              <ItensSection
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

      <PainelAdmin
        isOpen={showPainelAdmin}
        onClose={() => setShowPainelAdmin(false)}
      />

      <AdminPanel
        isOpen={showAdminPanel}
        onClose={() => setShowAdminPanel(false)}
        onCarregarUsuarioNoSistema={async (usuarioId: number) => {
          try {
            setLoading(true);
            // Carregar itens do usuário selecionado
            const API_BASE = import.meta.env.VITE_API_BASE || window.location.origin;
            const token = getToken();
            
            // Obter dados do usuário
            const response = await fetch(`${API_BASE}/api/admin/usuarios/${usuarioId}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });

            if (response.ok) {
              const data = await response.json();
              
              // Converter o objeto de itens por categoria para o formato esperado
              const itensPorCategoria: ItensPorCategoria = {};
              Object.keys(data.itens || {}).forEach(categoria => {
                itensPorCategoria[categoria] = (data.itens[categoria] || []).map((item: any) => ({
                  id: item.id,
                  nome: item.nome,
                  valor: item.valor,
                  valorNovo: item.valorNovo,
                  valorBackup: item.valorBackup || item.valor,
                  categoria: categoria,
                  ordem: item.ordem || 0,
                }));
              });
              
              setItensPorCategoria(itensPorCategoria);
              
              // Selecionar todos os itens por padrão (igual ao comportamento normal)
              const todosIds = new Set<number>();
              Object.values(itensPorCategoria).forEach(itensDaCategoria => {
                itensDaCategoria.forEach(item => todosIds.add(item.id));
              });
              setItensSelecionados(todosIds);
              
              // Salvar o ID do usuário sendo visualizado no localStorage
              localStorage.setItem('admin_viewing_user_id', usuarioId.toString());
              
              await mostrarAlert('Sucesso', `Dados do usuário "${data.usuario.username}" carregados no sistema!`);
            } else {
              throw new Error('Erro ao carregar dados do usuário');
            }
          } catch (error: any) {
            console.error('Erro ao carregar dados do usuário:', error);
            await mostrarAlert('Erro', error.message || 'Erro ao carregar dados do usuário.');
          } finally {
            setLoading(false);
          }
        }}
      />

      <GerenciamentoPlataformas
        isOpen={showPlataformas}
        onClose={() => setShowPlataformas(false)}
      />

      <AdicionarCategoriaModal
        isOpen={showAdicionarCategoriaModal}
        onClose={() => setShowAdicionarCategoriaModal(false)}
        onSave={async (nome: string, icone: string | null) => {
          try {
            await apiService.criarCategoria(nome, icone);
            await mostrarAlert('Sucesso', `Categoria "${nome}" criada com sucesso!`);
            await carregarItens();
            setShowAdicionarCategoriaModal(false);
          } catch (error: any) {
            const mensagemErro = error.response?.data?.error || error.message || 'Erro ao criar a categoria. Tente novamente.';
            if (mensagemErro.includes('UNIQUE') || mensagemErro.includes('já existe')) {
              await mostrarAlert('Erro', 'Esta categoria já existe!');
            } else {
              await mostrarAlert('Erro', mensagemErro);
            }
          }
        }}
      />

      <EditarItemModal
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

      <TutorialOnboarding
        isOpen={showTutorial}
        onComplete={() => {
          setShowTutorial(false);
          carregarItens();
        }}
        onSkip={() => setShowTutorial(false)}
        categorias={Object.keys(itensPorCategoria)}
        totalItens={Object.values(itensPorCategoria).reduce((acc, itens) => acc + itens.length, 0)}
        totalPlataformas={totalPlataformas}
        onOpenAdicionarCategoria={() => setShowAdicionarCategoriaModal(true)}
        onOpenAdicionarItem={() => {
          if (Object.keys(itensPorCategoria).length === 0) {
            mostrarAlert('Atenção', 'Não há categorias disponíveis. Por favor, crie uma categoria primeiro.');
            return;
          }
          setShowEditarItemModal(true);
        }}
        onOpenPlataformas={() => setShowPlataformas(true)}
        modalAberto={
          showAdicionarCategoriaModal ? 'categoria' :
          showEditarItemModal ? 'item' :
          showPlataformas ? 'plataformas' :
          null
        }
      />
    </div>
  );
}

export default App;
