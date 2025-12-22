import { useState, useEffect } from 'react';
import { FaCookie, FaTimes, FaCog } from 'react-icons/fa';
import Modal from './Modal';
import ModalTermosUso from './ModalTermosUso';
import ModalPoliticaPrivacidade from './ModalPoliticaPrivacidade';
import './CookieBanner.css';

// Componente para o link de gerenciar cookies no rodapé
export const CookieManageLink = ({ onManageClick }: { onManageClick: () => void }) => {
  return (
    <button
      onClick={onManageClick}
      className="cookie-manage-link"
      title="Gerenciar Cookies"
    >
      Gerenciar Cookies
    </button>
  );
};

interface CookieBannerProps {
  showManageModalExternal?: boolean;
  onManageModalClose?: () => void;
}

const CookieBanner = ({ showManageModalExternal, onManageModalClose }: CookieBannerProps = {}) => {
  const [showBanner, setShowBanner] = useState(false);
  const [showManageModal, setShowManageModal] = useState(showManageModalExternal || false);
  const [showTermosModal, setShowTermosModal] = useState(false);
  const [showPoliticaModal, setShowPoliticaModal] = useState(false);
  const [cookiePreferences, setCookiePreferences] = useState<Record<string, boolean>>({
    necessary: true, // Sempre true, não pode ser desabilitado
  });
  const [cookieConfig, setCookieConfig] = useState({
    titulo: 'Política de Cookies',
    texto: 'Utilizamos cookies para melhorar sua experiência, analisar o uso do site e personalizar conteúdo.',
    texto_botao_aceitar: 'Aceitar Todos',
    texto_botao_rejeitar: 'Rejeitar Todos',
    texto_botao_personalizar: 'Personalizar',
    texto_descricao_gerenciamento: 'Escolha quais tipos de cookies você deseja aceitar.'
  });
  const [cookieCategorias, setCookieCategorias] = useState<Array<{chave: string, nome: string, descricao: string, obrigatorio: boolean}>>([]);

  useEffect(() => {
    // Carregar configuração do banner e categorias do backend
    const carregarConfig = async () => {
      try {
        const [configResponse, categoriasResponse] = await Promise.all([
          fetch('/api/cookie-banner-config'),
          fetch('/api/cookie-categorias')
        ]);

        if (configResponse.ok) {
          const config = await configResponse.json();
          setCookieConfig(config);
        }

        if (categoriasResponse.ok) {
          const categorias = await categoriasResponse.json();
          setCookieCategorias(categorias.filter((c: any) => c.ativo));
          
          // Inicializar preferências com todas as categorias ativas
          const preferenciasIniciais: Record<string, boolean> = {};
          categorias.forEach((cat: any) => {
            if (cat.ativo) {
              preferenciasIniciais[cat.chave] = cat.obrigatorio ? true : true; // Por padrão, todos ativados
            }
          });
          
          // Verificar se o usuário já aceitou/rejeitou cookies
          const cookieConsent = localStorage.getItem('cookieConsent');
          if (cookieConsent) {
            try {
              const savedPreferences = JSON.parse(cookieConsent);
              setCookiePreferences(savedPreferences);
            } catch (error) {
              console.error('Erro ao carregar preferências de cookies:', error);
              setCookiePreferences(preferenciasIniciais);
            }
          } else {
            setCookiePreferences(preferenciasIniciais);
            setShowBanner(true);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar configuração de cookies:', error);
        // Usar valores padrão em caso de erro
        setCookiePreferences({
          necessary: true,
          analytics: true,
          marketing: true,
        });
        setShowBanner(true);
      }
    };

    carregarConfig();
  }, []);

  useEffect(() => {
    if (showManageModalExternal !== undefined) {
      setShowManageModal(showManageModalExternal);
      // Se o modal está sendo aberto externamente, carregar preferências
      if (showManageModalExternal) {
        const cookieConsent = localStorage.getItem('cookieConsent');
        if (cookieConsent) {
          try {
            const savedPreferences = JSON.parse(cookieConsent);
            setCookiePreferences(savedPreferences);
          } catch (error) {
            console.error('Erro ao carregar preferências de cookies:', error);
            // Se houver erro, usar preferências padrão (todos ativados)
            setCookiePreferences({
              necessary: true,
              analytics: true,
              marketing: true,
            });
          }
        } else {
          // Se não houver preferências salvas, usar padrão (todos ativados)
          setCookiePreferences({
            necessary: true,
            analytics: true,
            marketing: true,
          });
        }
      }
    }
  }, [showManageModalExternal]);

  const handleAcceptAll = () => {
    const allAccepted: Record<string, boolean> = {};
    cookieCategorias.forEach(cat => {
      allAccepted[cat.chave] = true;
    });
    setCookiePreferences(allAccepted);
    localStorage.setItem('cookieConsent', JSON.stringify(allAccepted));
    setShowBanner(false);
  };

  const handleRejectAll = () => {
    const onlyNecessary: Record<string, boolean> = {};
    cookieCategorias.forEach(cat => {
      onlyNecessary[cat.chave] = cat.obrigatorio; // Apenas obrigatórios ficam ativos
    });
    setCookiePreferences(onlyNecessary);
    localStorage.setItem('cookieConsent', JSON.stringify(onlyNecessary));
    setShowBanner(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem('cookieConsent', JSON.stringify(cookiePreferences));
    setShowManageModal(false);
    setShowBanner(false);
    if (onManageModalClose) {
      onManageModalClose();
    }
  };

  const handleManageCookies = () => {
    // Carregar preferências atuais
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (cookieConsent) {
      try {
        const savedPreferences = JSON.parse(cookieConsent);
        setCookiePreferences(savedPreferences);
      } catch (error) {
        console.error('Erro ao carregar preferências de cookies:', error);
        // Se houver erro, usar preferências padrão (todos ativados)
        setCookiePreferences({
          necessary: true,
          analytics: true,
          marketing: true,
        });
      }
    } else {
      // Se não houver preferências salvas, usar padrão (todos ativados)
      setCookiePreferences({
        necessary: true,
        analytics: true,
        marketing: true,
      });
    }
    setShowManageModal(true);
  };

  const handleCloseModal = () => {
    setShowManageModal(false);
    if (onManageModalClose) {
      onManageModalClose();
    }
  };

  return (
    <>
      {showBanner && (
        <div className="cookie-banner">
          <div className="cookie-banner-content">
            <div className="cookie-banner-icon">
              <FaCookie />
            </div>
            <div className="cookie-banner-text">
              <h3>{cookieConfig.titulo}</h3>
              <p>
                {cookieConfig.texto.includes('Política de Privacidade') || cookieConfig.texto.includes('Termos de Uso') ? (
                  cookieConfig.texto.split(/(Política de Privacidade|Termos de Uso)/).map((part, index) => {
                    if (part === 'Política de Privacidade') {
                      return (
                        <a 
                          key={index}
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            setShowPoliticaModal(true);
                          }}
                        >
                          Política de Privacidade
                        </a>
                      );
                    }
                    if (part === 'Termos de Uso') {
                      return (
                        <a 
                          key={index}
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            setShowTermosModal(true);
                          }}
                        >
                          Termos de Uso
                        </a>
                      );
                    }
                    return <span key={index}>{part}</span>;
                  })
                ) : (
                  cookieConfig.texto
                )}
              </p>
            </div>
            <div className="cookie-banner-actions">
              <button
                onClick={handleRejectAll}
                className="cookie-btn cookie-btn-secondary"
              >
                {cookieConfig.texto_botao_rejeitar}
              </button>
              <button
                onClick={handleManageCookies}
                className="cookie-btn cookie-btn-secondary"
              >
                <FaCog /> {cookieConfig.texto_botao_personalizar}
              </button>
              <button
                onClick={handleAcceptAll}
                className="cookie-btn cookie-btn-primary"
              >
                {cookieConfig.texto_botao_aceitar}
              </button>
            </div>
            <button
              onClick={() => setShowBanner(false)}
              className="cookie-banner-close"
              title="Fechar"
            >
              <FaTimes />
            </button>
          </div>
        </div>
      )}

      {showManageModal && (
        <Modal
          isOpen={showManageModal}
          onClose={handleCloseModal}
          title="Gerenciar Cookies"
          size="medium"
          footer={
            <>
              <button
                onClick={handleCloseModal}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePreferences}
                className="btn-primary"
              >
                Salvar Preferências
              </button>
            </>
          }
        >
          <div className="cookie-manage-content">
            <p className="cookie-manage-description">
              {cookieConfig.texto_descricao_gerenciamento || 'Escolha quais tipos de cookies você deseja aceitar. Os cookies necessários são sempre ativados, pois são essenciais para o funcionamento do site.'}
            </p>

            {cookieCategorias.map((categoria) => (
              <div key={categoria.chave} className="cookie-category">
                <div className="cookie-category-header">
                  <div className="cookie-category-info">
                    <h4>{categoria.nome}</h4>
                    <p>{categoria.descricao}</p>
                  </div>
                  {categoria.obrigatorio ? (
                    <div className="cookie-toggle disabled">
                      <span>Ativado</span>
                    </div>
                  ) : (
                    <label className="cookie-toggle">
                      <input
                        type="checkbox"
                        checked={cookiePreferences[categoria.chave] || false}
                        onChange={(e) =>
                          setCookiePreferences({
                            ...cookiePreferences,
                            [categoria.chave]: e.target.checked,
                          })
                        }
                      />
                      <span className="cookie-toggle-slider"></span>
                    </label>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      <ModalTermosUso 
        isOpen={showTermosModal}
        onClose={() => setShowTermosModal(false)}
      />

      <ModalPoliticaPrivacidade 
        isOpen={showPoliticaModal}
        onClose={() => setShowPoliticaModal(false)}
      />
    </>
  );
};

export default CookieBanner;

