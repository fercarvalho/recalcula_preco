import './PoliticaPrivacidade.css';
import PoliticaPrivacidadeContent from '../components/PoliticaPrivacidadeContent';

const PoliticaPrivacidade = () => {
  return (
    <div className="politica-privacidade-page">
      <div className="politica-privacidade-container">
        <header className="politica-privacidade-header">
          <h1>Política de Privacidade</h1>
          <p className="politica-privacidade-data">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
        </header>

        <PoliticaPrivacidadeContent />

        <footer className="politica-privacidade-footer">
          <button 
            onClick={() => window.location.href = '/'} 
            className="politica-privacidade-btn-voltar"
          >
            Voltar para o Início
          </button>
        </footer>
      </div>
    </div>
  );
};

export default PoliticaPrivacidade;
