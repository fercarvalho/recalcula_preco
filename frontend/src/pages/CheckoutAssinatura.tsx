import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { FaTicketAlt, FaCheckCircle, FaShieldAlt } from 'react-icons/fa';
import { getUser, isAuthenticated } from '../services/auth';
import { mostrarAlert } from '../utils/modals';
import { validarCPF, formatarCPF as formatarCPFUtil } from '../utils/validacao';
import { buscarCEP } from '../services/api';
import './Checkout.css';

// Lista de países (mesma do Checkout.tsx)
const PAISES = [
  'Brasil', 'Afeganistão', 'África do Sul', 'Albânia', 'Alemanha', 'Andorra', 'Angola', 'Antígua e Barbuda',
  'Arábia Saudita', 'Argélia', 'Argentina', 'Armênia', 'Austrália', 'Áustria', 'Azerbaijão', 'Bahamas',
  'Bangladesh', 'Barbados', 'Barein', 'Bélgica', 'Belize', 'Benim', 'Bielorrússia', 'Bolívia', 'Bósnia e Herzegovina',
  'Botsuana', 'Brunei', 'Bulgária', 'Burkina Faso', 'Burundi', 'Butão', 'Cabo Verde', 'Camarões', 'Camboja',
  'Canadá', 'Catar', 'Cazaquistão', 'Chade', 'Chile', 'China', 'Chipre', 'Colômbia', 'Comores', 'Congo',
  'Coreia do Norte', 'Coreia do Sul', 'Costa do Marfim', 'Costa Rica', 'Croácia', 'Cuba', 'Dinamarca', 'Djibuti',
  'Dominica', 'Egito', 'El Salvador', 'Emirados Árabes Unidos', 'Equador', 'Eritreia', 'Eslováquia', 'Eslovênia',
  'Espanha', 'Estados Unidos', 'Estônia', 'Eswatini', 'Etiópia', 'Fiji', 'Filipinas', 'Finlândia', 'França',
  'Gabão', 'Gâmbia', 'Gana', 'Geórgia', 'Granada', 'Grécia', 'Guatemala', 'Guiana', 'Guiné', 'Guiné-Bissau',
  'Guiné Equatorial', 'Haiti', 'Honduras', 'Hungria', 'Iêmen', 'Índia', 'Indonésia', 'Irã', 'Iraque', 'Irlanda',
  'Islândia', 'Israel', 'Itália', 'Jamaica', 'Japão', 'Jordânia', 'Kiribati', 'Kuwait', 'Laos', 'Lesoto',
  'Letônia', 'Líbano', 'Libéria', 'Líbia', 'Liechtenstein', 'Lituânia', 'Luxemburgo', 'Madagáscar', 'Malásia',
  'Maláui', 'Maldivas', 'Mali', 'Malta', 'Marrocos', 'Maurícia', 'Mauritânia', 'México', 'Micronésia', 'Moçambique',
  'Moldávia', 'Mônaco', 'Mongólia', 'Montenegro', 'Myanmar', 'Namíbia', 'Nauru', 'Nepal', 'Nicarágua', 'Níger',
  'Nigéria', 'Noruega', 'Nova Zelândia', 'Omã', 'Países Baixos', 'Palau', 'Palestina', 'Panamá', 'Papua-Nova Guiné',
  'Paquistão', 'Paraguai', 'Peru', 'Polônia', 'Portugal', 'Quênia', 'Quirguistão', 'Reino Unido', 'República Centro-Africana',
  'República Democrática do Congo', 'República Dominicana', 'Romênia', 'Ruanda', 'Rússia', 'Salomão', 'Samoa', 'San Marino',
  'Santa Lúcia', 'São Cristóvão e Névis', 'São Tomé e Príncipe', 'São Vicente e Granadinas', 'Seicheles', 'Senegal',
  'Serra Leoa', 'Sérvia', 'Singapura', 'Síria', 'Somália', 'Sri Lanka', 'Sudão', 'Sudão do Sul', 'Suécia', 'Suíça',
  'Suriname', 'Tadjiquistão', 'Tailândia', 'Tanzânia', 'Timor-Leste', 'Togo', 'Tonga', 'Trindade e Tobago', 'Tunísia',
  'Turcomenistão', 'Turquia', 'Tuvalu', 'Ucrânia', 'Uganda', 'Uruguai', 'Uzbequistão', 'Vanuatu', 'Vaticano', 'Venezuela',
  'Vietnã', 'Zâmbia', 'Zimbábue'
].sort();

// Carregar Stripe com sua chave pública
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || '';
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

interface EnderecoData {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
}

interface FaturamentoData {
  cpf: string;
  nomeCompleto: string;
}

