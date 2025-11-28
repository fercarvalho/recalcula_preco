import { useState, useRef, useEffect } from 'react';
import { getUser } from '../services/auth';
import { FaUser, FaSignOutAlt, FaKey, FaUserEdit, FaRedo, FaGraduationCap, FaShieldAlt, FaEnvelope, FaCreditCard } from 'react-icons/fa';
import AlterarLoginModal from './AlterarLoginModal';
import AlterarSenhaModal from './AlterarSenhaModal';
import AlterarEmailModal from './AlterarEmailModal';
import { mostrarConfirm, mostrarAlert } from '../utils/modals';
import { apiService } from '../services/api';
import './MenuUsuario.css';

interface MenuUsuarioProps {
  onLogout: () => void;
  onReiniciarSistema: () => void;
  onReexibirTutorial: () => void;
  onOpenAdminPanel?: () => void;
  isAdmin?: boolean;
}

const MenuUsuario = ({ onLogout, onReiniciarSistema, onReexibirTutorial, onOpenAdminPanel, isAdmin }: MenuUsuarioProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showAlterarLogin, setShowAlterarLogin] = useState(false);
  const [showAlterarSenha, setShowAlterarSenha] = useState(false);
  const [showAlterarEmail, setShowAlterarEmail] = useState(false);
  const [user, setUser] = useState(getUser());
  const [statusPagamento, setStatusPagamento] = useState<{
    temAcesso: boolean;
    tipo: 'anual' | 'unico' | null;
    assinatura: {
      status: string;
      plano_tipo: string;
      current_period_end: string | null;
      cancel_at_period_end: boolean;
    } | null;
  } | null>(null);
  const [carregandoCancelar, setCarregandoCancelar] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Atualizar usuário quando o componente montar ou quando o login/email for alterado
  useEffect(() => {
    setUser(getUser());
  }, [showAlterarLogin, showAlterarEmail]);

  // Verificar status de pagamento ao montar o componente
  useEffect(() => {
    const verificarStatus = async () => {
      try {
        const status = await apiService.verificarStatusPagamento();
        setStatusPagamento(status);
      } catch (error) {
        console.error('Erro ao verificar status de pagamento:', error);
      }
    };
    verificarStatus();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleReiniciarSistema = async () => {
    const confirmado = await mostrarConfirm(
      'Reiniciar Sistema',
      'Tem certeza que deseja reiniciar o sistema? TODOS os seus dados (itens, categorias, etc.) serão PERMANENTEMENTE deletados e não poderão ser recuperados. Esta ação não pode ser desfeita!'
    );

    if (confirmado) {
      const confirmado2 = await mostrarConfirm(
        'Confirmação Final',
        'Esta é sua última chance. Tem certeza ABSOLUTA que deseja apagar TODOS os seus dados?'
      );

      if (confirmado2) {
        onReiniciarSistema();
        setShowMenu(false);
      }
    }
  };

  const handleReexibirTutorial = () => {
    onReexibirTutorial();
    setShowMenu(false);
  };

  const handleCancelarPlano = async () => {
    // Verificar se é o usuário viralatas (assinatura vitalícia)
    if (user?.username === 'viralatas' || statusPagamento?.assinatura?.plano_tipo === 'vitalicio') {
      await mostrarAlert(
        '🎉 Assinatura Vitalícia',
        'Parabéns! Você possui uma assinatura vitalícia e tem acesso completo e permanente ao sistema. Não é necessário gerenciar pagamentos ou renovações - seu acesso é garantido para sempre! 🚀'
      );
      setShowMenu(false);
      return;
    }

    try {
      setCarregandoCancelar(true);
      const { url } = await apiService.criarSessaoCustomerPortal();
      window.location.href = url;
    } catch (error: any) {
      setCarregandoCancelar(false);
      await mostrarAlert(
        'Erro',
        error.response?.data?.error || 'Erro ao acessar o portal de gerenciamento. Tente novamente.'
      );
    }
  };

  if (!user) return null;

  return (
    <>
      <div className="menu-usuario-container" ref={menuRef}>
        <button
          className="btn-menu-usuario"
          onClick={() => setShowMenu(!showMenu)}
          title="Menu do usuário"
        >
          <FaUser />
          <span className="user-name">{user.username}</span>
          <span className={`menu-arrow ${showMenu ? 'open' : ''}`}>▼</span>
        </button>

        {showMenu && (
          <div className="menu-usuario-dropdown">
            <div className="menu-usuario-header">
              <FaUser className="menu-icon" />
              <div>
                <div className="menu-usuario-nome">{user.username}</div>
                <div className="menu-usuario-subtitle">Gerenciar conta</div>
              </div>
            </div>

            <div className="menu-usuario-divider"></div>

            <button
              className="menu-usuario-item"
              onClick={() => {
                setShowAlterarLogin(true);
                setShowMenu(false);
              }}
            >
              <FaUserEdit className="menu-icon" />
              <span>Alterar Login</span>
            </button>

            <button
              className="menu-usuario-item"
              onClick={() => {
                setShowAlterarEmail(true);
                setShowMenu(false);
              }}
            >
              <FaEnvelope className="menu-icon" />
              <span>Alterar Email</span>
            </button>

            <button
              className="menu-usuario-item"
              onClick={() => {
                setShowAlterarSenha(true);
                setShowMenu(false);
              }}
            >
              <FaKey className="menu-icon" />
              <span>Alterar Senha</span>
            </button>

            <div className="menu-usuario-divider"></div>

            {isAdmin && onOpenAdminPanel && (
              <>
                <button
                  className="menu-usuario-item"
                  onClick={() => {
                    onOpenAdminPanel();
                    setShowMenu(false);
                  }}
                >
                  <FaShieldAlt className="menu-icon" />
                  <span>Painel Admin</span>
                </button>
                <div className="menu-usuario-divider"></div>
              </>
            )}

            <button
              className="menu-usuario-item"
              onClick={handleReexibirTutorial}
            >
              <FaGraduationCap className="menu-icon" />
              <span>Re-exibir Tutorial</span>
            </button>

            {statusPagamento?.tipo === 'anual' && statusPagamento?.temAcesso && (
              <>
                <div className="menu-usuario-divider"></div>
                <button
                  className="menu-usuario-item"
                  onClick={handleCancelarPlano}
                  disabled={carregandoCancelar}
                >
                  <FaCreditCard className="menu-icon" />
                  <span>{carregandoCancelar ? 'Carregando...' : 'Gerenciar Assinatura'}</span>
                </button>
              </>
            )}

            <div className="menu-usuario-divider"></div>

            <button
              className="menu-usuario-item danger"
              onClick={handleReiniciarSistema}
            >
              <FaRedo className="menu-icon" />
              <span>Reiniciar Sistema</span>
            </button>

            <div className="menu-usuario-divider"></div>

            <button
              className="menu-usuario-item"
              onClick={() => {
                onLogout();
                setShowMenu(false);
              }}
            >
              <FaSignOutAlt className="menu-icon" />
              <span>Sair</span>
            </button>
          </div>
        )}
      </div>

      <AlterarLoginModal
        isOpen={showAlterarLogin}
        onClose={() => setShowAlterarLogin(false)}
      />

      <AlterarSenhaModal
        isOpen={showAlterarSenha}
        onClose={() => setShowAlterarSenha(false)}
      />

      <AlterarEmailModal
        isOpen={showAlterarEmail}
        onClose={() => setShowAlterarEmail(false)}
      />
    </>
  );
};

export default MenuUsuario;

