import { useState, useEffect, useRef, useCallback } from 'react';
import { FaCheck, FaTimes, FaArrowRight, FaArrowLeft, FaFolderPlus, FaPlusCircle, FaStore, FaPalette } from 'react-icons/fa';
import { getUser } from '../services/auth';
import './TutorialOnboarding.css';

const getTutorialKey = (userId?: number | null): string => {
  if (userId) {
    return `calculadora_tutorial_completed_${userId}`;
  }
  // Fallback para compatibilidade com versão antiga
  return 'calculadora_tutorial_completed';
};

const getTutorialStepKey = (userId?: number | null): string => {
  if (userId) {
    return `calculadora_tutorial_step_${userId}`;
  }
  // Fallback para compatibilidade com versão antiga
  return 'calculadora_tutorial_step';
};

// Cache em memória para evitar múltiplas chamadas à API
let tutorialCompletedCache: { [userId: number]: boolean } = {};

export const isTutorialCompleted = async (userId?: number | null): Promise<boolean> => {
  if (!userId) {
    const user = getUser();
    userId = user?.id;
  }
  
  if (!userId) {
    return false;
  }
  
  // Se há cache válido, usar
  if (tutorialCompletedCache[userId] !== undefined) {
    return tutorialCompletedCache[userId];
  }
  
  try {
    const { apiService } = await import('../services/api');
    const status = await apiService.verificarStatusTutorial();
    tutorialCompletedCache[userId] = status.completed;
    return status.completed;
  } catch (error) {
    console.error('Erro ao verificar status do tutorial, usando localStorage como fallback:', error);
    // Fallback para localStorage
    const key = getTutorialKey(userId);
    const completed = localStorage.getItem(key) === 'true';
    tutorialCompletedCache[userId] = completed;
    return completed;
  }
};

// Versão síncrona para compatibilidade (usa cache ou localStorage)
export const isTutorialCompletedSync = (userId?: number | null): boolean => {
  if (!userId) {
    const user = getUser();
    userId = user?.id;
  }
  
  if (!userId) {
    return false;
  }
  
  // Se há cache válido, usar
  if (tutorialCompletedCache[userId] !== undefined) {
    return tutorialCompletedCache[userId];
  }
  
  // Caso contrário, tentar localStorage
  const key = getTutorialKey(userId);
  return localStorage.getItem(key) === 'true';
};

export const markTutorialCompleted = async (userId?: number | null) => {
  if (!userId) {
    const user = getUser();
    userId = user?.id;
  }
  
  if (!userId) {
    return;
  }
  
  try {
    const { apiService } = await import('../services/api');
    await apiService.marcarTutorialCompleto();
    // Atualizar cache
    tutorialCompletedCache[userId] = true;
    // Também salvar no localStorage como backup
    const key = getTutorialKey(userId);
    const stepKey = getTutorialStepKey(userId);
    localStorage.setItem(key, 'true');
    localStorage.removeItem(stepKey);
  } catch (error) {
    console.error('Erro ao marcar tutorial como completo, usando localStorage como fallback:', error);
    // Fallback para localStorage
    const key = getTutorialKey(userId);
    const stepKey = getTutorialStepKey(userId);
    localStorage.setItem(key, 'true');
    localStorage.removeItem(stepKey);
    tutorialCompletedCache[userId] = true;
  }
};

// Limpar cache (útil quando tutorial é resetado)
export const limparCacheTutorial = (userId?: number | null): void => {
  if (userId) {
    delete tutorialCompletedCache[userId];
  } else {
    const user = getUser();
    if (user?.id) {
      delete tutorialCompletedCache[user.id];
    }
  }
};

export const getTutorialStep = (userId?: number | null): number => {
  const stepKey = getTutorialStepKey(userId);
  const step = localStorage.getItem(stepKey);
  return step ? parseInt(step, 10) : 0;
};

export const setTutorialStep = (step: number, userId?: number | null) => {
  const stepKey = getTutorialStepKey(userId);
  localStorage.setItem(stepKey, step.toString());
};

interface TutorialOnboardingProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
  categorias: string[];
  totalItens: number;
  totalPlataformas: number;
  onHighlightElement?: (selector: string | null) => void;
  onOpenAdicionarCategoria?: () => void;
  onOpenAdicionarItem?: () => void;
  onOpenPlataformas?: () => void;
  onOpenPainelAdmin?: () => void;
  modalAberto?: 'categoria' | 'item' | 'plataformas' | 'personalizacao' | null;
}

