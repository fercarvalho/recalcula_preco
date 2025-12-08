import { useState, useEffect } from 'react';
import { apiService } from './services/api';
import type { ItensPorCategoria, Item, TipoReajuste } from './types';
import Header from './components/Header';
import ReajusteForm from './components/ReajusteForm';
import ItensSection from './components/ItensSection';
import AdicionarProdutoSection from './components/AdicionarProdutoSection';
import ConfirmacaoReajusteModal from './components/ConfirmacaoReajusteModal';
import PainelAdmin, { aplicarConfiguracoes, carregarConfiguracoes } from './components/PainelAdmin';
import AdminPanel from './components/AdminPanel';
import GerenciamentoPlataformas from './components/GerenciamentoPlataformas';
import TutorialOnboarding, { isTutorialCompleted, isTutorialCompletedSync, limparCacheTutorial } from './components/TutorialOnboarding';
import Login from './components/Login';
import LandingPage from './components/LandingPage';
import AdicionarCategoriaModal from './components/AdicionarCategoriaModal';
import EditarItemModal from './components/EditarItemModal';
import ResetarSenhaModal from './components/ResetarSenhaModal';
import { SelecaoPlanos } from './components/SelecaoPlanos';
import Modal from './components/Modal';
import ModalUpgrade from './components/ModalUpgrade';
import ValidarEmailModal from './components/ValidarEmailModal';
import ValidarEmail from './pages/ValidarEmail';
import Cardapio from './pages/Cardapio';
import AlterarDadosModal from './components/AlterarDadosModal';
import { isAuthenticated, getToken, getUser, saveAuth } from './services/auth';
import { carregarPlataformasSync, carregarPlataformas } from './utils/plataformas';

// Função para aplicar configurações do usuário (cores e logo)
const aplicarConfiguracoesUsuario = () => {
  const user = getUser();
  const userId = user?.id;
  
  // Carregar e aplicar configurações do usuário atual
  const config = carregarConfiguracoes(userId);
  aplicarConfiguracoes(config, userId);
};
import { mostrarAlert, mostrarConfirm } from './utils/modals';
import './App.css';

