import { useState } from 'react';
import { FaCheck, FaChevronDown, FaChevronUp, FaCalculator, FaChartLine, FaMobileAlt, FaShieldAlt, FaSync, FaUsers, FaRocket, FaQrcode, FaMoneyBillWave, FaFileAlt, FaWhatsapp } from 'react-icons/fa';
import RegistroModal from './RegistroModal';
import './LandingPage.css';

const LandingPage = ({ onLoginClick }: { onLoginClick: () => void }) => {
  const [showRegistro, setShowRegistro] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setFaqOpen(faqOpen === index ? null : index);
  };

  const handlePlanoAnual = () => {
    // Redirecionar para login
    onLoginClick();
  };

  const handlePlanoUnico = () => {
    // Redirecionar para login
    onLoginClick();
  };

  const faqs = [
    {
      pergunta: 'Como funciona a Recalcula Preço?',
      resposta: 'A Recalcula Preço é uma ferramenta completa para gerenciar seus produtos e aplicar reajustes de preços de forma automática. Você cadastra seus produtos por categoria, define os preços e pode aplicar reajustes fixos ou percentuais em massa. O sistema também calcula automaticamente os preços ajustados considerando as taxas das plataformas de delivery.'
    },
    {
      pergunta: 'Preciso instalar algum aplicativo?',
      resposta: 'Não! Tudo funciona diretamente no navegador. Basta criar sua conta e começar a usar imediatamente. Seus dados ficam salvos na nuvem e você pode acessar de qualquer dispositivo.'
    },
    {
      pergunta: 'Como cancelar minha assinatura?',
      resposta: 'O cancelamento pode ser feito a qualquer momento através do seu painel de usuário. Não há multas ou taxas de cancelamento. Você continuará tendo acesso até o final do período pago.'
    },
    {
      pergunta: 'O que diferencia esta calculadora de outras ferramentas?',
      resposta: 'Nossa calculadora foi desenvolvida especificamente para restaurantes e lanchonetes. Ela entende as necessidades do seu negócio: cálculo automático de preços com taxas de plataformas, reajustes em massa, organização por categorias e muito mais. Tudo de forma simples e intuitiva.'
    },
    {
      pergunta: 'Quais recursos estão incluídos no plano?',
      resposta: 'Com o plano anual você tem acesso ilimitado a todas as funcionalidades: cadastro ilimitado de produtos, reajustes automáticos, cálculo de preços com taxas de plataformas, organização por categorias, backup automático dos valores e muito mais.'
    },
    {
      pergunta: 'Para quem é a Recalcula Preço?',
      resposta: 'É ideal para restaurantes, lanchonetes, food trucks e qualquer estabelecimento que precise gerenciar cardápios e aplicar reajustes de preços de forma eficiente. Perfeito para quem trabalha com delivery e precisa calcular preços considerando as taxas das plataformas.'
    },
    {
      pergunta: 'Posso testar antes de assinar?',
      resposta: 'Sim! Você pode criar uma conta gratuita e testar o sistema. No modo trial, você pode criar categorias e produtos, mas algumas funcionalidades avançadas como reajustes automáticos e visualização de preços com taxas requerem assinatura.'
    },
    {
      pergunta: 'Meus dados estão seguros?',
      resposta: 'Sim! Utilizamos criptografia e seguimos as melhores práticas de segurança. Seus dados são armazenados de forma segura e não compartilhamos informações com terceiros.'
    }
  ];

  const beneficios = [
    {
      icone: <FaCalculator />,
      titulo: 'Reajustes Automáticos',
      descricao: 'Aplique reajustes fixos ou percentuais em todos os seus produtos de uma vez, economizando horas de trabalho manual.'
    },
    {
      icone: <FaChartLine />,
      titulo: 'Cálculo com Taxas de Plataformas',
      descricao: 'Veja automaticamente como ficam seus preços nas principais plataformas de delivery, considerando as taxas de cada uma.'
    },
    {
      icone: <FaMobileAlt />,
      titulo: 'Acesso de Qualquer Lugar',
      descricao: 'Acesse sua calculadora de qualquer dispositivo, a qualquer momento. Seus dados ficam sincronizados na nuvem.'
    },
    {
      icone: <FaShieldAlt />,
      titulo: 'Backup Automático',
      descricao: 'Seus valores originais são salvos automaticamente. Você pode reverter reajustes quando quiser, sem perder dados.'
    },
    {
      icone: <FaSync />,
      titulo: 'Organização por Categorias',
      descricao: 'Organize seus produtos em categorias personalizadas e gerencie tudo de forma visual e intuitiva.'
    },
    {
      icone: <FaUsers />,
      titulo: 'Fácil de Usar',
      descricao: 'Interface simples e intuitiva. Você não precisa ser expert em planilhas ou sistemas complexos para usar.'
    }
  ];

  const roadmapItens = [
    {
      icone: <FaQrcode />,
      titulo: 'Pagamentos via PIX avançados',
      descricao: 'Estamos preparando uma experiência completa de pagamento: PIX para o acesso único, pagamento à vista do plano anual, pagamento à vista do anual via PIX e PIX parcelado para facilitar ainda mais a sua assinatura.'
    },
    {
      icone: <FaMoneyBillWave />,
      titulo: 'Pagamento à vista do plano anual',
      descricao: 'Além das parcelas mensais, você poderá garantir o plano anual com pagamento à vista, com condições diferenciadas e pensado para quem quer resolver tudo de uma vez.'
    },
    {
      icone: <FaCalculator />,
      titulo: 'PIX no plano anual (à vista e parcelado)',
      descricao: 'Para quem ama PIX, o plano anual também poderá ser pago com PIX à vista ou em formato parcelado, mantendo a segurança e a praticidade que você já conhece.'
    },
    {
      icone: <FaMobileAlt />,
      titulo: 'Modo Cardápio',
      descricao: 'Um modo especial para exibir seus produtos e preços como um cardápio digital, ideal para mostrar no estabelecimento ou compartilhar online com seus clientes.'
    },
    {
      icone: <FaFileAlt />,
      titulo: 'Compartilhamento de Cardápio',
      descricao: 'Gere seu cardápio em PDF ou PNG em poucos cliques e compartilhe facilmente em redes sociais, impressos ou com seu time.'
    },
    {
      icone: <FaWhatsapp />,
      titulo: 'Integração com WhatsApp',
      descricao: 'Uma área dedicada para você conectar seus cardápios e ofertas diretamente ao WhatsApp, facilitando o contato com seus clientes e o fechamento de pedidos.'
    }
  ];

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-header-content">
          <div className="landing-logo">
            <img src="/logo_nova.png" alt="Logo" />
            <span>Recalcula Preço</span>
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
            <a href="#roadmap" onClick={(e) => {
              e.preventDefault();
              document.getElementById('roadmap')?.scrollIntoView({ behavior: 'smooth' });
            }}>O que vem por aí</a>
            <a href="#planos" onClick={(e) => {
              e.preventDefault();
              document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' });
            }}>Planos</a>
            <a href="#faq" onClick={(e) => {
              e.preventDefault();
              document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
            }}>FAQ</a>
            <button onClick={onLoginClick} className="btn-login-header">Login</button>
            <button onClick={(e) => {
              e.preventDefault();
              document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' });
            }} className="btn-assinar-header">Assinar agora</button>
          </nav>
        </div>
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
              <button onClick={(e) => {
                e.preventDefault();
                document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' });
              }} className="btn-hero-primary">
                Começar agora
              </button>
              <button onClick={() => setShowRegistro(true)} className="btn-hero-secondary">
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

      {/* Nossa História / Por que existe */}
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
              <p>
                Por isso, resolvi disponibilizar esta ferramenta por um <strong>preço acessível e justo</strong>, para ajudar todos os donos de lanchonetes e restaurantes 
                que enfrentam a mesma dificuldade: gerenciar diferentes preços em diferentes plataformas de delivery de forma <strong>justa, democrática, de fácil entendimento</strong>, 
                tornando esse processo mais <strong>rápido, habitual e eficiente</strong>.
              </p>
              <p className="sobre-conclusao">
                Este sistema foi feito com <strong>muito amor</strong> por mim, como uma homenagem aos meus pais. Através de trabalho duro, muito esforço e suor, 
                eles conseguiram me criar e me tornar um ser humano funcional. <strong>Aos meus pais, muito obrigado.</strong>
              </p>
              <p className="sobre-conclusao-final">
                E a você, espero que este sistema, assim como foi para eles, torne sua vida mais fácil. 
                <br />
                <strong>Um abraço! ❤️</strong>
                <br />
                <span className="sobre-assinatura">Te vejo do outro lado! 🚀</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section id="funcionalidades" className="funcionalidades-section">
        <div className="container">
          <h2 className="section-title">Funcionalidades</h2>
          <div className="beneficios-grid">
            {beneficios.map((beneficio, index) => (
              <div key={index} className="beneficio-card">
                <div className="beneficio-icon">{beneficio.icone}</div>
                <h3>{beneficio.titulo}</h3>
                <p>{beneficio.descricao}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap – O que vem por aí */}
      <section id="roadmap" className="roadmap-section">
        <div className="container">
          <h2 className="section-title">O que vem por aí <span className="roadmap-subtitle">(funcionalidades em desenvolvimento)</span></h2>
          <p className="roadmap-intro">
            Estamos sempre evoluindo a Recalcula Preço para deixar o seu dia a dia ainda mais simples.
            Confira algumas das próximas novidades que estamos preparando para você.
          </p>
          <div className="roadmap-grid">
            {roadmapItens.map((item, index) => (
              <div key={index} className="roadmap-card">
                <div className="roadmap-icon">{item.icone}</div>
                <h3>{item.titulo}</h3>
                <p>{item.descricao}</p>
                <span className="roadmap-tag">Em breve</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integração com o WhatsApp – No Forno */}
      <section id="whatsapp-integracao" className="whatsapp-section">
        <div className="container">
          <h2 className="section-title">
            Integração com Inteligência Artificial <span className="roadmap-subtitle">(pelo WhatsApp) - Em breve (No Forno)</span>
          </h2>
          <p className="whatsapp-intro">
            Estamos preparando uma área especial para conectar sua Recalcula Preço diretamente ao WhatsApp,
            trazendo automações inteligentes para o seu atendimento, cardápio e recebimento de pedidos.
          </p>
          <div className="whatsapp-placeholder">
            <div className="whatsapp-features">
              <div className="whatsapp-feature-card">
                <div className="whatsapp-icon-inline-wrapper">
                  <FaWhatsapp className="whatsapp-icon-inline" />
                </div>
                <h3>Modo Cardápio no WhatsApp</h3>
                <p>
                  Quando o cliente pedir o cardápio, a IA envia automaticamente uma imagem atualizada do seu cardápio direto no WhatsApp,
                  usando os dados cadastrados na Recalcula Preço.
                </p>
              </div>
              <div className="whatsapp-feature-card">
                <div className="whatsapp-icon-inline-wrapper">
                  <FaWhatsapp className="whatsapp-icon-inline" />
                </div>
                <h3>Controle do sistema pelo WhatsApp</h3>
                <p>
                  Você poderá alterar e ajustar informações do sistema conversando com a IA pelo WhatsApp, sem precisar abrir o computador:
                  atualização de preços, categorias e muito mais na palma da mão.
                </p>
              </div>
              <div className="whatsapp-feature-card">
                <div className="whatsapp-icon-inline-wrapper">
                  <FaWhatsapp className="whatsapp-icon-inline" />
                </div>
                <h3>Recebimento de pedidos automatizado</h3>
                <p>
                  A IA vai receber o pedido do seu cliente pelo WhatsApp e encaminhar automaticamente para a impressora do estabelecimento,
                  ajudando a organizar a fila de produção e reduzir erros.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="planos-section">
        <div className="container">
          <h2 className="section-title">Escolha o plano ideal para você</h2>

          <div className="planos-grid-landing">
            {/* Plano Anual */}
            <div className="plano-card-landing plano-destaque-landing">
              <div className="plano-badge-landing">Mais Popular</div>
              <div className="plano-header-landing">
                <h3>Plano Anual</h3>
                <div className="plano-preco-landing">
                  <span className="preco-valor-landing">R$ 19,90</span>
                  <span className="preco-periodo-landing">/mês em 12x</span>
                </div>
                <p className="economia-texto">💰 Total: R$ 238,80 por ano</p>
              </div>
              <ul className="plano-beneficios-landing">
                <li><FaCheck /> Cadastro ilimitado de produtos</li>
                <li><FaCheck /> Reajustes automáticos (fixo ou percentual)</li>
                <li><FaCheck /> Cálculo com taxas de plataformas</li>
                <li><FaCheck /> Organização por categorias</li>
                <li><FaCheck /> Acesso de qualquer dispositivo</li>
                <li><FaCheck /> Backup automático de valores</li>
                <li><FaCheck /> Suporte prioritário</li>
              </ul>
              <button 
                onClick={handlePlanoAnual} 
                className="btn-plano-landing"
              >
                Assinar agora
              </button>
            </div>

            {/* Acesso Único */}
            <div className="plano-card-landing">
              <div className="plano-header-landing">
                <h3>Acesso Único</h3>
                <div className="plano-preco-landing">
                  <span className="preco-valor-landing">R$ 199,00</span>
                  <span className="preco-periodo-landing">pagamento único</span>
                </div>
                <p className="plano-descricao-landing">Acesso por 24 horas</p>
              </div>
              <ul className="plano-beneficios-landing">
                <li><FaCheck /> Cadastro ilimitado de produtos</li>
                <li><FaCheck /> Reajustes automáticos (fixo ou percentual)</li>
                <li><FaCheck /> Cálculo com taxas de plataformas</li>
                <li><FaCheck /> Organização por categorias</li>
                <li><FaCheck /> Acesso de qualquer dispositivo</li>
                <li className="texto-aviso">⚠️ Válido por 24 horas após o pagamento</li>
                <li className="texto-aviso">⚠️ Dados não são salvos permanentemente</li>
              </ul>
              <button 
                onClick={handlePlanoUnico} 
                className="btn-plano-landing btn-plano-secundario"
              >
                Comprar acesso único
              </button>
            </div>
          </div>

          <p className="garantia-texto">7 dias de garantia ou seu dinheiro de volta</p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="faq-section">
        <div className="container">
          <h2 className="section-title">FAQ – Perguntas Frequentes</h2>
          <p className="faq-subtitle">Tudo que você precisa saber sobre a Recalcula Preço</p>
          
          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div key={index} className="faq-item">
                <button
                  className={`faq-question ${faqOpen === index ? 'open' : ''}`}
                  onClick={() => toggleFaq(index)}
                >
                  <span>{faq.pergunta}</span>
                  {faqOpen === index ? <FaChevronUp /> : <FaChevronDown />}
                </button>
                {faqOpen === index && (
                  <div className="faq-answer">
                    <p>{faq.resposta}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="cta-final-section">
        <div className="container">
          <div className="cta-final-content">
            <FaRocket className="cta-icon" />
            <h2>Pronto para começar a reajustar seus preços?</h2>
            <p>Junte-se a centenas de restaurantes que já usam nossa calculadora</p>
            <button onClick={() => setShowRegistro(true)} className="btn-cta-final">
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
              <p>Sua ferramenta completa para gerenciar preços e aplicar reajustes de forma inteligente.</p>
            </div>
            <div className="footer-section">
              <h4>Links</h4>
              <a href="#sobre" onClick={(e) => {
                e.preventDefault();
                document.getElementById('sobre')?.scrollIntoView({ behavior: 'smooth' });
              }}>Sobre</a>
              <a href="#funcionalidades" onClick={(e) => {
                e.preventDefault();
                document.getElementById('funcionalidades')?.scrollIntoView({ behavior: 'smooth' });
              }}>Funcionalidades</a>
              <a href="#roadmap" onClick={(e) => {
                e.preventDefault();
                document.getElementById('roadmap')?.scrollIntoView({ behavior: 'smooth' });
              }}>O que vem por aí</a>
              <a href="#planos" onClick={(e) => {
                e.preventDefault();
                document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' });
              }}>Planos</a>
              <a href="#faq" onClick={(e) => {
                e.preventDefault();
                document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
              }}>FAQ</a>
              <button onClick={onLoginClick} className="footer-link">Login</button>
            </div>
            <div className="footer-section">
              <h4>Contato</h4>
              <p>Dúvidas ou suporte?</p>
              <p>Entre em contato conosco</p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 Recalcula Preço. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      <RegistroModal
        isOpen={showRegistro}
        onClose={() => setShowRegistro(false)}
        onRegisterSuccess={() => {
          setShowRegistro(false);
          onLoginClick();
        }}
      />
    </div>
  );
};

export default LandingPage;