type TutorialStep = {
  id: number;
  title: string;
  description: string;
  targetSelector: string | null;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  requirements: {
    categorias?: number;
    itens?: number;
    plataformas?: number;
  };
};

const tutorialSteps: TutorialStep[] = [
  {
    id: 0,
    title: 'Bem-vindo ao Sistema!',
    description: 'Vamos configurar seu sistema passo a passo. Este tutorial irá guiá-lo através das configurações iniciais.',
    targetSelector: null,
    position: 'center',
    requirements: {},
  },
    {
      id: 1,
      title: 'Etapa 1: Adicionar Categorias',
      description: 'Primeiro, vamos criar as categorias dos seus produtos. Clique no botão abaixo para abrir o modal de adicionar categoria. Você pode adicionar um ícone para cada categoria para facilitar a identificação.',
      targetSelector: 'button-with-folder-plus',
      position: 'bottom',
      requirements: { categorias: 1 },
    },
    {
      id: 2,
      title: 'Etapa 2: Adicionar Itens',
      description: 'Agora que você tem categorias, vamos adicionar os itens (produtos) em cada categoria. Clique no botão abaixo para abrir o modal de adicionar produto com seus respectivos valores.',
      targetSelector: 'button-with-plus-circle',
      position: 'bottom',
      requirements: { itens: 1 },
    },
    {
      id: 3,
      title: 'Etapa 3: Configurar Plataformas',
      description: 'Agora vamos configurar as plataformas de delivery (como iFood, Uber Eats, etc.) com suas respectivas taxas. Clique no botão abaixo para abrir o gerenciamento de plataformas.',
      targetSelector: 'button-with-store',
      position: 'bottom',
      requirements: { plataformas: 1 },
    },
    {
      id: 4,
      title: 'Etapa 4: Personalizar Sistema',
      description: 'Por fim, vamos personalizar o sistema! Você pode alterar as cores do sistema e fazer upload de uma logo personalizada. Clique no botão abaixo para abrir o painel de personalização.',
      targetSelector: null,
      position: 'center',
      requirements: {},
    },
  {
    id: 5,
    title: 'Configuração Completa!',
    description: 'Parabéns! Você completou a configuração inicial do sistema. Agora você pode usar todas as funcionalidades para calcular reajustes de preços.',
    targetSelector: null,
    position: 'center',
    requirements: {},
  },
];

