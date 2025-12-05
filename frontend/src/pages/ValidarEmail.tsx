import { useEffect, useState } from 'react';
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

  useEffect(() => {
    const validar = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setMensagem('Token não fornecido');
        return;
      }

      try {
        await apiService.validarEmail(token);
        setStatus('success');
        setMensagem('Email validado com sucesso! Você já pode usar o sistema normalmente.');
        
        // Redirecionar para a página principal após 3 segundos
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      } catch (error: any) {
        setStatus('error');
        setMensagem(error.response?.data?.error || 'Erro ao validar email. Token inválido ou expirado.');
      }
    };

    validar();
  }, [searchParams, navigate]);

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
              style={{ marginTop: '20px' }}
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

