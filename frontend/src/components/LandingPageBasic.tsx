import { FaCalculator, FaRocket, FaPalette, FaChartLine, FaHeart } from 'react-icons/fa';
import ThemeToggle from './ThemeToggle';
import './LandingPage.css';

const LandingPageBasic = ({ onStartClick }: { onStartClick: () => void }) => {
  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-header-first-line">
          <div className="landing-logo">
            <img src="/logo_nova.png" alt="Logo" />
            <span>Recalcula Preço</span>
          </div>
          <div className="landing-header-buttons">
            <button onClick={onStartClick} className="btn-login-header">Começar Demo</button>
          </div>
        </div>
        <nav className="landing-nav">
          <a href="#sobre" onClick={(e) => {
            e.preventDefault();
            document.getElementById('sobre')?.scrollIntoView({ behavior: 'smooth' });
          }}>Sobre</a>
          <a href="#funcionalidades" onClick={(e) => {
            e.preventDefault();
            document.getElementById('funcionalidades')?.scrollIntoView({ behavior: 'smooth' });
          }}>Funcionalidades</a>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Reajuste seus preços de forma <span className="highlight">inteligente e rápida</span>
            </h1>
            <p className="hero-subtitle">
              A ferramenta completa para restaurantes e lanchonetes gerenciarem seus cardápios e aplicarem reajustes de preços automaticamente, considerando as taxas das plataformas de delivery.
            </p>
            <div className="hero-cta">
              <button onClick={onStartClick} className="btn-hero-primary">
                Começar agora
              </button>
              <button onClick={onStartClick} className="btn-hero-secondary">
                Ver demonstração
              </button>
            </div>
          </div>
          <div className="hero-image">
            <div className="hero-mockup">
              <FaCalculator className="hero-icon" />
            </div>
          </div>
        </div>
      </section>

      {/* Sobre Section */}
      <section id="sobre" className="sobre-section">
        <div className="container">
          <h2 className="section-title">Por que criamos este sistema?</h2>
          <div className="sobre-content">
            <div className="sobre-text">
              <p className="sobre-intro">
                Prazer, me chamo <strong>Fernando Carvalho</strong> e a Recalcula Preço nasceu de uma necessidade real: 
                a dificuldade de gerenciar preços em múltiplas plataformas de delivery.
              </p>
              <p>
                Este sistema foi criado inicialmente para a <strong>lanchonete Vira-Latas</strong>, localizada em <strong>Tupã, interior de São Paulo</strong>, 
                estabelecimento do meu pai. Ao observar as dificuldades que ele enfrentava no dia a dia, percebi um problema comum a muitos empreendedores do setor.
              </p>
              <p>
                Cada plataforma de delivery cobra taxas diferentes e calcula percentuais de formas distintas. Isso torna extremamente difícil para o dono de restaurante 
                ou lanchonete criar uma estratégia de preços harmoniosa, que funcione em todas as plataformas sem gerar prejuízo ou desequilíbrio financeiro.
              </p>
              <p>
                Ao ver essa dor de perto, decidi criar uma solução que tornasse esse processo <strong>mais fácil, mais leve e mais prático</strong>. 
                O sistema foi testado e validado na prática, comprovando que realmente resolve essa necessidade.
              </p>
              <p className="sobre-conclusao">
                Este sistema foi feito com <strong>muito amor</strong> por mim, como uma homenagem aos meus pais. Através de trabalho duro, muito esforço e suor, 
                eles conseguiram me criar e me tornar um ser humano funcional. <strong>Aos meus pais, muito obrigado.</strong>
              </p>
              <p className="sobre-conclusao-final">
                E a você, espero que este sistema, assim como foi para eles, torne sua vida mais fácil. 
                <br />
                <strong style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Um abraço! <FaHeart />
                </strong>
                <br />
                <span className="sobre-assinatura" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Te vejo do outro lado! <FaRocket />
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Funcionalidades Section */}
      <section id="funcionalidades" className="funcionalidades-section">
        <div className="container">
          <h2 className="section-title">Funcionalidades</h2>
          <div className="beneficios-grid">
            <div className="beneficio-card">
              <div className="beneficio-icon">
                <FaCalculator />
              </div>
              <h3>Reajuste de Preços</h3>
              <p>Reajuste por valor fixo ou percentual em múltiplos produtos de uma vez</p>
            </div>
            <div className="beneficio-card">
              <div className="beneficio-icon">
                <FaChartLine />
              </div>
              <h3>Gestão de Produtos</h3>
              <p>Organize produtos por categorias e gerencie seus preços de forma eficiente</p>
            </div>
            <div className="beneficio-card">
              <div className="beneficio-icon">
                <FaPalette />
              </div>
              <h3>Personalização</h3>
              <p>Customize as cores do sistema conforme sua preferência e identidade visual</p>
            </div>
            <div className="beneficio-card">
              <div className="beneficio-icon">
                <FaRocket />
              </div>
              <h3>Plataformas de Delivery</h3>
              <p>Calcule preços considerando taxas de plataformas de delivery automaticamente</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final Section */}
      <section className="cta-final-section">
        <div className="container">
          <div className="cta-final-content">
            <FaRocket className="cta-icon" />
            <h2>Pronto para começar a reajustar seus preços?</h2>
            <p style={{ marginBottom: '20px' }}>
              ⚠️ <strong>Versão Demo</strong> - Todos os dados serão perdidos ao fechar o navegador
            </p>
            <button onClick={onStartClick} className="btn-cta-final">
              Começar agora
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h4>Recalcula Preço</h4>
              <p>Ferramenta demo para calcular reajustes de preços</p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 Recalcula Preço. Versão Demo. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      <ThemeToggle variant="floating" />
    </div>
  );
};

export default LandingPageBasic;