const TutorialOnboarding = ({
  isOpen,
  onComplete,
  onSkip,
  categorias,
  totalItens,
  totalPlataformas,
  onHighlightElement,
  onOpenAdicionarCategoria,
  onOpenAdicionarItem,
  onOpenPlataformas,
  onOpenPainelAdmin,
  modalAberto,
}: TutorialOnboardingProps) => {
  const user = getUser();
  const userId = user?.id;
  const [currentStep, setCurrentStep] = useState(getTutorialStep(userId));
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [spotlightPosition, setSpotlightPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = tutorialSteps[currentStep];

  useEffect(() => {
    if (!isOpen) return;

    const updateHighlight = () => {
      if (step.targetSelector) {
        let element: HTMLElement | null = null;
        
        // Buscar todos os botões na seção de adicionar produto
        const buttons = document.querySelectorAll('.btn-adicionar-produto, button');
        
        buttons.forEach((btn) => {
          const icon = btn.querySelector('.fa-folder-plus, .fa-plus-circle, .fa-store');
          if (icon) {
            if (currentStep === 1 && icon.classList.contains('fa-folder-plus')) {
              element = btn as HTMLElement;
            } else if (currentStep === 2 && icon.classList.contains('fa-plus-circle')) {
              element = btn as HTMLElement;
            } else if (currentStep === 3 && icon.classList.contains('fa-store')) {
              element = btn as HTMLElement;
            }
          }
        });

        if (element) {
          const htmlElement = element as HTMLElement;
          setHighlightedElement(htmlElement);
          try {
            const rect = htmlElement.getBoundingClientRect();
            setSpotlightPosition({
              top: rect.top + window.scrollY,
              left: rect.left + window.scrollX,
              width: rect.width,
              height: rect.height,
            });
            if (onHighlightElement && step.targetSelector) {
              onHighlightElement(step.targetSelector);
            }
          } catch (e) {
            // Elemento pode não estar visível ainda
            setHighlightedElement(null);
          }
        } else {
          setHighlightedElement(null);
        }
      } else {
        setHighlightedElement(null);
      }
    };

    // Aguardar um pouco para garantir que os elementos estão renderizados
    const timeout = setTimeout(updateHighlight, 100);
    updateHighlight();
    const interval = setInterval(updateHighlight, 500);
    window.addEventListener('resize', updateHighlight);
    window.addEventListener('scroll', updateHighlight);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
      window.removeEventListener('resize', updateHighlight);
      window.removeEventListener('scroll', updateHighlight);
    };
  }, [isOpen, currentStep, step.targetSelector, onHighlightElement]);


  const handleComplete = useCallback(async () => {
    await markTutorialCompleted(userId);
    setCurrentStep(0);
    setTutorialStep(0, userId);
    onComplete();
  }, [onComplete, userId]);

  const handleNext = useCallback(() => {
    if (currentStep < tutorialSteps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setTutorialStep(nextStep, userId);
    } else {
      handleComplete();
    }
  }, [currentStep, handleComplete, userId]);

  // Removido auto-avanço automático - o usuário deve avançar manualmente
  // Isso permite que o tutorial seja visualizado mesmo quando já existem dados

  const handlePrevious = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      setTutorialStep(prevStep, userId);
    }
  };

  const handleSkip = async () => {
    await markTutorialCompleted(userId);
    setCurrentStep(0);
    setTutorialStep(0, userId);
    onSkip();
  };

  if (!isOpen) return null;

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tutorialSteps.length - 1;
  const hasTarget = step.targetSelector !== null;

  // Verificar requisitos (apenas para exibição, não bloqueia avanço)
  const req = step.requirements;

  const getModalInstruction = () => {
    if (modalAberto === 'categoria') {
      return 'Preencha o nome da categoria e, se desejar, escolha um ícone. Clique em "Salvar" quando terminar.';
    }
    if (modalAberto === 'item') {
      return 'Preencha o nome do produto, valor e selecione a categoria. Clique em "Salvar" quando terminar.';
    }
    if (modalAberto === 'plataformas') {
      return 'Adicione as plataformas de delivery com suas taxas. Clique em "Salvar" quando terminar.';
    }
    if (modalAberto === 'personalizacao') {
      return 'Altere as cores do sistema (cor primária, secundária e de fundo) e, se desejar, faça upload de uma logo personalizada. Clique em "Salvar Configurações" quando terminar.';
    }
    return null;
  };

  const modalInstruction = getModalInstruction();

  // Detectar telas menores de 7 polegadas (aproximadamente 600px)
  const isSmallScreen = typeof window !== 'undefined' && (window.innerWidth <= 600 || window.innerHeight <= 600);

  return (
    <div className={`tutorial-overlay ${modalAberto ? 'modal-open' : ''}`} ref={overlayRef}>
      {!modalAberto && hasTarget && highlightedElement && (
        <div
          className="tutorial-spotlight"
          style={{
            top: `${spotlightPosition.top}px`,
            left: `${spotlightPosition.left}px`,
            width: `${spotlightPosition.width}px`,
            height: `${spotlightPosition.height}px`,
          }}
        />
      )}

      {!modalAberto && (
        <div
          className={`tutorial-tooltip tutorial-tooltip-${step.position}`}
          ref={tooltipRef}
          style={
            hasTarget && highlightedElement
              ? {
                  top: step.position === 'bottom' ? `${spotlightPosition.top + spotlightPosition.height + 20}px` : undefined,
                  left: step.position === 'bottom' ? `${spotlightPosition.left + spotlightPosition.width / 2}px` : undefined,
                  transform: step.position === 'bottom' ? 'translateX(-50%)' : undefined,
                }
              : {
                  top: isSmallScreen ? '20%' : '50%',
                  left: '50%',
                  transform: isSmallScreen ? 'translate(-50%, 0)' : 'translate(-50%, -50%)',
                }
          }
        >
        <div className="tutorial-header">
          <h3>{step.title}</h3>
          <button className="tutorial-close" onClick={handleSkip} title="Pular tutorial">
            <FaTimes />
          </button>
        </div>
        <div className="tutorial-content">
          {!modalAberto && <p>{step.description}</p>}
          {modalAberto && (
            <p>Use o modal abaixo para completar esta etapa. Quando terminar, feche o modal para continuar o tutorial.</p>
          )}
          {!isFirstStep && !isLastStep && !modalAberto && (
            <>
              <div className="tutorial-requirements">
                {req.categorias !== undefined && (
                  <div className={`requirement ${categorias.length >= req.categorias ? 'met' : ''}`}>
                    <FaCheck className={categorias.length >= req.categorias ? 'check-icon' : 'check-icon-hidden'} />
                    Adicionar {req.categorias} categoria(s) ({categorias.length}/{req.categorias})
                  </div>
                )}
                {req.itens !== undefined && (
                  <div className={`requirement ${totalItens >= req.itens ? 'met' : ''}`}>
                    <FaCheck className={totalItens >= req.itens ? 'check-icon' : 'check-icon-hidden'} />
                    Adicionar {req.itens} item(s) ({totalItens}/{req.itens})
                  </div>
                )}
                {req.plataformas !== undefined && (
                  <div className={`requirement ${totalPlataformas >= req.plataformas ? 'met' : ''}`}>
                    <FaCheck className={totalPlataformas >= req.plataformas ? 'check-icon' : 'check-icon-hidden'} />
                    Adicionar {req.plataformas} plataforma(s) ({totalPlataformas}/{req.plataformas})
                  </div>
                )}
              </div>
              <div className="tutorial-action-button">
                {currentStep === 1 && onOpenAdicionarCategoria && (
                  <button
                    className="btn-adicionar-produto"
                    onClick={onOpenAdicionarCategoria}
                  >
                    <FaFolderPlus /> Adicionar Categoria
                  </button>
                )}
                {currentStep === 2 && onOpenAdicionarItem && (
                  <button
                    className="btn-adicionar-produto"
                    onClick={onOpenAdicionarItem}
                  >
                    <FaPlusCircle /> Adicionar Novo Produto
                  </button>
                )}
                {currentStep === 3 && onOpenPlataformas && (
                  <button
                    className="btn-adicionar-produto btn-plataformas"
                    onClick={onOpenPlataformas}
                  >
                    <FaStore /> Gerenciar Plataformas
                  </button>
                )}
                {currentStep === 4 && onOpenPainelAdmin && (
                  <button
                    className="btn-adicionar-produto btn-personalizacao"
                    onClick={onOpenPainelAdmin}
                  >
                    <FaPalette /> Personalizar Sistema
                  </button>
                )}
              </div>
            </>
          )}
        </div>
        <div className="tutorial-footer">
          <div className="tutorial-progress">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`progress-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
              />
            ))}
          </div>
          <div className="tutorial-actions">
            {!isFirstStep && (
              <button className="btn-tutorial btn-tutorial-secondary" onClick={handlePrevious}>
                <FaArrowLeft /> Anterior
              </button>
            )}
            {isLastStep ? (
              <button className="btn-tutorial btn-tutorial-primary" onClick={handleComplete}>
                <FaCheck /> Finalizar
              </button>
            ) : (
              <button
                className="btn-tutorial btn-tutorial-primary"
                onClick={handleNext}
              >
                Próximo <FaArrowRight />
              </button>
            )}
          </div>
        </div>
        </div>
      )}
      {modalInstruction && (
        <div 
          className="tutorial-modal-instruction"
          onMouseEnter={(e) => {
            // Quando o mouse entrar, adicionar classe ao overlay para desabilitar pointer-events
            const overlay = e.currentTarget.closest('.tutorial-overlay');
            if (overlay) {
              overlay.classList.add('instruction-hovering');
            }
            // Adicionar classe hidden após a transição completar (600ms)
            setTimeout(() => {
              e.currentTarget.classList.add('hidden');
            }, 600);
          }}
          onMouseLeave={(e) => {
            // Quando o mouse sair, remover a classe do overlay
            const overlay = e.currentTarget.closest('.tutorial-overlay');
            if (overlay) {
              overlay.classList.remove('instruction-hovering');
            }
            // Manter a classe hidden para que não volte a aparecer
            e.currentTarget.classList.add('hidden');
          }}
        >
          <p>{modalInstruction}</p>
        </div>
      )}
    </div>
  );
};

export default TutorialOnboarding;

