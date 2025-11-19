import MenuUsuario from './MenuUsuario';
import { clearAuth } from '../services/auth';
import './Header.css';

interface HeaderProps {
  onReiniciarSistema: () => void;
  onReexibirTutorial: () => void;
  onOpenAdminPanel?: () => void;
  isAdmin?: boolean;
}

const Header = ({ onReiniciarSistema, onReexibirTutorial, onOpenAdminPanel, isAdmin }: HeaderProps) => {
  const handleLogout = () => {
    clearAuth();
    window.location.href = '/';
  };

  return (
    <header>
      <div className="logo-container">
        <img src="/logo.png" alt="Vira-Latas Logo" className="logo" />
      </div>
      <div className="header-content">
        <div>
          <h1>Calculadora de Reajuste de Preços</h1>
          <p>Selecione os itens e defina o tipo de reajuste</p>
        </div>
        <div className="header-user">
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

