import { useEffect, useState, useRef } from 'react';
import { apiService } from '../services/api';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import './ValidarEmail.css';

const ValidarEmail = () => {
  const [searchParams] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params;
  });
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [mensagem, setMensagem] = useState('');
  const isValidatingRef = useRef(false); // Usar useRef para persistir entre renderizações
  const hasValidatedRef = useRef(false); // Rastrear se já validou com sucesso

  useEffect(() => {
    // Evitar requisições duplicadas (React StrictMode executa useEffect duas vezes em dev)
    if (isValidatingRef.current || hasValidatedRef.current) {
      console.log('⚠️  Validação já em andamento ou já concluída, ignorando requisição duplicada');
      return;
    }
    
    const validar = async () => {
      const token = searchParams.get('token');
      
      console.log('Token da URL:', token ? `${token.substring(0, 10)}...` : 'null');
      
      if (!token) {
        setStatus('error');
        setMensagem('Token não fornecido');
        return;
      }

      isValidatingRef.current = true;
      
      try {
        console.log('Enviando requisição para validar email...');
        await apiService.validarEmail(token);
        hasValidatedRef.current = true; // Marcar como validado com sucesso
        setStatus('success');
        setMensagem('Email validado com sucesso! Você já pode usar o sistema normalmente.');
        
        // Disparar evento para abrir modal de dados se necessário
        window.dispatchEvent(new CustomEvent('email-validado'));
        
        // Redirecionar para a página principal após 3 segundos
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      } catch (error: any) {
        console.error('Erro ao validar email:', error);
        console.error('Resposta do servidor:', error.response?.data);
        
        // Verificar se o erro é porque o token já foi usado (email já validado)
        if (error.response?.data?.tokenNaoEncontrado) {
          // Verificar se o email já está validado fazendo uma requisição ao backend
          try {
            const API_BASE = import.meta.env.VITE_API_BASE || window.location.origin;
            const tokenAuth = localStorage.getItem('calculadora_auth_token');
            if (tokenAuth) {
              const response = await fetch(`${API_BASE}/api/auth/me`, {
                headers: {
                  'Authorization': `Bearer ${tokenAuth}`,
                },
              });
              
              if (response.ok) {
                const data = await response.json();
                if (data.user?.email_validado) {
                  // Email já está validado, mostrar mensagem de sucesso
                  hasValidatedRef.current = true; // Marcar como validado
                  setStatus('success');
                  setMensagem('Seu email já foi validado anteriormente! Você já pode usar o sistema normalmente.');
                  window.dispatchEvent(new CustomEvent('email-validado'));
                  setTimeout(() => {
                    window.location.href = '/';
                  }, 3000);
                  return;
                }
              }
            }
          } catch (checkError) {
            console.error('Erro ao verificar status do email:', checkError);
          }
        }
        
        setStatus('error');
        
        // Melhorar mensagem de erro
        let mensagemErro = error.response?.data?.error || 'Erro ao validar email. Token inválido ou expirado.';
        
        // Se o token não foi encontrado, adicionar instruções mais claras
        if (error.response?.data?.tokenNaoEncontrado) {
          mensagemErro = error.response?.data?.error || mensagemErro;
        }
        
        setMensagem(mensagemErro);
      } finally {
        isValidatingRef.current = false;
      }
    };

    validar();
  }, [searchParams]);

  return (
    <div className="validar-email-page">
      <div className="validar-email-card">
        {status === 'loading' && (
          <>
            <div className="validar-email-spinner"></div>
            <h2>Validando email...</h2>
          </>
        )}
        
        {status === 'success' && (
          <>
            <FaCheckCircle className="validar-email-icon success" />
            <h2>Email Validado!</h2>
            <p>{mensagem}</p>
            <p className="validar-email-redirect">Redirecionando em alguns segundos...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <FaTimesCircle className="validar-email-icon error" />
            <h2>Erro na Validação</h2>
            <p>{mensagem}</p>
            <button 
              onClick={() => window.location.href = '/'} 
              className="btn-primary"
              style={{ 
                marginTop: '20px',
                background: 'var(--cor-primaria, #FF6B35)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 107, 53, 0.9)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--cor-primaria, #FF6B35)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Voltar para o Início
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ValidarEmail;

