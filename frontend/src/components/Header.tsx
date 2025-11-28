import { useEffect, useState } from 'react';
import MenuUsuario from './MenuUsuario';
import { clearAuth, getUser } from '../services/auth';
import './Header.css';

const getConfigKey = (userId?: number | null): string => {
  if (userId) {
    return `calculadora_admin_config_${userId}`;
  }
  // Fallback para compatibilidade com versão antiga
  return 'calculadora_admin_config';
};

interface HeaderProps {
  onReiniciarSistema: () => void;
  onReexibirTutorial: () => void;
  onOpenAdminPanel?: () => void;
  isAdmin?: boolean;
}

const Header = ({ onReiniciarSistema, onReexibirTutorial, onOpenAdminPanel, isAdmin }: HeaderProps) => {
  const handleLogout = () => {
    clearAuth();
    localStorage.removeItem('admin_viewing_user_id');
    window.location.href = '/';
  };

  const handleVoltarAoMeuUsuario = () => {
    localStorage.removeItem('admin_viewing_user_id');
    window.location.reload();
  };

  const usuarioVisualizando = localStorage.getItem('admin_viewing_user_id');
  const user = getUser();
  const [logoSrc, setLogoSrc] = useState('/logo_nova.png');

  useEffect(() => {
    // Verificar se há logo customizada no localStorage (do PainelAdmin) para este usuário
    const userId = user?.id;
    const key = getConfigKey(userId);
    const configStr = localStorage.getItem(key);
    if (configStr) {
      try {
        const config = JSON.parse(configStr);
        if (config.logoUrl) {
          setLogoSrc(config.logoUrl);
          return;
        }
      } catch (e) {
        // Ignorar erro de parsing
      }
    }
    
    // Se não houver logo customizada, usar logo.png apenas para viralatas
    if (user?.username === 'viralatas') {
      setLogoSrc('/logo.png');
    } else {
      setLogoSrc('/logo_nova.png');
    }
  }, [user]);

  // Ouvir atualizações de configuração
  useEffect(() => {
    const handleConfigUpdate = (e: CustomEvent) => {
      const { config, userId: configUserId } = e.detail;
      const currentUserId = user?.id;
      
      // Só atualizar se for a configuração do usuário atual
      if (configUserId === currentUserId && config?.logoUrl) {
        setLogoSrc(config.logoUrl);
      } else if (configUserId === currentUserId && !config?.logoUrl) {
        // Se a logo foi removida, usar padrão
        if (user?.username === 'viralatas') {
          setLogoSrc('/logo.png');
        } else {
          setLogoSrc('/logo_nova.png');
        }
      }
    };
    
    window.addEventListener('config-updated', handleConfigUpdate as EventListener);
    
    return () => {
      window.removeEventListener('config-updated', handleConfigUpdate as EventListener);
    };
  }, [user]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Se a imagem não carregar, tentar usar logo_nova.png como fallback
    const img = e.currentTarget;
    console.error('Erro ao carregar logo:', img.src);
    if (!img.src.includes('logo_nova.png')) {
      img.src = '/logo_nova.png';
    } else {
      // Se logo_nova.png também falhar, tentar logo.png
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
          <h1>Calculadora de Reajuste de Preços</h1>
          <p>Selecione os itens e defina o tipo de reajuste</p>
        </div>
        <div className="header-user">
          {usuarioVisualizando && (
            <div className="admin-viewing-banner">
              <span>Visualizando dados de outro usuário</span>
              <button
                onClick={handleVoltarAoMeuUsuario}
                className="btn-voltar-usuario"
              >
                Voltar ao meu usuário
              </button>
            </div>
          )}
          <MenuUsuario
            onLogout={handleLogout}
            onReiniciarSistema={onReiniciarSistema}
            onReexibirTutorial={onReexibirTutorial}
            onOpenAdminPanel={onOpenAdminPanel}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;

