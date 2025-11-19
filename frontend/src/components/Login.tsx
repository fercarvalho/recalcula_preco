import { useState } from 'react';
import { FaEye, FaEyeSlash, FaUserPlus } from 'react-icons/fa';
import { saveAuth } from '../services/auth';
import { mostrarAlert } from '../utils/modals';
import RegistroModal from './RegistroModal';
import EsqueciSenhaModal from './EsqueciSenhaModal';
import './Login.css';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login = ({ onLoginSuccess }: LoginProps) => {
  const [username, setUsername] = useState('');
  const [senha, setSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRegistro, setShowRegistro] = useState(false);
  const [showEsqueciSenha, setShowEsqueciSenha] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !senha.trim()) {
      await mostrarAlert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || window.location.origin;
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, senha }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer login');
      }

      saveAuth(data.token, data.user);
      await mostrarAlert('Sucesso', `Bem-vindo, ${data.user.username}!`);
      onLoginSuccess();
    } catch (error: any) {
      console.error('Erro no login:', error);
      await mostrarAlert('Erro', error.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <img src="/logo.png" alt="Logo" className="login-logo" />
          <h1>Calculadora de Reajuste</h1>
          <p>Faça login para continuar</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Usuário ou Email:</label>
            <input
              id="username"
              type="text"
              className="form-input"
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
                className="form-input"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite sua senha"
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
        <div className="login-links">
          <button
            type="button"
            className="btn-link"
            onClick={() => setShowEsqueciSenha(true)}
            disabled={loading}
          >
            Esqueci minha senha
          </button>
        </div>
        <div className="login-footer">
          <button
            type="button"
            className="btn-criar-conta"
            onClick={() => setShowRegistro(true)}
            disabled={loading}
          >
            <FaUserPlus /> Criar Nova Conta
          </button>
        </div>
      </div>
      <RegistroModal
        isOpen={showRegistro}
        onClose={() => setShowRegistro(false)}
        onRegisterSuccess={onLoginSuccess}
      />
      <EsqueciSenhaModal
        isOpen={showEsqueciSenha}
        onClose={() => setShowEsqueciSenha(false)}
      />
    </div>
  );
};

export default Login;

