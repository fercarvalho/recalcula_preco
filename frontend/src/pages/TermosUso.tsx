import './TermosUso.css';
import TermosUsoContent from '../components/TermosUsoContent';

const TermosUso = () => {
  return (
    <div className="termos-uso-page">
      <div className="termos-uso-container">
        <header className="termos-uso-header">
          <h1>Termos de Uso</h1>
          <p className="termos-uso-data">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
        </header>

        <TermosUsoContent />

        <footer className="termos-uso-footer">
          <button 
            onClick={() => window.location.href = '/'} 
            className="termos-uso-btn-voltar"
          >
            Voltar para o Início
          </button>
        </footer>
      </div>
    </div>
  );
};

export default TermosUso;