const CheckoutAssinaturaForm = ({ 
  amount, 
  planoId,
  onCupomAplicado,
  valorAnualComDesconto,
  valorMensalComDesconto,
  isPlanoMensal
}: { 
  amount: number; 
  planoId: number;
  onCupomAplicado?: (cupom: any) => void;
  valorAnualComDesconto?: number;
  valorMensalComDesconto?: number;
  isPlanoMensal?: boolean;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const ehPlanoMensal = !!isPlanoMensal;

  // Dados do formulário (mesmos do Checkout.tsx)
  const [faturamento, setFaturamento] = useState<FaturamentoData>({
    cpf: '',
    nomeCompleto: '',
  });
  const [endereco, setEndereco] = useState<EnderecoData>({
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
  });
  const [nomeCartao, setNomeCartao] = useState('');
  const [cupom, setCupom] = useState('');
  const [cupomAplicado, setCupomAplicado] = useState<any>(null);
  const [validandoCupom, setValidandoCupom] = useState(false);
  // Definir base em centavos: mensal para planos mensais, anual para planos anuais
  const valorBase = ehPlanoMensal
    ? Math.round((valorMensalComDesconto ?? amount / 100) * 100)
    : valorAnualComDesconto
      ? Math.round(valorAnualComDesconto * 100)
      : amount;
  const [valorFinal, setValorFinal] = useState(valorBase);
  const [naoPossuiCpf, setNaoPossuiCpf] = useState(false);
  const [naoResidoBrasil, setNaoResidoBrasil] = useState(false);
  const [pais, setPais] = useState('Brasil');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Buscar CEP
  const buscarCep = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) {
      setErrors(prev => ({ ...prev, cep: 'CEP deve ter 8 dígitos' }));
      return;
    }

    setBuscandoCep(true);
    try {
      const data = await buscarCEP(cepLimpo);

      // Preencher endereço com os dados retornados
      setEndereco(prev => ({
        ...prev,
        logradouro: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.cidade || '',
        uf: data.uf || '',
      }));

      // Limpar erro de CEP se houver
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.cep;
        return newErrors;
      });
    } catch (error: any) {
      console.error('Erro ao buscar CEP:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Erro ao buscar CEP. Verifique se o CEP está correto.';
      setErrors(prev => ({ ...prev, cep: errorMessage }));
    } finally {
      setBuscandoCep(false);
    }
  };

  // Validação do formulário (mesma do Checkout.tsx)
  const validarFormulario = () => {
    const newErrors: { [key: string]: string } = {};

    if (!naoPossuiCpf && !faturamento.cpf) {
      newErrors.cpf = 'CPF é obrigatório';
    } else if (!naoPossuiCpf && faturamento.cpf && !validarCPF(faturamento.cpf)) {
      newErrors.cpf = 'CPF inválido';
    }

    if (!faturamento.nomeCompleto || faturamento.nomeCompleto.trim().length < 3) {
      newErrors.nomeCompleto = 'Nome completo é obrigatório';
    }

    if (!naoResidoBrasil) {
      if (!endereco.cep || endereco.cep.replace(/\D/g, '').length !== 8) {
        newErrors.cep = 'CEP inválido';
      }
      if (!endereco.numero || endereco.numero.trim().length === 0) {
        newErrors.numero = 'Número é obrigatório';
      }
      if (!endereco.cidade || endereco.cidade.trim().length === 0) {
        newErrors.cidade = 'Cidade é obrigatória';
      }
      if (!endereco.uf || endereco.uf.length !== 2) {
        newErrors.uf = 'UF é obrigatória';
      }
    } else {
      if (!pais || pais.trim().length === 0) {
        newErrors.pais = 'País é obrigatório';
      }
    }

    if (!nomeCartao || nomeCartao.trim().length < 3) {
      newErrors.nomeCartao = 'Nome no cartão é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validar e aplicar cupom (mesma do Checkout.tsx)
  const handleValidarCupom = async () => {
    if (!cupom.trim()) {
      return;
    }

    setValidandoCupom(true);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || window.location.origin;
      const token = localStorage.getItem('calculadora_auth_token');
      
      // Buscar priceId do plano
      const planoResponse = await fetch(`${API_BASE}/api/planos/${planoId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!planoResponse.ok) {
        throw new Error('Erro ao buscar informações do plano');
      }
      
      const plano = await planoResponse.json();
      
      if (!plano.stripe_price_id) {
        throw new Error('Plano não possui price_id configurado');
      }
      
      // Validar cupom - passar valorAnual para calcular desconto sobre o valor anual total
      const response = await fetch(`${API_BASE}/api/stripe/validar-cupom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          codigo: cupom.trim().toUpperCase(),
          priceId: plano.stripe_price_id,
          planoId: planoId,
          valorAnual: valorAnualComDesconto, // Passar valor anual com desconto do plano
        }),
      });

      const resultado = await response.json();

      if (resultado.valido) {
        setCupomAplicado(resultado);
        setValorFinal(resultado.valorComDesconto);
        if (onCupomAplicado) {
          onCupomAplicado(resultado);
        }
        await mostrarAlert('Sucesso', `Cupom aplicado! Desconto de ${resultado.tipo === 'percentual' ? `${resultado.desconto}%` : `R$ ${(resultado.desconto / 100).toFixed(2).replace('.', ',')}`}`);
      } else {
        setCupomAplicado(null);
        await mostrarAlert('Erro', resultado.error || 'Código promocional inválido');
      }
    } catch (error: any) {
      console.error('Erro ao validar cupom:', error);
      await mostrarAlert('Erro', error.message || 'Erro ao validar código promocional');
      setCupomAplicado(null);
    } finally {
      setValidandoCupom(false);
    }
  };

  const formatarCPF = formatarCPFUtil;

  const formatarCEP = (value: string) => {
    const cep = value.replace(/\D/g, '');
    if (cep.length <= 8) {
      return cep.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    return value;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || window.location.origin;
      const token = localStorage.getItem('calculadora_auth_token');

      // 1. Buscar plano para obter priceId
      const planoResponse = await fetch(`${API_BASE}/api/planos/${planoId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!planoResponse.ok) {
        throw new Error('Erro ao buscar informações do plano');
      }

      const plano = await planoResponse.json();

      if (!plano.stripe_price_id) {
        throw new Error('Plano não possui price_id configurado');
      }

      // Validação do formulário
      if (!validarFormulario()) {
        await mostrarAlert('Erro', 'Por favor, preencha todos os campos obrigatórios corretamente.');
        setLoading(false);
        return;
      }

      // O customer será criado automaticamente pelo backend no create-subscription
      // Não precisamos criar manualmente aqui, seguindo o mesmo padrão do checkout de pagamentos únicos

      // 2. Criar PaymentMethod
      const cardNumberElement = elements.getElement(CardNumberElement);
      if (!cardNumberElement) {
        throw new Error('Elemento de número do cartão não encontrado');
      }

      // Preparar billing_details
      const billingDetails: any = {
        name: nomeCartao,
        email: getUser()?.email,
      };
      
      if (!naoResidoBrasil) {
        billingDetails.address = {
          line1: `${endereco.logradouro}, ${endereco.numero}`,
          line2: endereco.complemento || undefined,
          city: endereco.cidade,
          state: endereco.uf,
          postal_code: endereco.cep.replace(/\D/g, ''),
          country: 'BR',
        };
      } else {
        const codigoPais = pais === 'Estados Unidos' ? 'US' : 
                          pais === 'Reino Unido' ? 'GB' : 
                          pais === 'Países Baixos' ? 'NL' : 'BR';
        billingDetails.address = {
          country: codigoPais,
        };
      }

      const { paymentMethod, error: pmError } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardNumberElement,
        billing_details: billingDetails,
      });

      if (pmError || !paymentMethod) {
        throw new Error(pmError?.message || 'Erro ao processar cartão');
      }

      // 3. Criar Subscription (valor > 0)
      const subscriptionResponse = await fetch(`${API_BASE}/api/stripe/create-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentMethodId: paymentMethod.id,
          priceId: plano.stripe_price_id,
          planoId: plano.id,
          couponId: cupomAplicado?.couponId || null,
          promotionCodeId: cupomAplicado?.promotionCodeId || null, // ID do Promotion Code na Stripe
        }),
      });

      if (!subscriptionResponse.ok) {
        const errorData = await subscriptionResponse.json().catch(() => ({ error: 'Erro ao criar assinatura' }));
        throw new Error(errorData.error || 'Erro ao criar assinatura');
      }

      const subscriptionData = await subscriptionResponse.json();

      // 4. Se houver clientSecret, confirmar pagamento
      if (subscriptionData.clientSecret) {
        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
          subscriptionData.clientSecret,
          {
            payment_method: paymentMethod.id,
          }
        );

        if (confirmError) {
          throw new Error(confirmError.message || 'Erro ao confirmar pagamento');
        }

        if (paymentIntent && paymentIntent.status !== 'succeeded') {
          throw new Error('Pagamento não foi confirmado');
        }
      }

      // 5. Preparar dados do checkout para salvar no cadastro
      const dadosCheckout: any = {
        nomeCompleto: faturamento.nomeCompleto,
      };
      
      if (!naoPossuiCpf && faturamento.cpf) {
        dadosCheckout.cpf = faturamento.cpf;
      }
      
      if (!naoResidoBrasil) {
        dadosCheckout.cep = endereco.cep;
        dadosCheckout.logradouro = endereco.logradouro;
        dadosCheckout.numero = endereco.numero;
        dadosCheckout.complemento = endereco.complemento;
        dadosCheckout.bairro = endereco.bairro;
        dadosCheckout.cidade = endereco.cidade;
        dadosCheckout.uf = endereco.uf;
        dadosCheckout.pais = 'Brasil';
      } else {
        dadosCheckout.pais = pais;
      }

      // 6. Confirmar assinatura no backend (enviando dados do checkout)
      const confirmResponse = await fetch(`${API_BASE}/api/stripe/confirmar-assinatura`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          subscriptionId: subscriptionData.subscriptionId,
          paymentIntentId: subscriptionData.clientSecret ? undefined : undefined,
          dadosCheckout: dadosCheckout, // Enviar dados do checkout para salvar no perfil
        }),
      });

      if (!confirmResponse.ok) {
        const errorData = await confirmResponse.json().catch(() => ({ error: 'Erro ao confirmar assinatura' }));
        throw new Error(errorData.error || 'Erro ao confirmar assinatura');
      }

      // 7. Sucesso!
      await mostrarAlert('Sucesso', 'Assinatura realizada com sucesso!');
      window.location.href = '/';
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao processar assinatura';
      setError(errorMessage);
      await mostrarAlert('Erro', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Calcular valor do botão usando o período correto
  const valorParaBotaoBase = ehPlanoMensal
    ? (valorMensalComDesconto ?? valorBase / 100)
    : (valorAnualComDesconto ?? valorBase / 100);

  const valorParaBotao = cupomAplicado && cupomAplicado.valorComDesconto
    ? valorFinal / 100
    : valorParaBotaoBase;
  const valorFormatadoBotao = `R$ ${valorParaBotao.toFixed(2).replace('.', ',')}`;
  const textoPeriodoBotao = ehPlanoMensal ? '/mês' : '/ano';
  
  const valorFormatadoFinal = `R$ ${(valorFinal / 100).toFixed(2).replace('.', ',')}`;
  const valorFormatadoOriginal = `R$ ${(valorBase / 100).toFixed(2).replace('.', ',')}`;
  const descontoFormatado = cupomAplicado 
    ? cupomAplicado.tipo === 'percentual'
      ? `${cupomAplicado.desconto}%`
      : `R$ ${(cupomAplicado.desconto / 100).toFixed(2).replace('.', ',')}`
    : null;

  // Reutilizar o mesmo JSX do Checkout.tsx (copiar seções de código promocional, faturamento, endereço, cartão)
  // Por questão de espaço, vou criar uma versão simplificada que reutiliza a mesma estrutura
  
  return (
    <form onSubmit={handleSubmit} className="checkout-form">
      {/* Seção: Código Promocional - Mesma do Checkout.tsx */}
      <div className="checkout-section" style={{
        backgroundColor: 'var(--cor-primaria)',
        border: '2px solid var(--cor-primaria)',
      }}>
        <h2 className="checkout-section-title" style={{ 
          color: 'var(--cor-texto)',
          borderBottomColor: 'rgba(255, 255, 255, 0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <FaTicketAlt /> Código Promocional
        </h2>
        
        <div className="form-group">
          <label htmlFor="cupom" style={{ color: 'var(--cor-texto)' }}>
            Código de desconto
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              id="cupom"
              className="form-input-dark cupom-input"
              value={cupom}
              onChange={(e) => setCupom(e.target.value.toUpperCase())}
              placeholder="Digite o código promocional"
              disabled={validandoCupom || !!cupomAplicado}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: '6px',
                fontSize: '1rem',
              }}
            />
            {!cupomAplicado ? (
              <button
                type="button"
                onClick={handleValidarCupom}
                disabled={validandoCupom || !cupom.trim()}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: validandoCupom || !cupom.trim() ? 'var(--cor-hover)' : 'var(--cor-hover)',
                  color: 'var(--cor-texto)',
                  border: '1px solid var(--cor-borda)',
                  borderRadius: '6px',
                  cursor: validandoCupom || !cupom.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: 600,
                  transition: 'all 0.3s',
                }}
              >
                {validandoCupom ? 'Validando...' : 'Aplicar'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setCupomAplicado(null);
                  setCupom('');
                  setValorFinal(valorBase);
                  if (onCupomAplicado) {
                    onCupomAplicado(null);
                  }
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'var(--cor-hover)',
                  color: 'var(--cor-texto)',
                  border: '1px solid var(--cor-borda)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 600,
                  transition: 'all 0.3s',
                }}
              >
                Remover
              </button>
            )}
          </div>
        </div>

        {cupomAplicado && (
          <div className="cupom-resumo-box" style={{
            marginTop: '1rem',
            padding: '1rem',
            background: 'var(--cor-card-fundo)',
            border: '1px solid var(--cor-borda)',
            borderRadius: '8px'
          }}>
            <div className="cupom-aplicado-mensagem" style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.75rem',
              color: '#4CAF50',
              fontSize: '0.9rem'
            } as React.CSSProperties}>
              <FaCheckCircle style={{ color: '#4CAF50', fill: '#4CAF50' }} />
              <span style={{ fontWeight: 'bold', color: '#4CAF50' } as React.CSSProperties}>Cupom aplicado! Desconto de {descontoFormatado}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--cor-texto)' }}>
              <span style={{ color: 'var(--cor-texto)' }}>Valor original:</span>
              <span style={{ color: 'var(--cor-texto)' }}>{valorFormatadoOriginal}</span>
            </div>
            <div className="desconto-linha" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#4CAF50' } as React.CSSProperties}>
              <span style={{ color: '#4CAF50' } as React.CSSProperties}>Desconto:</span>
              <span style={{ color: '#4CAF50' } as React.CSSProperties}>
                - R$ {(cupomAplicado.descontoAplicado / 100).toFixed(2).replace('.', ',')}
              </span>
            </div>
            <div className="total-linha" style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              fontWeight: 'bold', 
              fontSize: '1.1rem', 
              paddingTop: '0.5rem', 
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#FF6B35'
            } as React.CSSProperties}>
              <span style={{ color: '#FF6B35' } as React.CSSProperties}>Total:</span>
              <span className="valor-total-laranja" style={{ color: '#FF6B35' } as React.CSSProperties}>{valorFormatadoFinal}</span>
            </div>
          </div>
        )}
      </div>

      {/* Seção 1: Dados para faturamento */}
      <div className="checkout-section">
        <h2 className="checkout-section-title">1. Dados para faturamento</h2>
        
        <div className="form-group">
          <label htmlFor="cpf">
            CPF {!naoPossuiCpf && <span className="required">*</span>}
          </label>
          <input
            type="text"
            id="cpf"
            className={`form-input-dark ${errors.cpf ? 'input-error' : ''}`}
            value={faturamento.cpf}
            onChange={(e) => {
              const formatted = formatarCPF(e.target.value);
              setFaturamento(prev => ({ ...prev, cpf: formatted }));
              
              if (naoPossuiCpf) {
                setErrors(prev => {
                  const newErrors = { ...prev };
                  delete newErrors.cpf;
                  return newErrors;
                });
                return;
              }
              
              const cpfLimpo = formatted.replace(/\D/g, '');
              if (cpfLimpo.length === 11) {
                if (!validarCPF(formatted)) {
                  setErrors(prev => ({ ...prev, cpf: 'CPF inválido. Verifique os dígitos.' }));
                } else {
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.cpf;
                    return newErrors;
                  });
                }
              } else if (cpfLimpo.length > 0) {
                setErrors(prev => {
                  const newErrors = { ...prev };
                  delete newErrors.cpf;
                  return newErrors;
                });
              } else {
                setErrors(prev => {
                  const newErrors = { ...prev };
                  delete newErrors.cpf;
                  return newErrors;
                });
              }
            }}
            placeholder="000.000.000-00"
            maxLength={14}
            disabled={naoPossuiCpf}
          />
          {errors.cpf && <span className="error-text">{errors.cpf}</span>}
          {!naoPossuiCpf && <small className="form-hint">Necessário para emissão da nota fiscal</small>}
          <div className="checkbox-group" style={{ marginTop: '10px' }}>
            <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--cor-texto)', fontSize: '0.9rem', opacity: 0.9 }}>
              <input
                type="checkbox"
                checked={naoPossuiCpf}
                onChange={(e) => {
                  setNaoPossuiCpf(e.target.checked);
                  if (e.target.checked) {
                    setFaturamento(prev => ({ ...prev, cpf: '' }));
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.cpf;
                      return newErrors;
                    });
                  }
                }}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span>Sou estrangeiro e não possuo CPF</span>
            </label>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="nomeCompleto">
            Nome completo para faturamento <span className="required">*</span>
          </label>
          <input
            type="text"
            id="nomeCompleto"
            className={`form-input-dark ${errors.nomeCompleto ? 'input-error' : ''}`}
            value={faturamento.nomeCompleto}
            onChange={(e) => {
              setFaturamento(prev => ({ ...prev, nomeCompleto: e.target.value }));
              if (errors.nomeCompleto) {
                setErrors(prev => {
                  const newErrors = { ...prev };
                  delete newErrors.nomeCompleto;
                  return newErrors;
                });
              }
            }}
            placeholder="Seu nome completo"
          />
          {errors.nomeCompleto && <span className="error-text">{errors.nomeCompleto}</span>}
        </div>
      </div>

      {/* Seção 2: Endereço */}
      <div className="checkout-section">
        <h2 className="checkout-section-title">2. Endereço {!naoResidoBrasil && <span className="required">*</span>}</h2>
        
        {!naoResidoBrasil ? (
          <>
            <div className="form-group">
              <label htmlFor="cep">
                CEP <span className="required">*</span>
              </label>
              <div className="input-with-action">
                <input
                  type="text"
                  id="cep"
                  className={`form-input-dark ${errors.cep ? 'input-error' : ''}`}
                  value={endereco.cep}
                  onChange={(e) => {
                    const formatted = formatarCEP(e.target.value);
                    setEndereco(prev => ({ ...prev, cep: formatted }));
                    if (errors.cep) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.cep;
                        return newErrors;
                      });
                    }
                  }}
                  onBlur={(e) => {
                    const cepLimpo = e.target.value.replace(/\D/g, '');
                    if (cepLimpo.length === 8) {
                      buscarCep(cepLimpo);
                    }
                  }}
                  placeholder="00000-000"
                  maxLength={9}
                  disabled={buscandoCep || naoResidoBrasil}
                />
                {buscandoCep && <span className="loading-indicator">Buscando...</span>}
              </div>
              {errors.cep && <span className="error-text">{errors.cep}</span>}
              <small className="form-hint">Digite o CEP para preenchimento automático do endereço</small>
            </div>

            <div className="form-row">
              <div className="form-group form-group-large">
                <label htmlFor="logradouro">Logradouro</label>
                <input
                  type="text"
                  id="logradouro"
                  className="form-input-dark"
                  value={endereco.logradouro}
                  onChange={(e) => setEndereco(prev => ({ ...prev, logradouro: e.target.value }))}
                  placeholder="Rua, Avenida, etc."
                  disabled={naoResidoBrasil}
                />
              </div>
              <div className="form-group form-group-small">
                <label htmlFor="numero">
                  Número <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="numero"
                  className={`form-input-dark ${errors.numero ? 'input-error' : ''}`}
                  value={endereco.numero}
                  onChange={(e) => {
                    setEndereco(prev => ({ ...prev, numero: e.target.value }));
                    if (errors.numero) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.numero;
                        return newErrors;
                      });
                    }
                  }}
                  placeholder="123"
                  disabled={naoResidoBrasil}
                />
                {errors.numero && <span className="error-text">{errors.numero}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="complemento">Complemento</label>
              <input
                type="text"
                id="complemento"
                className="form-input-dark"
                value={endereco.complemento}
                onChange={(e) => setEndereco(prev => ({ ...prev, complemento: e.target.value }))}
                placeholder="Apto, Bloco, etc."
                disabled={naoResidoBrasil}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="bairro">Bairro</label>
                <input
                  type="text"
                  id="bairro"
                  className="form-input-dark"
                  value={endereco.bairro}
                  onChange={(e) => setEndereco(prev => ({ ...prev, bairro: e.target.value }))}
                  placeholder="Seu bairro"
                  disabled={naoResidoBrasil}
                />
              </div>
              <div className="form-group">
                <label htmlFor="cidade">
                  Cidade <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="cidade"
                  className={`form-input-dark ${errors.cidade ? 'input-error' : ''}`}
                  value={endereco.cidade}
                  onChange={(e) => {
                    setEndereco(prev => ({ ...prev, cidade: e.target.value }));
                    if (errors.cidade) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.cidade;
                        return newErrors;
                      });
                    }
                  }}
                  placeholder="Sua cidade"
                  disabled={naoResidoBrasil}
                />
                {errors.cidade && <span className="error-text">{errors.cidade}</span>}
              </div>
              <div className="form-group form-group-small">
                <label htmlFor="uf">
                  UF <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="uf"
                  className={`form-input-dark ${errors.uf ? 'input-error' : ''}`}
                  value={endereco.uf}
                  onChange={(e) => {
                    const uf = e.target.value.toUpperCase().substring(0, 2);
                    setEndereco(prev => ({ ...prev, uf }));
                    if (errors.uf) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.uf;
                        return newErrors;
                      });
                    }
                  }}
                  placeholder="SP"
                  maxLength={2}
                  disabled={naoResidoBrasil}
                />
                {errors.uf && <span className="error-text">{errors.uf}</span>}
              </div>
            </div>
          </>
        ) : (
          <div className="form-group">
            <label htmlFor="pais">
              País <span className="required">*</span>
            </label>
            <select
              id="pais"
              className={`form-input-dark ${errors.pais ? 'input-error' : ''}`}
              value={pais}
              onChange={(e) => {
                setPais(e.target.value);
                if (errors.pais) {
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.pais;
                    return newErrors;
                  });
                }
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                cursor: 'pointer',
                boxSizing: 'border-box',
              }}
            >
              {PAISES.map(p => (
                <option key={p} value={p} style={{ background: 'var(--cor-secundaria)', color: 'var(--cor-texto)' }}>{p}</option>
              ))}
            </select>
            {errors.pais && <span className="error-text">{errors.pais}</span>}
          </div>
        )}
        
        <div className="checkbox-group" style={{ marginTop: '1rem' }}>
          <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem' }}>
            <input
              type="checkbox"
              checked={naoResidoBrasil}
              onChange={(e) => {
                const checked = e.target.checked;
                setNaoResidoBrasil(checked);
                if (checked) {
                  setEndereco({
                    cep: '',
                    logradouro: '',
                    numero: '',
                    complemento: '',
                    bairro: '',
                    cidade: '',
                    uf: '',
                  });
                  setPais('Brasil');
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.cep;
                    delete newErrors.numero;
                    delete newErrors.cidade;
                    delete newErrors.uf;
                    return newErrors;
                  });
                } else {
                  setPais('Brasil');
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.pais;
                    return newErrors;
                  });
                }
              }}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span>Não resido no Brasil</span>
          </label>
        </div>
      </div>

      {/* Seção 3: Dados do cartão */}
      <div className="checkout-section">
        <h2 className="checkout-section-title">3. Dados do cartão de crédito</h2>
        
        <div className="form-group">
          <label htmlFor="nomeCartao">
            Nome no cartão <span className="required">*</span>
          </label>
          <input
            type="text"
            id="nomeCartao"
            className={`form-input-dark ${errors.nomeCartao ? 'input-error' : ''}`}
            value={nomeCartao}
            onChange={(e) => {
              setNomeCartao(e.target.value);
              if (errors.nomeCartao) {
                setErrors(prev => {
                  const newErrors = { ...prev };
                  delete newErrors.nomeCartao;
                  return newErrors;
                });
              }
            }}
            placeholder="Nome como está no cartão"
          />
          {errors.nomeCartao && <span className="error-text">{errors.nomeCartao}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="numeroCartao">
            Número do cartão <span className="required">*</span>
          </label>
          <div className="card-element-wrapper">
            <CardNumberElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#b0b0b0',
                    fontFamily: 'inherit',
                    '::placeholder': {
                      color: '#b0b0b0',
                    },
                  },
                  invalid: {
                    color: 'var(--cor-primaria)',
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="form-row form-row-2">
          <div className="form-group">
            <label htmlFor="validadeCartao">
              Validade <span className="required">*</span>
            </label>
            <div className="card-element-wrapper">
              <CardExpiryElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#b0b0b0',
                      fontFamily: 'inherit',
                      '::placeholder': {
                        color: '#b0b0b0',
                      },
                    },
                    invalid: {
                      color: 'var(--cor-primaria)',
                    },
                  },
                }}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="cvvCartao">
              CVV <span className="required">*</span>
            </label>
            <div className="card-element-wrapper">
              <CardCvcElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#b0b0b0',
                      fontFamily: 'inherit',
                      '::placeholder': {
                        color: '#b0b0b0',
                      },
                    },
                    invalid: {
                      color: 'var(--cor-primaria)',
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message" style={{ marginTop: '1rem' }}>
          {error}
        </div>
      )}

      <div className="garantia-aviso" style={{
        marginTop: '1.5rem',
        marginBottom: '1rem',
        padding: '1rem',
        backgroundColor: 'rgba(255, 107, 53, 0.1)',
        border: '1px solid rgba(255, 107, 53, 0.3)',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <strong style={{ 
          color: 'var(--cor-primaria, #FF6B35)', 
          fontSize: '1rem',
          display: 'block',
          marginBottom: '0.5rem'
        }}>
          <FaShieldAlt style={{ marginRight: '0.5rem', display: 'inline' }} /> Garantia de 7 dias
        </strong>
        <p style={{ 
          margin: 0, 
          fontSize: '0.9rem', 
          color: 'rgba(255, 255, 255, 0.8)',
          lineHeight: '1.4'
        }}>
          Não gostou? Reembolso total em até 7 dias após a compra
        </p>
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className="btn-pagar"
      >
        {loading ? 'Processando...' : `Assinar ${valorFormatadoBotao}${textoPeriodoBotao}`}
      </button>

      <div className="stripe-powered-by" style={{
        marginTop: '1.5rem',
        textAlign: 'center',
        paddingTop: '1rem',
        borderTop: '1px solid var(--cor-borda)'
      }}>
        <p style={{
          margin: 0,
          fontSize: '0.85rem',
          color: 'var(--cor-texto-secundario)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          <span>Pagamento seguro processado por</span>
          <a 
            href="https://stripe.com" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              color: 'var(--cor-texto)',
              textDecoration: 'none',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--cor-primaria, #FF6B35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--cor-texto)';
            }}
          >
            Stripe
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
              <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.537-.915-6.59-2.121l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305h.02z" fill="currentColor"/>
            </svg>
          </a>
        </p>
      </div>
    </form>
  );
};

