import React from 'react';
import { FaCalculator, FaRocket, FaPalette, FaChartLine } from 'react-icons/fa';
import './LandingPage.css';

const LandingPageBasic = ({ onStartClick }: { onStartClick: () => void }) => {
  return (
    <div className="landing-page-basic" style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--cor-fundo)',
      color: 'var(--cor-texto)',
    }}>
      <header className="landing-header" style={{
        padding: '60px 20px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, var(--cor-primaria) 0%, rgba(255, 107, 53, 0.8) 100%)',
      }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <img src="/logo_nova.png" alt="Logo" style={{ maxWidth: '200px', marginBottom: '20px' }} />
          <h1 style={{ fontSize: '3rem', margin: '0 0 10px 0', color: '#fff' }}>Calculadora de Reajuste</h1>
          <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.9)' }}>Ferramenta demo para calcular reajustes de preços</p>
        </div>
      </header>

      <section className="features" style={{
        padding: '80px 20px',
        flex: 1,
      }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ 
            textAlign: 'center', 
            fontSize: '2.5rem', 
            marginBottom: '50px',
            color: 'var(--cor-texto)',
          }}>
            Funcionalidades
          </h2>
          <div className="features-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '30px',
          }}>
            <div className="feature-card" style={{
              background: 'var(--cor-card-fundo)',
              padding: '30px',
              borderRadius: '12px',
              textAlign: 'center',
              border: '1px solid var(--cor-borda)',
            }}>
              <FaCalculator style={{ fontSize: '3rem', color: 'var(--cor-primaria)', marginBottom: '20px' }} />
              <h3 style={{ margin: '0 0 15px 0', color: 'var(--cor-texto)' }}>Reajuste de Preços</h3>
              <p style={{ margin: 0, color: 'var(--cor-texto-secundario)' }}>Reajuste por valor fixo ou percentual em múltiplos produtos</p>
            </div>
            <div className="feature-card" style={{
              background: 'var(--cor-card-fundo)',
              padding: '30px',
              borderRadius: '12px',
              textAlign: 'center',
              border: '1px solid var(--cor-borda)',
            }}>
              <FaChartLine style={{ fontSize: '3rem', color: 'var(--cor-primaria)', marginBottom: '20px' }} />
              <h3 style={{ margin: '0 0 15px 0', color: 'var(--cor-texto)' }}>Gestão de Produtos</h3>
              <p style={{ margin: 0, color: 'var(--cor-texto-secundario)' }}>Organize produtos por categorias e gerencie seus preços</p>
            </div>
            <div className="feature-card" style={{
              background: 'var(--cor-card-fundo)',
              padding: '30px',
              borderRadius: '12px',
              textAlign: 'center',
              border: '1px solid var(--cor-borda)',
            }}>
              <FaPalette style={{ fontSize: '3rem', color: 'var(--cor-primaria)', marginBottom: '20px' }} />
              <h3 style={{ margin: '0 0 15px 0', color: 'var(--cor-texto)' }}>Personalização</h3>
              <p style={{ margin: 0, color: 'var(--cor-texto-secundario)' }}>Customize as cores do sistema conforme sua preferência</p>
            </div>
            <div className="feature-card" style={{
              background: 'var(--cor-card-fundo)',
              padding: '30px',
              borderRadius: '12px',
              textAlign: 'center',
              border: '1px solid var(--cor-borda)',
            }}>
              <FaRocket style={{ fontSize: '3rem', color: 'var(--cor-primaria)', marginBottom: '20px' }} />
              <h3 style={{ margin: '0 0 15px 0', color: 'var(--cor-texto)' }}>Plataformas</h3>
              <p style={{ margin: 0, color: 'var(--cor-texto-secundario)' }}>Calcule preços considerando taxas de plataformas de delivery</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta" style={{
        padding: '80px 20px',
        textAlign: 'center',
        background: 'var(--cor-card-fundo)',
      }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ 
            fontSize: '2.5rem', 
            marginBottom: '20px',
            color: 'var(--cor-texto)',
          }}>
            Comece a usar agora
          </h2>
          <p style={{ 
            color: '#ffd966', 
            marginBottom: '30px',
            fontSize: '1.1rem',
          }}>
            ⚠️ Versão Demo - Todos os dados serão perdidos ao fechar o navegador
          </p>
          <button 
            onClick={onStartClick} 
            className="btn-primary"
            style={{
              padding: '15px 40px',
              fontSize: '1.2rem',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--cor-primaria)',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Começar Demo
          </button>
        </div>
      </section>

      <footer className="landing-footer" style={{
        padding: '30px 20px',
        textAlign: 'center',
        borderTop: '1px solid var(--cor-borda)',
        color: 'var(--cor-texto-secundario)',
      }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p style={{ margin: 0 }}>&copy; 2025 Calculadora de Reajuste. Versão Demo.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPageBasic;

