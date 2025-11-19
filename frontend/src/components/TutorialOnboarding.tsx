import { useState, useEffect, useRef, useCallback } from 'react';
import { FaCheck, FaTimes, FaArrowRight, FaArrowLeft, FaFolderPlus, FaPlusCircle, FaStore } from 'react-icons/fa';
import './TutorialOnboarding.css';

const TUTORIAL_COMPLETED_KEY = 'calculadora_tutorial_completed';
const TUTORIAL_STEP_KEY = 'calculadora_tutorial_step';

export const isTutorialCompleted = (): boolean => {
  return localStorage.getItem(TUTORIAL_COMPLETED_KEY) === 'true';
};

export const markTutorialCompleted = () => {
  localStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
  localStorage.removeItem(TUTORIAL_STEP_KEY);
};

export const getTutorialStep = (): number => {
  const step = localStorage.getItem(TUTORIAL_STEP_KEY);
  return step ? parseInt(step, 10) : 0;
};

export const setTutorialStep = (step: number) => {
  localStorage.setItem(TUTORIAL_STEP_KEY, step.toString());
};

interface TutorialOnboardingProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
  categorias: string[];
  totalItens: number;
  totalPlataformas: number;
  onHighlightElement?: (selector: string | null) => void;
}

type TutorialStep = {
  id: number;
  title: string;
  description: string;
  targetSelector: string;
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
      description: 'Primeiro, vamos criar as categorias dos seus produtos. Clique no botão "Adicionar Categoria" para começar. Você pode adicionar um ícone para cada categoria para facilitar a identificação.',
      targetSelector: 'button-with-folder-plus',
      position: 'bottom',
      requirements: { categorias: 1 },
    },
    {
      id: 2,
      title: 'Etapa 2: Adicionar Itens',
      description: 'Agora que você tem categorias, vamos adicionar os itens (produtos) em cada categoria. Clique no botão "Adicionar Novo Produto" para adicionar seus produtos com seus respectivos valores.',
      targetSelector: 'button-with-plus-circle',
      position: 'bottom',
      requirements: { itens: 1 },
    },
    {
      id: 3,
      title: 'Etapa 3: Configurar Plataformas',
      description: 'Por fim, vamos configurar as plataformas de delivery (como iFood, Uber Eats, etc.) com suas respectivas taxas. Clique no botão "Gerenciar Plataformas" para adicionar as plataformas e seus percentuais ou valores cobrados.',
      targetSelector: 'button-with-store',
      position: 'bottom',
      requirements: { plataformas: 1 },
    },
  {
    id: 4,
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
}: TutorialOnboardingProps) => {
  const [currentStep, setCurrentStep] = useState(getTutorialStep());
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
          setHighlightedElement(element);
          const rect = element.getBoundingClientRect();
          setSpotlightPosition({
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            height: rect.height,
          });
          if (onHighlightElement) {
            onHighlightElement(step.targetSelector);
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


  const handleComplete = useCallback(() => {
    markTutorialCompleted();
    setCurrentStep(0);
    setTutorialStep(0);
    onComplete();
  }, [onComplete]);

  const handleNext = useCallback(() => {
    if (currentStep < tutorialSteps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setTutorialStep(nextStep);
    } else {
      handleComplete();
    }
  }, [currentStep, handleComplete]);

  // Auto-avançar quando requisitos forem atendidos
  useEffect(() => {
    if (!isOpen) return;
    if (currentStep === 0 || currentStep === tutorialSteps.length - 1) return;

    const currentStepData = tutorialSteps[currentStep];
    const checkRequirements = () => {
      const req = currentStepData.requirements;
      let canProceed = true;

      if (req.categorias !== undefined && categorias.length < req.categorias) {
        canProceed = false;
      }
      if (req.itens !== undefined && totalItens < req.itens) {
        canProceed = false;
      }
      if (req.plataformas !== undefined && totalPlataformas < req.plataformas) {
        canProceed = false;
      }

      return canProceed;
    };

    const interval = setInterval(() => {
      if (checkRequirements()) {
        handleNext();
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isOpen, currentStep, categorias.length, totalItens, totalPlataformas, handleNext]);

  const handlePrevious = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      setTutorialStep(prevStep);
    }
  };

  const handleComplete = useCallback(() => {
    markTutorialCompleted();
    setCurrentStep(0);
    setTutorialStep(0);
    onComplete();
  }, [onComplete]);

  const handleSkip = () => {
    markTutorialCompleted();
    setCurrentStep(0);
    setTutorialStep(0);
    onSkip();
  };

  if (!isOpen) return null;

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tutorialSteps.length - 1;
  const hasTarget = step.targetSelector !== null;

  // Verificar requisitos
  const req = step.requirements;
  const requirementsMet =
    (req.categorias === undefined || categorias.length >= req.categorias) &&
    (req.itens === undefined || totalItens >= req.itens) &&
    (req.plataformas === undefined || totalPlataformas >= req.plataformas);

  return (
    <div className="tutorial-overlay" ref={overlayRef}>
      {hasTarget && highlightedElement && (
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
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
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
          <p>{step.description}</p>
          {!isFirstStep && !isLastStep && (
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
                disabled={!isFirstStep && !requirementsMet}
              >
                Próximo <FaArrowRight />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialOnboarding;

