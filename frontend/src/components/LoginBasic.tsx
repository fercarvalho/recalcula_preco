import { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { mostrarAlert } from '../utils/modals';
import './Login.css';

interface LoginBasicProps {
  onLoginSuccess: () => void;
}

const SENHA_PADRAO = 'demo123'; // Senha padrão para demo

const LoginBasic = ({ onLoginSuccess }: LoginBasicProps) => {
  const [username, setUsername] = useState('');
  const [senha, setSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !senha.trim()) {
      await mostrarAlert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    
    // Simular delay de autenticação
    setTimeout(() => {
      if (senha === SENHA_PADRAO) {
        sessionStorage.setItem('demo_authenticated', 'true');
        mostrarAlert('Sucesso', 'Login realizado com sucesso!').then(() => {
          onLoginSuccess();
        });
      } else {
        mostrarAlert('Erro', 'Senha incorreta. Tente novamente.');
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <img src="/logo_nova.png" alt="Logo" className="login-logo" />
          <h1>Calculadora de Reajuste</h1>
          <p>Versão Demo</p>
        </div>
        
        <div className="demo-aviso" style={{
          background: 'var(--cor-alerta-fundo)',
          border: '1px solid var(--cor-alerta-borda)',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '20px',
          color: 'var(--cor-alerta-texto)',
          fontSize: '14px',
        }}>
          <strong>⚠️ Versão Demo</strong>
          <p style={{ margin: '8px 0 0 0' }}>
            <strong>Usuário:</strong> Qualquer valor | <strong>Senha:</strong> <code style={{ 
              background: 'var(--cor-hover)', 
              padding: '2px 6px', 
              borderRadius: '4px',
              color: 'var(--cor-alerta-texto)',
              fontWeight: 'bold',
            }}>{SENHA_PADRAO}</code>
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.9 }}>
            Todos os dados serão perdidos ao fechar o navegador.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Usuário ou Email:</label>
            <input
              id="username"
              type="text"
              className="form-input form-input-dark"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Digite seu usuário ou email"
              autoFocus
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="senha">Senha:</label>
            <div className="password-input-wrapper">
              <input
                id="senha"
                type={showSenha ? 'text' : 'password'}
                className="form-input form-input-dark"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite a senha padrão"
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowSenha(!showSenha)}
                disabled={loading}
                tabIndex={-1}
              >
                {showSenha ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          
          <button 
            type="submit" 
            className="btn-login"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginBasic;