const CheckoutAssinatura = () => {
  const [loading, setLoading] = useState(true);
  const [plano, setPlano] = useState<{
    id: number;
    nome: string;
    valor: number; // Valor anual com desconto (ex: 239,40)
    valor_total: number | null; // Valor anual original (ex: 478,80)
    valor_parcelado: number | null; // Valor mensal com desconto (ex: 19,95)
    stripe_price_id: string | null;
    desconto_percentual?: number;
    desconto_valor?: number;
    frase_reforco?: string | null;
    periodo?: string | null;
  } | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [cupomAplicado, setCupomAplicado] = useState<any>(null);

  useEffect(() => {
    // Verificar autenticação
    if (!isAuthenticated()) {
      window.location.href = '/';
      return;
    }

    // Buscar dados do plano da URL
    const urlParams = new URLSearchParams(window.location.search);
    const planoId = urlParams.get('planoId');
    if (!planoId) {
      mostrarAlert('Erro', 'Plano não especificado.').then(() => {
        window.location.href = '/';
      });
      return;
    }

    const carregarPlano = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE || window.location.origin;
        const token = localStorage.getItem('calculadora_auth_token');
        
        const response = await fetch(`${API_BASE}/api/planos/${planoId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          throw new Error('Erro ao buscar plano');
        }
        
        const planoCarregado = await response.json();
        console.log('Plano carregado do backend:', {
          id: planoCarregado.id,
          nome: planoCarregado.nome,
          valor: planoCarregado.valor,
          valor_total: planoCarregado.valor_total,
          valor_parcelado: planoCarregado.valor_parcelado,
          desconto_percentual: planoCarregado.desconto_percentual,
          periodo: planoCarregado.periodo
        });
        setPlano(planoCarregado);
      } catch (error) {
        console.error('Erro ao carregar plano:', error);
        await mostrarAlert('Erro', 'Erro ao carregar informações do plano.');
        window.location.href = '/';
      } finally {
        setLoading(false);
      }
    };

    carregarPlano();
  }, []);

  useEffect(() => {
    if (!stripePublicKey || stripePublicKey.trim() === '') {
      setStripeError('Chave pública do Stripe não configurada.');
    } else if (!stripePromise) {
      setStripeError('Erro ao carregar Stripe.');
    }
  }, []);

  if (loading) {
    return (
      <div className="checkout-page">
        <div className="checkout-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  if (stripeError || !stripePromise || !plano) {
    return (
      <div className="checkout-page">
        <div className="checkout-container">
          <div className="error-container">
            <h2>Erro</h2>
            <p>{stripeError || 'Plano não encontrado'}</p>
            <button onClick={() => window.location.href = '/'} className="btn-voltar">
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const usuario = getUser();
  if (!usuario) {
    window.location.href = '/';
    return null;
  }

  // Estrutura do plano no banco de dados:
  // - `valor`: Valor anual COM desconto (ex: R$ 239,40)
  // - `valor_total`: Valor anual ORIGINAL (ex: R$ 478,80)
  // - `valor_parcelado`: Valor mensal COM desconto (ex: R$ 19,95)
  // - `desconto_percentual`: Percentual de desconto (ex: 50%)
  
  console.log('=== VALORES DO PLANO RECEBIDOS ===');
  console.log('valor:', plano.valor);
  console.log('valor_total:', plano.valor_total);
  console.log('valor_parcelado:', plano.valor_parcelado);
  console.log('desconto_percentual:', plano.desconto_percentual);
  console.log('periodo:', plano.periodo);
  
  // Verificar se o plano é mensal ou anual
  const periodoPlano = (plano.periodo || '').toLowerCase();
  const nomePlano = (plano.nome || '').toLowerCase();
  const temValorParcelado = !!plano.valor_parcelado && plano.valor_parcelado > 0;

  // Heurística: se há valor_parcelado ou o período/nome menciona mensal, consideramos plano mensal.
  const isPlanoMensal = temValorParcelado || periodoPlano.includes('mensal') || nomePlano.includes('mensal');
  // const isPlanoAnual = !isPlanoMensal && (periodoPlano.includes('anual') || nomePlano.includes('anual'));
  
  // Calcular valores corretos baseado no período do plano
  let valorAnualOriginal, valorAnualComDesconto, valorMensalOriginal, valorMensalComDesconto;
  const arredondarParaBaixo2 = (valor: number) => Math.floor(valor * 100) / 100;
  
  const percentualDescontoPlano = plano.desconto_percentual && plano.desconto_percentual > 0
    ? plano.desconto_percentual / 100
    : 0;

  if (isPlanoMensal) {
    // Para planos mensais, se houver valor_total (geralmente anual original), convertemos para mensal
    if (plano.valor_total && plano.valor_total > 0) {
      const valorAnualOriginalPlano = plano.valor_total;
      const valorAnualComDescontoPlano = percentualDescontoPlano > 0
        ? valorAnualOriginalPlano * (1 - percentualDescontoPlano)
        : (plano.valor || valorAnualOriginalPlano);

      valorMensalOriginal = valorAnualOriginalPlano / 12;
      valorMensalComDesconto = valorAnualComDescontoPlano / 12;
      valorAnualOriginal = valorAnualOriginalPlano;
      valorAnualComDesconto = valorAnualComDescontoPlano;
    } else {
      // Sem valor_total: usar base mensal informada e, se houver desconto_percentual, estimar original
      const valorMensalBase = plano.valor_parcelado || plano.valor;
      valorMensalComDesconto = valorMensalBase;
      valorMensalOriginal = percentualDescontoPlano > 0
        ? valorMensalBase / (1 - percentualDescontoPlano)
        : valorMensalBase;
      valorAnualOriginal = valorMensalOriginal * 12;
      valorAnualComDesconto = valorMensalComDesconto * 12;
    }
  } else {
    // Plano anual
    valorAnualOriginal = plano.valor_total || plano.valor;
    valorAnualComDesconto = percentualDescontoPlano > 0 && valorAnualOriginal
      ? valorAnualOriginal * (1 - percentualDescontoPlano)
      : plano.valor;

    valorMensalOriginal = valorAnualOriginal / 12;
    valorMensalComDesconto = valorAnualComDesconto / 12;
  }

  // Arredondar para baixo em 2 casas para evitar 29,93 → 29,92
  valorMensalOriginal = arredondarParaBaixo2(valorMensalOriginal);
  valorMensalComDesconto = arredondarParaBaixo2(valorMensalComDesconto);
  valorAnualOriginal = arredondarParaBaixo2(valorAnualOriginal);
  valorAnualComDesconto = arredondarParaBaixo2(valorAnualComDesconto);
  
  console.log('=== VALORES CALCULADOS ===');
  console.log('valorAnualComDesconto:', valorAnualComDesconto, '→ Deveria ser 239,40');
  console.log('valorAnualOriginal:', valorAnualOriginal, '→ Deveria ser 478,80');
  console.log('valorMensalComDesconto:', valorMensalComDesconto, '→ Deveria ser 19,95');
  console.log('valorMensalOriginal:', valorMensalOriginal, '→ Deveria ser 39,90');
  
  // Verificar se há desconto no plano
  const valorOriginal = isPlanoMensal ? valorMensalOriginal : valorAnualOriginal;
  const valorComDesconto = isPlanoMensal ? valorMensalComDesconto : valorAnualComDesconto;
  const temDescontoPlano = percentualDescontoPlano > 0 || (plano.valor_total && plano.valor_total > plano.valor);
  
  // Usar desconto_percentual do banco ou calcular
  const percentualDesconto = plano.desconto_percentual || (temDescontoPlano && valorOriginal > 0
    ? Math.round(((valorOriginal - valorComDesconto) / valorOriginal) * 100)
    : 0);
  
  // Se houver cupom aplicado, calcular sobre o valor correto do plano (mensal ou anual)
  const valorBaseParaCupom = isPlanoMensal ? valorMensalComDesconto : valorAnualComDesconto;
  const valorFinalComCupom = cupomAplicado && cupomAplicado.valorComDesconto 
    ? cupomAplicado.valorComDesconto / 100 
    : valorBaseParaCupom;
  
  const valorFormatadoAnualOriginal = `R$ ${valorAnualOriginal.toFixed(2).replace('.', ',')}`;
  const valorFormatadoAnualComDesconto = `R$ ${valorAnualComDesconto.toFixed(2).replace('.', ',')}`;
  const valorFormatadoMensalOriginal = `R$ ${valorMensalOriginal.toFixed(2).replace('.', ',')}`;
  const valorFormatadoMensalComDesconto = `R$ ${valorMensalComDesconto.toFixed(2).replace('.', ',')}`;
  const valorFormatadoFinal = `R$ ${valorFinalComCupom.toFixed(2).replace('.', ',')}`;
  // Usar o valor correto baseado no período do plano para o amount
  const valorParaAmount = isPlanoMensal ? valorMensalComDesconto : valorAnualComDesconto;
  const amount = Math.round(valorParaAmount * 100); // Converter para centavos

  const options = {
    mode: 'payment' as const,
    amount,
    currency: 'brl' as const,
  };

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-header">
          <button onClick={() => window.location.href = '/'} className="btn-voltar-link">
            ← Voltar ao plano
          </button>
          <h1>Finalizar Assinatura</h1>
          <div className="checkout-resumo">
            <p><strong>Plano:</strong> {plano.nome}</p>
            {cupomAplicado && cupomAplicado.valorComDesconto ? (
              <>
                {/* Com cupom: mostrar valor original do plano, valor com desconto do plano, e desconto do cupom */}
                {temDescontoPlano && (
                  <>
                    <p style={{ textDecoration: 'line-through', opacity: 0.7, marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                      <strong>Valor original:</strong> {isPlanoMensal ? `${valorFormatadoMensalOriginal}/mês` : `${valorFormatadoAnualOriginal} / ano`}
                    </p>
                    <p style={{ textDecoration: 'line-through', opacity: 0.7, marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                      <strong>Valor com desconto do plano:</strong> {isPlanoMensal ? `${valorFormatadoMensalComDesconto}/mês` : `${valorFormatadoAnualComDesconto} / ano`}
                    </p>
                  </>
                )}
                <p style={{ color: '#4CAF50', fontSize: '1.1rem', fontWeight: 'bold' }}>
                  <strong>Valor final (com cupom):</strong> {isPlanoMensal ? `R$ ${valorFinalComCupom.toFixed(2).replace('.', ',')}/mês` : `${valorFormatadoFinal} / ano`}
                </p>
                <p style={{ color: 'var(--cor-primaria, #FF6B35)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                  <strong>Desconto do cupom:</strong> {cupomAplicado.tipo === 'percentual' ? `${cupomAplicado.desconto}%` : `R$ ${(cupomAplicado.desconto / 100).toFixed(2).replace('.', ',')}`}
                </p>
              </>
            ) : temDescontoPlano ? (
              <>
                {/* Sem cupom, mas com desconto do plano */}
                <p style={{ textDecoration: 'line-through', opacity: 0.7, marginBottom: '0.25rem' }}>
                  <strong>Valor original:</strong> {isPlanoMensal ? `${valorFormatadoMensalOriginal}/mês` : `${valorFormatadoAnualOriginal} / ano`}
                </p>
                <p style={{ color: '#4CAF50', fontSize: '1.1rem', fontWeight: 'bold' }}>
                  <strong>Valor com desconto:</strong> {isPlanoMensal ? `${valorFormatadoMensalComDesconto}/mês` : `${valorFormatadoAnualComDesconto} / ano`}
                </p>
                <p style={{ color: 'var(--cor-primaria, #FF6B35)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                  <strong>Desconto:</strong> {percentualDesconto > 0 ? `${percentualDesconto}% OFF${plano.frase_reforco ? ` (${plano.frase_reforco})` : ''}` : `R$ ${(valorAnualOriginal - valorAnualComDesconto).toFixed(2).replace('.', ',')} OFF${plano.frase_reforco ? ` (${plano.frase_reforco})` : ''}`}
                </p>
              </>
            ) : (
              <p><strong>Valor:</strong> {isPlanoMensal ? `${valorFormatadoMensalComDesconto}/mês` : `${valorFormatadoAnualComDesconto} / ano`}</p>
            )}
          </div>
        </div>

        <Elements stripe={stripePromise} options={options}>
          <CheckoutAssinaturaForm
            amount={amount}
            planoId={plano.id}
            onCupomAplicado={setCupomAplicado}
            valorAnualComDesconto={valorAnualComDesconto}
            valorMensalComDesconto={valorMensalComDesconto}
            isPlanoMensal={isPlanoMensal}
          />
        </Elements>
      </div>
    </div>
  );
};

export default CheckoutAssinatura;

