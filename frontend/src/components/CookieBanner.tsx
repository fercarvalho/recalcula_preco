import { useState, useEffect } from 'react';
import { FaCookie, FaTimes, FaCog } from 'react-icons/fa';
import Modal from './Modal';
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
  const [cookiePreferences, setCookiePreferences] = useState({
    necessary: true, // Sempre true, não pode ser desabilitado
    analytics: true, // Ativado por padrão
    marketing: true, // Ativado por padrão
  });

  useEffect(() => {
    // Verificar se o usuário já aceitou/rejeitou cookies
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (!cookieConsent) {
      // Mostrar banner apenas se não houver consentimento salvo
      setShowBanner(true);
      // Manter preferências padrão (todos ativados)
    } else {
      // Carregar preferências salvas
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
    }
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
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
    };
    setCookiePreferences(allAccepted);
    localStorage.setItem('cookieConsent', JSON.stringify(allAccepted));
    setShowBanner(false);
  };

  const handleRejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      marketing: false,
    };
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
              <h3>Política de Cookies</h3>
              <p>
                Utilizamos cookies para melhorar sua experiência, analisar o uso do site e personalizar conteúdo.
                Ao continuar navegando, você concorda com nossa{' '}
                <a href="#politica-privacidade" onClick={(e) => {
                  e.preventDefault();
                  // Scroll para política de privacidade se existir
                  const element = document.getElementById('politica-privacidade');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  }
                }}>
                  Política de Privacidade
                </a>.
              </p>
            </div>
            <div className="cookie-banner-actions">
              <button
                onClick={handleRejectAll}
                className="cookie-btn cookie-btn-secondary"
              >
                Rejeitar Todos
              </button>
              <button
                onClick={handleManageCookies}
                className="cookie-btn cookie-btn-secondary"
              >
                <FaCog /> Personalizar
              </button>
              <button
                onClick={handleAcceptAll}
                className="cookie-btn cookie-btn-primary"
              >
                Aceitar Todos
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
              Escolha quais tipos de cookies você deseja aceitar. Os cookies necessários são sempre ativados, pois são essenciais para o funcionamento do site.
            </p>

            <div className="cookie-category">
              <div className="cookie-category-header">
                <div className="cookie-category-info">
                  <h4>Cookies Necessários</h4>
                  <p>Essenciais para o funcionamento do site. Não podem ser desativados.</p>
                </div>
                <div className="cookie-toggle disabled">
                  <span>Ativado</span>
                </div>
              </div>
            </div>

            <div className="cookie-category">
              <div className="cookie-category-header">
                <div className="cookie-category-info">
                  <h4>Cookies de Análise</h4>
                  <p>Nos ajudam a entender como os visitantes interagem com o site, coletando informações de forma anônima.</p>
                </div>
                <label className="cookie-toggle">
                  <input
                    type="checkbox"
                    checked={cookiePreferences.analytics}
                    onChange={(e) =>
                      setCookiePreferences({
                        ...cookiePreferences,
                        analytics: e.target.checked,
                      })
                    }
                  />
                  <span className="cookie-toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="cookie-category">
              <div className="cookie-category-header">
                <div className="cookie-category-info">
                  <h4>Cookies de Marketing</h4>
                  <p>Usados para personalizar anúncios e medir a eficácia de campanhas publicitárias.</p>
                </div>
                <label className="cookie-toggle">
                  <input
                    type="checkbox"
                    checked={cookiePreferences.marketing}
                    onChange={(e) =>
                      setCookiePreferences({
                        ...cookiePreferences,
                        marketing: e.target.checked,
                      })
                    }
                  />
                  <span className="cookie-toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default CookieBanner;

