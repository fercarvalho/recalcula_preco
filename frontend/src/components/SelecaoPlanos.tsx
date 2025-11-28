import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { mostrarAlert } from '../utils/modals';
import './SelecaoPlanos.css';

interface SelecaoPlanosProps {
  onPagamentoSucesso?: () => void;
}

export const SelecaoPlanos: React.FC<SelecaoPlanosProps> = ({ onPagamentoSucesso: _onPagamentoSucesso }) => {
  const [carregando, setCarregando] = useState<string | null>(null);
  const [statusPagamento, setStatusPagamento] = useState<{
    temAcesso: boolean;
    tipo: 'anual' | 'unico' | null;
  } | null>(null);

  useEffect(() => {
    verificarStatus();
  }, []);

  const verificarStatus = async () => {
    try {
      const status = await apiService.verificarStatusPagamento();
      setStatusPagamento(status);
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    }
  };

  const handlePlanoAnual = async () => {
    try {
      setCarregando('anual');
      const { url } = await apiService.criarCheckoutAnual();
      window.location.href = url;
    } catch (error: any) {
      setCarregando(null);
      await mostrarAlert(
        'Erro',
        error.response?.data?.error || 'Erro ao criar sessão de pagamento. Tente novamente.'
      );
    }
  };

  const handlePlanoUnico = async () => {
    try {
      setCarregando('unico');
      const { url } = await apiService.criarCheckoutUnico();
      window.location.href = url;
    } catch (error: any) {
      setCarregando(null);
      await mostrarAlert(
        'Erro',
        error.response?.data?.error || 'Erro ao criar sessão de pagamento. Tente novamente.'
      );
    }
  };

  if (statusPagamento?.temAcesso) {
    return (
      <div className="selecao-planos-container">
        <div className="plano-ativo">
          <h2>✅ Você já tem acesso ativo!</h2>
          <p>
            {statusPagamento.tipo === 'anual'
              ? 'Sua assinatura anual está ativa.'
              : 'Você tem um acesso único ativo.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="selecao-planos-container">
      <div className="planos-header">
        <h1>Escolha seu Plano</h1>
        <p>Selecione o plano que melhor se adequa às suas necessidades</p>
      </div>

      <div className="planos-grid">
        {/* Plano Anual */}
        <div className="plano-card plano-destaque">
          <div className="plano-badge">Mais Popular</div>
          <div className="plano-header">
            <h2>Plano Anual</h2>
            <div className="plano-preco">
              <span className="preco-valor">R$ 19,90</span>
              <span className="preco-periodo">/mês em 12x</span>
            </div>
            <p className="plano-descricao">Acesso completo por 12 meses</p>
          </div>
          <ul className="plano-beneficios">
            <li>✅ Cadastro ilimitado de produtos</li>
            <li>✅ Reajustes automáticos (fixo ou percentual)</li>
            <li>✅ Cálculo com taxas de plataformas</li>
            <li>✅ Organização por categorias</li>
            <li>✅ Acesso de qualquer dispositivo</li>
            <li>✅ Backup automático de valores</li>
            <li>✅ Suporte prioritário</li>
          </ul>
          <button
            className="btn-plano btn-plano-anual"
            onClick={handlePlanoAnual}
            disabled={carregando !== null}
          >
            {carregando === 'anual' ? 'Processando...' : 'Assinar Plano Anual'}
          </button>
        </div>

        {/* Plano Único */}
        <div className="plano-card">
          <div className="plano-header">
            <h2>Acesso Único</h2>
            <div className="plano-preco">
              <span className="preco-valor">R$ 199,00</span>
              <span className="preco-periodo">pagamento único</span>
            </div>
            <p className="plano-descricao">Acesso por 24 horas</p>
          </div>
          <ul className="plano-beneficios">
            <li>✅ Cadastro ilimitado de produtos</li>
            <li>✅ Reajustes automáticos (fixo ou percentual)</li>
            <li>✅ Cálculo com taxas de plataformas</li>
            <li>✅ Organização por categorias</li>
            <li>✅ Acesso de qualquer dispositivo</li>
            <li className="texto-aviso">⚠️ Válido por 24 horas após o pagamento</li>
            <li className="texto-aviso">⚠️ Dados não são salvos permanentemente</li>
          </ul>
          <button
            className="btn-plano btn-plano-unico"
            onClick={handlePlanoUnico}
            disabled={carregando !== null}
          >
            {carregando === 'unico' ? 'Processando...' : 'Comprar Acesso Único'}
          </button>
        </div>
      </div>
    </div>
  );
};

