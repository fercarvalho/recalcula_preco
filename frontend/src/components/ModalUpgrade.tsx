import { useState, useEffect, lazy, Suspense } from 'react';
import Modal from './Modal';
import { apiService } from '../services/api';
import { getUser } from '../services/auth';
import { mostrarAlert } from '../utils/modals';
import './ModalUpgrade.css';

// Lazy load do CheckoutTransparente para evitar carregar quando não necessário
const CheckoutTransparente = lazy(() => import('./CheckoutTransparente'));

interface ModalUpgradeProps {
  isOpen: boolean;
  onClose: () => void;
}

const ModalUpgrade = ({ isOpen, onClose }: ModalUpgradeProps) => {
  const [planos, setPlanos] = useState<Array<{
    id: number;
    nome: string;
    valor: number;
    stripe_price_id: string | null;
  }>>([]);
  const [planoSelecionado, setPlanoSelecionado] = useState<number | null>(null);
  const [pagamentoProcessado, setPagamentoProcessado] = useState(false);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (isOpen) {
      carregarPlanos();
      setPagamentoProcessado(false);
      setPlanoSelecionado(null);
    }
  }, [isOpen]);

  const carregarPlanos = async () => {
    try {
      const planosCarregados = await apiService.obterPlanos();
      // Filtrar apenas planos ativos e com stripe_price_id
      const planosDisponiveis = planosCarregados
        .filter(p => p.ativo && p.stripe_price_id)
        .map(p => ({
          id: p.id,
          nome: p.nome,
          valor: p.valor,
          stripe_price_id: p.stripe_price_id
        }));
      setPlanos(planosDisponiveis);
      
      // Selecionar o primeiro plano por padrão
      if (planosDisponiveis.length > 0) {
        setPlanoSelecionado(planosDisponiveis[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      mostrarAlert('Erro', 'Erro ao carregar planos disponíveis.');
    }
  };

  const handleSuccess = async () => {
    setPagamentoProcessado(true);
    await mostrarAlert('Sucesso', 'Pagamento processado com sucesso!');
    // Recarregar dados do usuário ou redirecionar
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  const handleError = async (error: string) => {
    await mostrarAlert('Erro', error);
  };

  const planoAtual = planos.find(p => p.id === planoSelecionado);
  const user = getUser();

  if (pagamentoProcessado) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Pagamento Realizado" size="medium">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h3 style={{ color: '#4CAF50', marginBottom: '1rem' }}>✅ Pagamento realizado com sucesso!</h3>
          <p>Você já tem acesso ao plano {planoAtual?.nome}.</p>
          <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
            A página será recarregada em instantes...
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Teste - Checkout Transparente"
      size="medium"
    >
      <div className="modal-upgrade-content">
        {planos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Carregando planos...</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Selecione um plano para testar:
              </label>
              <select
                value={planoSelecionado || ''}
                onChange={(e) => setPlanoSelecionado(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              >
                {planos.map(plano => (
                  <option key={plano.id} value={plano.id}>
                    {plano.nome} - R$ {plano.valor.toFixed(2).replace('.', ',')}
                  </option>
                ))}
              </select>
            </div>

            {planoAtual && user && (
              <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                <p><strong>Plano selecionado:</strong> {planoAtual.nome}</p>
                <p><strong>Valor:</strong> R$ {planoAtual.valor.toFixed(2).replace('.', ',')}</p>
                <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                  💡 <strong>Modo de teste:</strong> Use o cartão de teste <code>4242 4242 4242 4242</code> com qualquer data futura e CVC qualquer.
                </p>
              </div>
            )}

            {planoAtual && user && (
              <Suspense fallback={<div style={{ textAlign: 'center', padding: '2rem' }}>Carregando formulário de pagamento...</div>}>
                <CheckoutTransparente
                  amount={Math.round(planoAtual.valor * 100)} // Converter para centavos
                  userId={user.id}
                  planoId={planoAtual.id}
                  onSuccess={handleSuccess}
                  onError={handleError}
                />
              </Suspense>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default ModalUpgrade;