function App() {
  // Verificar se está na rota de validação de email PRIMEIRO
  // Esta verificação deve ser feita ANTES de qualquer estado ou lógica
  const pathname = window.location.pathname;
  const urlParams = new URLSearchParams(window.location.search);
  const validationToken = urlParams.get('token');
  const isValidationRoute = pathname === '/validar-email' || pathname.includes('/validar-email') || (validationToken && window.location.href.includes('validar-email'));
  
  if (isValidationRoute) {
    return <ValidarEmail />;
  }

  // Verificar se está na rota de cardápio (formato: /username/cardapio)
  const cardapioMatch = pathname.match(/^\/([^\/]+)\/cardapio$/);
  if (cardapioMatch) {
    const username = cardapioMatch[1];
    return <Cardapio />;
  }

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
  const [showResetarSenha, setShowResetarSenha] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [temAcesso, setTemAcesso] = useState<boolean | null>(null);
  const [verificandoPagamento, setVerificandoPagamento] = useState(true);
  const [showModalPlanos, setShowModalPlanos] = useState(false);
  const [showModalUpgrade, setShowModalUpgrade] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showValidarEmail, setShowValidarEmail] = useState(false);
  const [showAlterarDados, setShowAlterarDados] = useState(false);

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
              // Aplicar configurações do usuário (cores e logo) após login
              aplicarConfiguracoesUsuario();
            }
            setAuthenticated(true);
            // Verificar pagamento
            await verificarPagamento();
          } else {
            setAuthenticated(false);
            setVerificandoPagamento(false);
          }
        } catch (error) {
          console.error('Erro ao verificar autenticação:', error);
          setAuthenticated(false);
        }
      } else {
        setAuthenticated(false);
        setVerificandoPagamento(false);
      }
      setCheckingAuth(false);
    };
    
    checkAuth();
    
    // Listener para atualizar quando plataformas mudarem
    const handlePlataformasUpdate = () => {
      const user = getUser();
      if (user?.id) {
        setTotalPlataformas(carregarPlataformasSync(user.id).length);
      }
    };
    
    window.addEventListener('plataformas-updated', handlePlataformasUpdate);
    
    // Carregar plataformas iniciais do localStorage (síncrono)
    const user = getUser();
    if (user?.id) {
      setTotalPlataformas(carregarPlataformasSync(user.id).length);
    }
    
    return () => {
      window.removeEventListener('plataformas-updated', handlePlataformasUpdate);
    };
  }, []);

  // Listener para quando email for validado
  useEffect(() => {
    const handleEmailValidado = async () => {
      // Aguardar um pouco para garantir que o backend atualizou
      setTimeout(async () => {
        const dadosVazios = await verificarDadosVazios();
        if (dadosVazios) {
          setShowAlterarDados(true);
        }
      }, 1000);
    };
    
    window.addEventListener('email-validado', handleEmailValidado);
    
    return () => {
      window.removeEventListener('email-validado', handleEmailValidado);
    };
  }, []);

  // Sistema de heartbeat para rastrear tempo de uso
  useEffect(() => {
    if (!authenticated) return;

    const API_BASE = import.meta.env.VITE_API_BASE || window.location.origin;
    const token = getToken();

    // Registrar atividade a cada 30 segundos
    const heartbeatInterval = setInterval(async () => {
      if (token) {
        try {
          await fetch(`${API_BASE}/api/auth/activity`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
        } catch (error) {
          // Ignorar erros silenciosamente
        }
      }
    }, 30000); // 30 segundos

    // Registrar atividade imediatamente ao montar
    if (token) {
      fetch(`${API_BASE}/api/auth/activity`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }).catch(() => {
        // Ignorar erros
      });
    }

    return () => {
      clearInterval(heartbeatInterval);
    };
  }, [authenticated]);

  // Detectar token de recuperação de senha na URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const validationToken = urlParams.get('token');
    const path = window.location.pathname;
    
    // Verificar se é rota de validação de email
    if (path.includes('/validar-email') && validationToken) {
      // Não fazer nada aqui, a página ValidarEmail vai lidar com isso
      return;
    }
    
    if (token) {
      // Se houver token na URL, abrir modal de reset de senha
      setResetToken(token);
      setShowResetarSenha(true);
      // Limpar a URL para não mostrar o token na barra de endereços
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  // Função para verificar se os dados do usuário estão vazios
  const verificarDadosVazios = async (): Promise<boolean> => {
    try {
      console.log('verificarDadosVazios - Iniciando verificação...');
      const response = await apiService.obterDadosUsuario();
      console.log('verificarDadosVazios - Response completa:', response);
      
      // O backend retorna { user: { ... } }, então precisamos acessar response.user
      const dados = response?.user || response;
      console.log('verificarDadosVazios - Dados do usuário:', dados);
      
      if (!dados || !dados.email_validado) {
        console.log('verificarDadosVazios - Email não validado ou dados não encontrados. email_validado:', dados?.email_validado);
        return false; // Se email não está validado, não precisa verificar
      }
      
      console.log('verificarDadosVazios - Email validado, verificando campos...');
      
      // Verificar se os campos obrigatórios estão vazios
      const camposVazios = 
        !dados.nome?.trim() ||
        !dados.sobrenome?.trim() ||
        !dados.telefone?.trim() ||
        (!dados.nao_possui_cpf && !dados.cpf?.trim()) ||
        !dados.data_nascimento ||
        !dados.genero ||
        !dados.nome_estabelecimento?.trim() ||
        (!dados.nao_resido_brasil_comercial && (
          !dados.cep_comercial?.trim() ||
          !dados.endereco_comercial?.trim() ||
          !dados.numero_comercial?.trim() ||
          !dados.cidade_comercial?.trim() ||
          !dados.estado_comercial?.trim()
        )) ||
        (!dados.nao_resido_brasil_residencial && !dados.mesmo_endereco && (
          !dados.cep_residencial?.trim() ||
          !dados.endereco_residencial?.trim() ||
          !dados.numero_residencial?.trim() ||
          !dados.cidade_residencial?.trim() ||
          !dados.estado_residencial?.trim()
        ));
      
      console.log('verificarDadosVazios - Campos vazios?', camposVazios);
      console.log('verificarDadosVazios - Detalhes:', {
        nome: dados.nome?.trim() || 'VAZIO',
        sobrenome: dados.sobrenome?.trim() || 'VAZIO',
        telefone: dados.telefone?.trim() || 'VAZIO',
        cpf: dados.cpf?.trim() || 'VAZIO',
        data_nascimento: dados.data_nascimento || 'VAZIO',
        genero: dados.genero || 'VAZIO',
        nome_estabelecimento: dados.nome_estabelecimento?.trim() || 'VAZIO'
      });
      return camposVazios;
    } catch (error) {
      console.error('Erro ao verificar dados vazios:', error);
      return false;
    }
  };

  const verificarPagamento = async () => {
    try {
      const user = getUser();
      // Admins sempre têm acesso completo
      if (user?.is_admin) {
        setTemAcesso(true);
        carregarItens();
        // Carregar plataformas após autenticação
        if (user?.id) {
          carregarPlataformas(user.id).then(() => {
            setTotalPlataformas(carregarPlataformasSync(user.id).length);
          }).catch(() => {});
        }
        // Verificar status do tutorial via API
        if (user?.id) {
          isTutorialCompleted(user.id).then(completed => {
            if (!completed) {
              setShowTutorial(true);
            }
          }).catch(() => {
            // Em caso de erro, usar versão síncrona (localStorage)
            if (!isTutorialCompletedSync(user.id)) {
              setShowTutorial(true);
            }
          });
        }
        setVerificandoPagamento(false);
        
        // Verificar se precisa abrir modal de dados após login (apenas para admins)
        setTimeout(async () => {
          console.log('App - Verificando dados vazios para admin...');
          const dadosVazios = await verificarDadosVazios();
          console.log('App - Dados vazios (admin)?', dadosVazios);
          if (dadosVazios) {
            console.log('App - Abrindo modal de alterar dados (admin)');
            setShowAlterarDados(true);
          }
        }, 1000);
        return;
      }

      const status = await apiService.verificarStatusPagamento();
      setTemAcesso(status.temAcesso);
      
      // Verificar se precisa validar email
      if (status.emailNaoValidado) {
        setShowValidarEmail(true);
      } else {
        // Se email está validado, verificar se dados estão vazios
        const dadosVazios = await verificarDadosVazios();
        if (dadosVazios) {
          setShowAlterarDados(true);
        }
      }
      // Sempre carregar itens, mesmo sem acesso pago (modo trial)
      await carregarItens();
      // Carregar plataformas após autenticação
      if (user?.id) {
        carregarPlataformas(user.id).then(() => {
          setTotalPlataformas(carregarPlataformasSync(user.id).length);
        }).catch(() => {});
      }
      // Mostrar tutorial na primeira entrada de qualquer usuário novo
      // Aguardar um pouco para garantir que a página está carregada
      if (user?.id) {
        setTimeout(async () => {
          try {
            const completed = await isTutorialCompleted(user.id);
            if (!completed) {
              setShowTutorial(true);
            }
          } catch {
            // Em caso de erro, usar versão síncrona (localStorage)
            if (!isTutorialCompletedSync(user.id)) {
              setShowTutorial(true);
            }
          }
        }, 500);
      }
    } catch (error: any) {
      const user = getUser();
      // Se for admin, sempre tem acesso
      if (user?.is_admin) {
        setTemAcesso(true);
        carregarItens();
      } else {
        // Se for erro de email não validado, mostrar modal
        if (error.response?.status === 403 && error.response?.data?.codigo === 'EMAIL_NAO_VALIDADO') {
          setTemAcesso(false);
          setShowValidarEmail(true);
          // Ainda assim, carregar itens para modo trial
          carregarItens();
        } else if (error.response?.status === 403 && error.response?.data?.codigo === 'PAGAMENTO_REQUERIDO') {
          // Se for erro de pagamento requerido, não tem acesso mas pode usar o sistema
          setTemAcesso(false);
          // Ainda assim, carregar itens para modo trial
          carregarItens();
        } else {
          console.error('Erro ao verificar pagamento:', error);
          setTemAcesso(false);
          // Ainda assim, carregar itens para modo trial
          carregarItens();
        }
        // Mostrar tutorial na primeira entrada de qualquer usuário novo, mesmo sem acesso pago
        // Aguardar um pouco para garantir que a página está carregada
        if (user?.id) {
          setTimeout(async () => {
            try {
              const completed = await isTutorialCompleted(user.id);
              if (!completed) {
                setShowTutorial(true);
              }
            } catch {
              // Em caso de erro, usar versão síncrona (localStorage)
              if (!isTutorialCompletedSync(user.id)) {
                setShowTutorial(true);
              }
            }
          }, 500);
        }
      }
    } finally {
      setVerificandoPagamento(false);
    }
  };

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
    } catch (error: any) {
      console.error('Erro ao carregar itens:', error);
      // Se for erro de pagamento requerido, permitir modo trial com itens vazios
      if (error.response?.status === 403 && error.response?.data?.codigo === 'PAGAMENTO_REQUERIDO') {
        // Modo trial - permitir usar o sistema mesmo sem itens carregados
        setItensPorCategoria({});
        setItensSelecionados(new Set());
      } else {
        // Outros erros - mostrar mensagem
        await mostrarAlert('Erro', 'Erro ao carregar itens. Você pode usar o sistema em modo trial.');
        setItensPorCategoria({});
        setItensSelecionados(new Set());
      }
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
        // Usar valorNovo como base se existir, caso contrário usar valor
        const valorBase = item.valorNovo !== null && item.valorNovo !== undefined ? item.valorNovo : item.valor;
        let novoValor: number;
        
        if (tipoReajuste === 'fixo') {
          novoValor = valorBase + valor;
        } else {
          novoValor = valorBase * (1 + valor / 100);
        }

        // Salvar backup do valor atual (valorNovo ou valor) antes de aplicar
        await apiService.salvarBackupValor(item.id, valorBase);
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

      if (!response.ok) {
        let errorMessage = 'Erro ao reiniciar sistema';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Erro ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      await response.json();

      await mostrarAlert('Sucesso', 'Sistema reiniciado com sucesso! Todos os dados foram apagados.');
      await carregarItens();
    } catch (error: any) {
      console.error('Erro ao reiniciar sistema:', error);
      await mostrarAlert('Erro', error.message || 'Erro ao reiniciar sistema. Tente novamente.');
    }
  };

  const handleReexibirTutorial = async () => {
    // Limpar flag de tutorial completo para o usuário atual
    const user = getUser();
    if (user?.id) {
      try {
        await apiService.resetarTutorial();
        limparCacheTutorial(user.id);
        // Também limpar localStorage como backup
        localStorage.removeItem(`calculadora_tutorial_completed_${user.id}`);
        localStorage.removeItem(`calculadora_tutorial_step_${user.id}`);
      } catch (error) {
        console.error('Erro ao resetar tutorial, usando localStorage:', error);
        // Fallback para localStorage
        localStorage.removeItem(`calculadora_tutorial_completed_${user.id}`);
        localStorage.removeItem(`calculadora_tutorial_step_${user.id}`);
        limparCacheTutorial(user.id);
      }
    }
    // Também limpar a chave antiga para compatibilidade
    localStorage.removeItem('calculadora_tutorial_completed');
    localStorage.removeItem('calculadora_tutorial_step');
    setShowTutorial(true);
  };

  if (checkingAuth || verificandoPagamento) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando...</p>
      </div>
    );
  }

  if (!authenticated) {
    if (showLogin) {
      return <Login onLoginSuccess={async () => {
        console.log('App - onLoginSuccess chamado');
        setAuthenticated(true);
        // Aplicar configurações do usuário (cores e logo) após login
        aplicarConfiguracoesUsuario();
        await verificarPagamento();
        setShowLogin(false);
        
        // Verificar se precisa abrir modal de dados após login
        // Aguardar um pouco mais para garantir que tudo foi carregado
        setTimeout(async () => {
          console.log('App - Verificando dados vazios após login...');
          const dadosVazios = await verificarDadosVazios();
          console.log('App - Dados vazios?', dadosVazios);
          if (dadosVazios) {
            console.log('App - Abrindo modal de alterar dados');
            setShowAlterarDados(true);
          }
        }, 1000);
      }} />;
    }
    return <LandingPage onLoginClick={() => setShowLogin(true)} />;
  }

  // Não bloquear acesso - permitir modo trial
  // Usuários sem acesso pago podem usar o sistema, mas não ver preços das plataformas


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
            temAcesso={temAcesso === true}
            onAbrirModalPlanos={() => setShowModalPlanos(true)}
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
            onOpenModalPlanos={() => setShowModalPlanos(true)}
            onOpenModalUpgrade={() => setShowModalUpgrade(true)}
          />

              <ItensSection
                itensPorCategoria={itensPorCategoria}
                itensSelecionados={itensSelecionados}
                categoriasColapsadas={categoriasColapsadas}
                onToggleItem={toggleItemSelecionado}
                onToggleCategoria={toggleCategoria}
                onToggleCategoriaSelecionada={toggleCategoriaSelecionada}
                onItemUpdated={carregarItens}
                temAcesso={temAcesso === true}
                onAbrirModalPlanos={() => setShowModalPlanos(true)}
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
        scrollToColors={showTutorial && showPainelAdmin}
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
        temAcesso={temAcesso === true}
        onAbrirModalPlanos={() => setShowModalPlanos(true)}
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
        onOpenPainelAdmin={() => setShowPainelAdmin(true)}
        modalAberto={
          showAdicionarCategoriaModal ? 'categoria' :
          showEditarItemModal ? 'item' :
          showPlataformas ? 'plataformas' :
          showPainelAdmin ? 'personalizacao' : null
        }
      />

      {resetToken && (
        <ResetarSenhaModal
          isOpen={showResetarSenha}
          onClose={() => {
            setShowResetarSenha(false);
            setResetToken(null);
          }}
          token={resetToken}
          onSuccess={() => {
            setShowResetarSenha(false);
            setResetToken(null);
            setAuthenticated(false);
            setCheckingAuth(false);
            setVerificandoPagamento(false);
            // Mostrar tela de login após reset bem-sucedido
            setShowLogin(true);
          }}
        />
      )}

      <Modal
        isOpen={showModalPlanos}
        onClose={() => setShowModalPlanos(false)}
        title="Liberar Acesso Completo"
        size="large"
        footer={
          <button onClick={() => setShowModalPlanos(false)} className="btn-secondary">
            Fechar
          </button>
        }
      >
        <SelecaoPlanos onPagamentoSucesso={async () => {
          await verificarPagamento();
          setShowModalPlanos(false);
        }} />
      </Modal>

      <ModalUpgrade
        isOpen={showModalUpgrade}
        onClose={() => setShowModalUpgrade(false)}
      />
      <ValidarEmailModal
        isOpen={showValidarEmail}
        onClose={() => setShowValidarEmail(false)}
        onValidado={async () => {
          setShowValidarEmail(false);
          await verificarPagamento();
          
          // Verificar se precisa abrir modal de dados após validação
          setTimeout(async () => {
            const dadosVazios = await verificarDadosVazios();
            if (dadosVazios) {
              setShowAlterarDados(true);
            }
          }, 500);
        }}
      />
      <AlterarDadosModal
        isOpen={showAlterarDados}
        onClose={() => setShowAlterarDados(false)}
      />
    </div>
  );
}

export default App;
