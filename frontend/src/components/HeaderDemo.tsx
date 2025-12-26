import { useEffect, useState } from 'react';
import ThemeToggle from './ThemeToggle';
import { sessionStorageService } from '../services/sessionStorage';
import './Header.css';

interface HeaderDemoProps {
  onReiniciarSistema: () => void;
  onReexibirTutorial: () => void;
  onOpenAdminPanel?: () => void;
}

const HeaderDemo = ({ onReiniciarSistema, onReexibirTutorial, onOpenAdminPanel }: HeaderDemoProps) => {
  const handleLogout = () => {
    sessionStorage.clear();
    window.location.reload();
  };

  const [logoSrc, setLogoSrc] = useState('/logo_nova.png');

  useEffect(() => {
    // Verificar se há logo customizada no sessionStorage
    const config = sessionStorageService.obterConfiguracoes();
    if (config.logoUrl) {
      setLogoSrc(config.logoUrl);
    } else {
      setLogoSrc('/logo_nova.png');
    }
  }, []);

  // Ouvir atualizações de configuração
  useEffect(() => {
    const handleConfigUpdate = () => {
      const config = sessionStorageService.obterConfiguracoes();
      if (config.logoUrl) {
        setLogoSrc(config.logoUrl);
      } else {
        setLogoSrc('/logo_nova.png');
      }
    };
    
    window.addEventListener('config-updated', handleConfigUpdate);
    
    return () => {
      window.removeEventListener('config-updated', handleConfigUpdate);
    };
  }, []);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.currentTarget;
    if (!img.src.includes('logo_nova.png')) {
      img.src = '/logo_nova.png';
    } else {
      img.src = '/logo.png';
    }
  };

  return (
    <header>
      <div className="logo-container">
        <img 
          src={logoSrc} 
          alt="Logo" 
          className="logo" 
          onError={handleImageError}
        />
      </div>
      <div className="header-content">
        <div>
          <h1>Recalcula Preço de Preços</h1>
          <p>Selecione os itens e defina o tipo de reajuste</p>
        </div>
        <div className="header-user">
          <div className="header-actions">
            <ThemeToggle variant="header" />
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {onOpenAdminPanel && (
                <button
                  onClick={onOpenAdminPanel}
                  className="btn-secondary"
                  style={{ padding: '8px 16px' }}
                >
                  Personalizar
                </button>
              )}
              <button
                onClick={handleLogout}
                className="btn-secondary"
                style={{ padding: '8px 16px' }}
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderDemo;

