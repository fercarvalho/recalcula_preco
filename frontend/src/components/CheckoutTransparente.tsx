import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import './CheckoutTransparente.css';

// Carregar Stripe com sua chave pública
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || '';
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

interface CheckoutTransparenteProps {
  amount: number; // Valor em centavos (ex: 10000 = R$ 100,00)
  userId: number;
  planoId: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const CheckoutForm = ({ amount, userId, planoId, onSuccess, onError }: CheckoutTransparenteProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<string>('dark');

  // Detectar tema atual e escutar mudanças
  useEffect(() => {
    const updateTheme = () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      setTheme(currentTheme);
    };

    updateTheme();

    // Observar mudanças no atributo data-theme
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    return () => observer.disconnect();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Criar Payment Intent no backend
      const API_BASE = import.meta.env.VITE_API_BASE || window.location.origin;
      const token = localStorage.getItem('calculadora_auth_token');
      
      const response = await fetch(`${API_BASE}/api/stripe/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          userId,
          planoId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro ao criar intenção de pagamento' }));
        throw new Error(errorData.error || 'Erro ao criar intenção de pagamento');
      }

      const { clientSecret } = await response.json();

      // 2. Confirmar pagamento com Stripe
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Elemento de cartão não encontrado');
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              // Adicionar dados do usuário se necessário
            },
          },
        }
      );

      if (confirmError) {
        setError(confirmError.message || 'Erro ao processar pagamento');
        onError(confirmError.message || 'Erro ao processar pagamento');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Pagamento bem-sucedido - confirmar e salvar no backend
        try {
          const confirmResponse = await fetch(`${API_BASE}/api/stripe/confirmar-pagamento`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              paymentIntentId: paymentIntent.id,
            }),
          });

          if (!confirmResponse.ok) {
            const errorData = await confirmResponse.json().catch(() => ({ error: 'Erro ao confirmar pagamento' }));
            throw new Error(errorData.error || 'Erro ao confirmar pagamento');
          }

          // Pagamento confirmado e salvo com sucesso
          onSuccess();
        } catch (confirmErr: any) {
          const errorMessage = confirmErr.message || 'Erro ao confirmar pagamento';
          setError(errorMessage);
          onError(errorMessage);
        }
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao processar pagamento';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isDarkTheme = theme === 'dark';

  return (
    <form onSubmit={handleSubmit} className="checkout-form">
      <div className="form-group">
        <label>Informações do Cartão</label>
        <div className="card-element-wrapper">
          <CardElement
            options={{
              hidePostalCode: true,
              style: {
                base: {
                  fontSize: '16px',
                  color: isDarkTheme ? '#ffffff' : '#424770',
                  backgroundColor: 'transparent',
                  '::placeholder': {
                    color: isDarkTheme ? 'rgba(255, 255, 255, 0.4)' : '#aab7c4',
                  },
                },
                invalid: {
                  color: '#ff6b6b',
                },
              },
            }}
          />
        </div>
      </div>

      {error && (
        <div className="error-message" style={{ color: '#d32f2f', marginTop: '1rem' }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="btn-primary"
        style={{ width: '100%', marginTop: '1rem' }}
      >
        {loading ? 'Processando...' : `Pagar R$ ${(amount / 100).toFixed(2).replace('.', ',')}`}
      </button>
    </form>
  );
};

const CheckoutTransparente = (props: CheckoutTransparenteProps) => {
  const [stripeError, setStripeError] = useState<string | null>(null);

  useEffect(() => {
    if (!stripePublicKey || stripePublicKey.trim() === '') {
      setStripeError('Chave pública do Stripe não configurada. Configure VITE_STRIPE_PUBLIC_KEY no arquivo .env');
    } else if (!stripePromise) {
      setStripeError('Erro ao carregar Stripe. Verifique se a chave pública está correta.');
    }
  }, []);

  if (stripeError) {
    return (
      <div style={{ padding: '1rem', backgroundColor: '#ffebee', border: '1px solid #d32f2f', borderRadius: '8px', color: '#d32f2f' }}>
        <strong>Erro de Configuração:</strong>
        <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>{stripeError}</p>
      </div>
    );
  }

  if (!stripePromise) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center' }}>
        <p>Carregando formulário de pagamento...</p>
      </div>
    );
  }

  const options = {
    mode: 'payment' as const,
    amount: props.amount,
    currency: 'brl' as const,
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm {...props} />
    </Elements>
  );
};

export default CheckoutTransparente;

