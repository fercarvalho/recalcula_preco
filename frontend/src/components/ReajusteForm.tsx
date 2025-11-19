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
}: ReajusteFormProps) => {
  return (
    <section className="reajuste-form">
      <h2>Configuração do Reajuste</h2>
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
        />
        <small className="form-help">Será aplicado sobre o valor atual</small>
      </div>
      <div className="form-actions">
        <button onClick={onSelecionarTodos} className="btn-secondary">
          Selecionar Todos
        </button>
        <button onClick={onDeselecionarTodos} className="btn-secondary">
          Deselecionar Todos
        </button>
        <button onClick={onAplicarReajuste} className="btn-primary">
          Aplicar Reajuste
        </button>
        <button onClick={onResetarValores} className="btn-secondary" title="Resetar todos os valores para os padrões">
          <FaUndo /> Resetar Valores
        </button>
      </div>
    </section>
  );
};

export default ReajusteForm;

