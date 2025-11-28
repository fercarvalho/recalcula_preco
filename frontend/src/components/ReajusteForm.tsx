import type { TipoReajuste } from '../types';
import { FaUndo } from 'react-icons/fa';
import './ReajusteForm.css';

interface ReajusteFormProps {
  tipoReajuste: TipoReajuste;
  valorReajuste: string;
  onTipoReajusteChange: (tipo: TipoReajuste) => void;
  onValorReajusteChange: (valor: string) => void;
  onSelecionarTodos: () => void;
  onDeselecionarTodos: () => void;
  onAplicarReajuste: () => void;
  onResetarValores: () => void;
  temAcesso?: boolean;
  onAbrirModalPlanos?: () => void;
}

const ReajusteForm = ({
  tipoReajuste,
  valorReajuste,
  onTipoReajusteChange,
  onValorReajusteChange,
  onSelecionarTodos,
  onDeselecionarTodos,
  onAplicarReajuste,
  onResetarValores,
  temAcesso = true,
  onAbrirModalPlanos,
}: ReajusteFormProps) => {
  const handleAplicarReajuste = () => {
    if (!temAcesso) {
      onAbrirModalPlanos?.();
      return;
    }
    onAplicarReajuste();
  };

  const handleResetarValores = () => {
    if (!temAcesso) {
      onAbrirModalPlanos?.();
      return;
    }
    onResetarValores();
  };

  return (
    <section className="reajuste-form">
      <h2>Configuração do Reajuste</h2>
      {!temAcesso && (
        <div style={{
          padding: '15px',
          background: '#fff3cd',
          border: '2px solid #ffc107',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center',
        }}>
          <p style={{ margin: '0 0 10px 0', color: '#856404', fontWeight: '600' }}>
            🔒 Reajuste de preços bloqueado
          </p>
          <button
            onClick={() => onAbrirModalPlanos?.()}
            style={{
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.95em',
              fontWeight: 'bold',
              transition: 'all 0.3s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#45a049';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#4CAF50';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Clique para liberar acesso
          </button>
        </div>
      )}
      <div className="form-group">
        <label>Tipo de Reajuste:</label>
        <div className="radio-group">
          <label className="radio-label">
            <input
              type="radio"
              name="tipo-reajuste"
              value="fixo"
              checked={tipoReajuste === 'fixo'}
              onChange={(e) => onTipoReajusteChange(e.target.value as TipoReajuste)}
              disabled={!temAcesso}
            />
            <span>Valor Fixo (R$)</span>
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="tipo-reajuste"
              value="percentual"
              checked={tipoReajuste === 'percentual'}
              onChange={(e) => onTipoReajusteChange(e.target.value as TipoReajuste)}
              disabled={!temAcesso}
            />
            <span>Percentual (%)</span>
          </label>
        </div>
      </div>
      <div className="form-group" style={{ display: tipoReajuste === 'fixo' ? 'block' : 'none' }}>
        <label htmlFor="valor-reajuste-fixo">Valor Fixo (R$):</label>
        <input
          type="number"
          id="valor-reajuste-fixo"
          step="0.01"
          min="0"
          placeholder="0,00"
          value={valorReajuste}
          onChange={(e) => onValorReajusteChange(e.target.value)}
          disabled={!temAcesso}
        />
        <small className="form-help">Será somado ao valor atual</small>
      </div>
      <div className="form-group" style={{ display: tipoReajuste === 'percentual' ? 'block' : 'none' }}>
        <label htmlFor="valor-reajuste-percentual">Percentual (%):</label>
        <input
          type="number"
          id="valor-reajuste-percentual"
          step="0.01"
          min="0"
          placeholder="0,00"
          value={valorReajuste}
          onChange={(e) => onValorReajusteChange(e.target.value)}
          disabled={!temAcesso}
        />
        <small className="form-help">Será aplicado sobre o valor atual</small>
      </div>
      <div className="form-actions">
        <button onClick={onSelecionarTodos} className="btn-secondary" disabled={!temAcesso}>
          Selecionar Todos
        </button>
        <button onClick={onDeselecionarTodos} className="btn-secondary" disabled={!temAcesso}>
          Deselecionar Todos
        </button>
        <button 
          onClick={handleAplicarReajuste} 
          className="btn-primary"
          disabled={!temAcesso}
          style={!temAcesso ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
        >
          Aplicar Reajuste
        </button>
        <button 
          onClick={handleResetarValores} 
          className="btn-secondary" 
          title="Resetar todos os valores para os padrões"
          disabled={!temAcesso}
          style={!temAcesso ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
        >
          <FaUndo /> Resetar Valores
        </button>
      </div>
    </section>
  );
};

export default ReajusteForm;

