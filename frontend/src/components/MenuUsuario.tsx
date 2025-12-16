import { useState, useRef, useEffect } from 'react';
import { getUser, getToken } from '../services/auth';
import { FaUser, FaSignOutAlt, FaKey, FaUserEdit, FaRedo, FaGraduationCap, FaShieldAlt, FaEnvelope, FaCreditCard, FaCheckCircle } from 'react-icons/fa';
import AlterarLoginModal from './AlterarLoginModal';
import AlterarSenhaModal from './AlterarSenhaModal';
import AlterarEmailModal from './AlterarEmailModal';
import AlterarDadosModal from './AlterarDadosModal';
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
  const [showAlterarDados, setShowAlterarDados] = useState(false);
  const [showAlterarLogin, setShowAlterarLogin] = useState(false);
  const [showAlterarSenha, setShowAlterarSenha] = useState(false);
  const [showAlterarEmail, setShowAlterarEmail] = useState(false);
  const [user, setUser] = useState(getUser());
  const [statusPagamento, setStatusPagamento] = useState<{
    temAcesso: boolean;
    tipo: 'anual' | 'unico' | 'vitalicio' | null;
    emailNaoValidado?: boolean;
    assinatura: {
      status: string;
      plano_tipo: string;
      current_period_end: string | null;
      cancel_at_period_end: boolean;
    } | null;
  } | null>(null);
  const [carregandoCancelar, setCarregandoCancelar] = useState(false);
  const [reenviandoEmail, setReenviandoEmail] = useState(false);
  const [emailNaoValidado, setEmailNaoValidado] = useState<boolean | null>(null); // null = ainda não verificado
  const menuRef = useRef<HTMLDivElement>(null);

  // Atualizar usuário quando o componente montar ou quando o login/email for alterado
  useEffect(() => {
    setUser(getUser());
  }, [showAlterarLogin, showAlterarEmail]);

  // Verificar status de pagamento e email ao montar o componente
  useEffect(() => {
    const verificarStatus = async () => {
      try {
        const status = await apiService.verificarStatusPagamento();
        setStatusPagamento(status);
      } catch (error) {
        console.error('Erro ao verificar status de pagamento:', error);
      }
      
      // Sempre verificar diretamente se o email está validado
      const verificarEmail = async () => {
        try {
          const API_BASE = import.meta.env.VITE_API_BASE || window.location.origin;
          const token = getToken();
          if (!token) {
            console.log('MenuUsuario: Token não encontrado');
            return;
          }
          
          const response = await fetch(`${API_BASE}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('MenuUsuario - Status do email do usuário:', data.user?.email_validado);
            console.log('MenuUsuario - Dados completos do usuário:', data.user);
            // Se o backend retornar email_validado, usar ele
            // email_validado === true significa que está validado (NÃO mostrar opção)
            // email_validado === false, null ou undefined significa que não está validado (mostrar opção)
            const emailValidado = data.user?.email_validado;
            console.log('MenuUsuario - emailValidado:', emailValidado, 'tipo:', typeof emailValidado);
            // A opção deve aparecer APENAS se email_validado for false, null ou undefined
            // Se email_validado for true, então email está validado (NÃO mostrar opção)
            const naoValidado = emailValidado === false || emailValidado === null || emailValidado === undefined;
            console.log('MenuUsuario - Definindo emailNaoValidado como:', naoValidado);
            setEmailNaoValidado(naoValidado);
          } else {
            console.error('MenuUsuario - Erro ao obter dados do usuário:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('MenuUsuario - Resposta de erro:', errorText);
          }
        } catch (error) {
          console.error('MenuUsuario - Erro ao verificar status do email:', error);
        }
      };
      
      verificarEmail();
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
      
      // Verificar email quando o menu é aberto
      const verificarEmail = async () => {
        try {
          const API_BASE = import.meta.env.VITE_API_BASE || window.location.origin;
          const token = getToken();
          if (!token) {
            return;
          }
          
          const response = await fetch(`${API_BASE}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            const emailValidado = data.user?.email_validado;
            console.log('MenuUsuario - Menu aberto - emailValidado:', emailValidado);
            // A opção deve aparecer APENAS se email_validado for false, null ou undefined
            // Se email_validado for true, então email está validado (NÃO mostrar opção)
            const naoValidado = emailValidado === false || emailValidado === null || emailValidado === undefined;
            console.log('MenuUsuario - Menu aberto - Definindo emailNaoValidado como:', naoValidado);
            setEmailNaoValidado(naoValidado);
          }
        } catch (error) {
          console.error('MenuUsuario - Erro ao verificar status do email:', error);
        }
      };
      
      verificarEmail();
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
        'Assinatura Vitalícia',
        'Parabéns! Você possui uma assinatura vitalícia e tem acesso completo e permanente ao sistema. Não é necessário gerenciar pagamentos ou renovações - seu acesso é garantido para sempre!'
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

  const handleValidarEmail = async () => {
    try {
      setReenviandoEmail(true);
      await apiService.reenviarEmailValidacao();
      await mostrarAlert(
        'Email Enviado',
        'Um novo email de validação foi enviado para seu endereço de email. Verifique sua caixa de entrada e clique no link para validar seu email.'
      );
      setShowMenu(false);
      // Atualizar status para remover a opção do menu
      const status = await apiService.verificarStatusPagamento();
      setStatusPagamento(status);
      setEmailNaoValidado(false); // Email foi enviado, remover a opção
    } catch (error: any) {
      await mostrarAlert(
        'Erro',
        error.response?.data?.error || 'Erro ao reenviar email de validação. Tente novamente.'
      );
    } finally {
      setReenviandoEmail(false);
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
                setShowAlterarDados(true);
                setShowMenu(false);
              }}
            >
              <FaUserEdit className="menu-icon" />
              <span>Alterar Dados</span>
            </button>

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

            
            {/* Mostrar APENAS se emailNaoValidado for true (email não validado) */}
            {/* Não mostrar se emailNaoValidado for false (email validado) ou null (ainda não verificado) */}
            {emailNaoValidado === true && (
              <>
                <div className="menu-usuario-divider"></div>
                <button
                  className="menu-usuario-item"
                  onClick={handleValidarEmail}
                  disabled={reenviandoEmail}
                >
                  <FaCheckCircle className="menu-icon" />
                  <span>{reenviandoEmail ? 'Enviando...' : 'Validar Email'}</span>
                </button>
              </>
            )}

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

      <AlterarDadosModal
        isOpen={showAlterarDados}
        onClose={() => setShowAlterarDados(false)}
      />
    </>
  );
};

export default MenuUsuario;

