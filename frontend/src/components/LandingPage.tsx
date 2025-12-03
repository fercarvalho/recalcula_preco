import { useState, useEffect } from 'react';
import { FaCheck, FaChevronDown, FaChevronUp, FaCalculator, FaChartLine, FaMobileAlt, FaShieldAlt, FaSync, FaUsers, FaRocket, FaQrcode, FaMoneyBillWave, FaFileAlt, FaWhatsapp } from 'react-icons/fa';
import * as FaIcons from 'react-icons/fa';
import RegistroModal from './RegistroModal';
import { apiService } from '../services/api';
import type { Funcao } from './GerenciamentoFuncoes';
import { obterSecoesMenuAtivas } from './GerenciamentoMenu';
import type { Plano } from './GerenciamentoPlanos';
import './LandingPage.css';

const LandingPage = ({ onLoginClick }: { onLoginClick: () => void }) => {
  const [showRegistro, setShowRegistro] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [funcoes, setFuncoes] = useState<Funcao[]>([]);
  const [secoesMenuAtivas, setSecoesMenuAtivas] = useState<string[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);

  const toggleFaq = (index: number) => {
    setFaqOpen(faqOpen === index ? null : index);
  };

  const handlePlanoClick = () => {
    // Redirecionar para login
    onLoginClick();
  };

  const formatarValor = (valor: number): string => {
    return valor.toFixed(2).replace('.', ',');
  };

  const formatarPeriodo = (tipo: string, periodo: string | null | undefined, valorParcelado: number | null | undefined): string => {
    if (tipo === 'unico') {
      return periodo || 'pagamento único';
    }
    if (tipo === 'parcelado' && valorParcelado) {
      return '/mês em parcelas';
    }
    if (tipo === 'recorrente') {
      return periodo ? `/${periodo}` : '/mês';
    }
    return '';
  };

  useEffect(() => {
    carregarFuncoes();
    carregarSecoesMenu();
    carregarPlanos();
    
    // Ouvir atualizações de configuração do menu
    const handleMenuConfigUpdate = () => {
      carregarSecoesMenu();
    };
    
    // Ouvir atualizações de planos
    const handlePlanosUpdate = () => {
      carregarPlanos();
    };
    
    window.addEventListener('menu-config-updated', handleMenuConfigUpdate);
    window.addEventListener('planos-updated', handlePlanosUpdate);
    
    // Também ouvir quando a página ganha foco (quando o usuário volta para a landing page)
    const handleFocus = () => {
      carregarSecoesMenu();
      carregarPlanos();
    };
    
    window.addEventListener('focus', handleFocus);
    
    // Recarregar quando a visibilidade da página mudar
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        carregarSecoesMenu();
        carregarPlanos();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('menu-config-updated', handleMenuConfigUpdate);
      window.removeEventListener('planos-updated', handlePlanosUpdate);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  const carregarSecoesMenu = async () => {
    try {
      const secoesAtivas = await obterSecoesMenuAtivas();
      setSecoesMenuAtivas(secoesAtivas);
    } catch (error) {
      console.error('Erro ao carregar seções do menu:', error);
      // Em caso de erro, mostrar todas as seções como padrão
      setSecoesMenuAtivas(['sobre', 'funcionalidades', 'roadmap', 'planos', 'faq']);
    }
  };

  const carregarPlanos = async () => {
    try {
      const planosCarregados = await apiService.obterPlanos();
      // Converter para o tipo Plano e ordenar por ordem e depois por mais popular
      const planosConvertidos: Plano[] = planosCarregados.map(p => ({
        id: p.id,
        nome: p.nome,
        tipo: p.tipo as Plano['tipo'],
        valor: p.valor,
        valor_parcelado: p.valor_parcelado,
        valor_total: p.valor_total,
        periodo: p.periodo,
        desconto_percentual: p.desconto_percentual,
        desconto_valor: p.desconto_valor,
        mais_popular: p.mais_popular,
        mostrar_valor_total: p.mostrar_valor_total,
        mostrar_valor_parcelado: p.mostrar_valor_parcelado,
        ativo: p.ativo,
        ordem: p.ordem,
        beneficios: p.beneficios
      }));
      
      const planosOrdenados = planosConvertidos.sort((a, b) => {
        if (a.mais_popular && !b.mais_popular) return -1;
        if (!a.mais_popular && b.mais_popular) return 1;
        return (a.ordem || 0) - (b.ordem || 0);
      });
      setPlanos(planosOrdenados);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      setPlanos([]);
    }
  };

  const carregarFuncoes = async () => {
    try {
      const funcoesCarregadas = await apiService.obterFuncoes();
      setFuncoes(funcoesCarregadas);
    } catch (error) {
      console.error('Erro ao carregar funções:', error);
      // Em caso de erro, usar funções padrão
      setFuncoes([]);
    }
  };

  const renderIcone = (funcao: Funcao) => {
    if (funcao.icone_upload) {
      return <img src={funcao.icone_upload} alt={funcao.titulo} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />;
    }
    if (funcao.icone) {
      const IconComponent = FaIcons[funcao.icone as keyof typeof FaIcons] as React.ComponentType<any>;
      if (IconComponent) {
        return <IconComponent />;
      }
    }
    return <FaCalculator />;
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

  // Filtrar funções ativas e não-IA para a seção de funcionalidades
  const funcoesAtivas = funcoes.filter(f => f.ativa && !f.eh_ia);
  const beneficios = funcoesAtivas.map(f => ({
    icone: renderIcone(f),
    titulo: f.titulo,
    descricao: f.descricao
  }));

  // Filtrar funções inativas (não-IA) para a seção "em breve"
  const funcoesEmBreve = funcoes.filter(f => !f.ativa && !f.eh_ia);
  const roadmapItens = funcoesEmBreve.map(f => ({
    icone: renderIcone(f),
    titulo: f.titulo,
    descricao: f.descricao
  }));

  // Filtrar funções de IA para a seção WhatsApp
  const funcoesIA = funcoes.filter(f => f.eh_ia);
  const funcoesIAAtivas = funcoes.filter(f => f.eh_ia && f.ativa);

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
            <button onClick={onLoginClick} className="btn-login-header">Login</button>
            <button onClick={(e) => {
              e.preventDefault();
              document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' });
            }} className="btn-assinar-header">Assinar agora</button>
          </div>
        </div>
        <nav className="landing-nav">
          {secoesMenuAtivas.includes('sobre') && (
            <a href="#sobre" onClick={(e) => {
              e.preventDefault();
              document.getElementById('sobre')?.scrollIntoView({ behavior: 'smooth' });
            }}>Sobre</a>
          )}
          {secoesMenuAtivas.includes('funcionalidades') && (
            <a href="#funcionalidades" onClick={(e) => {
              e.preventDefault();
              document.getElementById('funcionalidades')?.scrollIntoView({ behavior: 'smooth' });
            }}>Funcionalidades</a>
          )}
          {secoesMenuAtivas.includes('roadmap') && (
            <a href="#roadmap" onClick={(e) => {
              e.preventDefault();
              document.getElementById('roadmap')?.scrollIntoView({ behavior: 'smooth' });
            }}>O que vem por aí</a>
          )}
          {secoesMenuAtivas.includes('planos') && (
            <a href="#planos" onClick={(e) => {
              e.preventDefault();
              document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' });
            }}>Planos</a>
          )}
          {secoesMenuAtivas.includes('faq') && (
            <a href="#faq" onClick={(e) => {
              e.preventDefault();
              document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
            }}>FAQ</a>
          )}
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
      {beneficios.length > 0 && (
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
      )}

      {/* Integração com Inteligência Artificial (pelo WhatsApp) - Funções Ativas */}
      {funcoesIAAtivas.length > 0 && (
        <section id="whatsapp-ia-ativas" className="whatsapp-section">
          <div className="container">
            <h2 className="section-title">
              Integração com Inteligência Artificial <span className="roadmap-subtitle">(pelo WhatsApp)</span>
            </h2>
            <p className="whatsapp-intro">
              Conecte sua Recalcula Preço diretamente ao WhatsApp com automações inteligentes para o seu atendimento, cardápio e recebimento de pedidos.
            </p>
            <div className="whatsapp-placeholder">
              <div className="whatsapp-features">
                {funcoesIAAtivas.map((funcao) => (
                  <div key={funcao.id} className="whatsapp-feature-card">
                    <div className="whatsapp-icon-inline-wrapper">
                      {funcao.icone_upload ? (
                        <img src={funcao.icone_upload} alt={funcao.titulo} style={{ width: '48px', height: '48px' }} />
                      ) : funcao.icone ? (
                        (() => {
                          const IconComponent = FaIcons[funcao.icone as keyof typeof FaIcons] as React.ComponentType<any>;
                          return IconComponent ? <IconComponent className="whatsapp-icon-inline" /> : <FaWhatsapp className="whatsapp-icon-inline" />;
                        })()
                      ) : (
                        <FaWhatsapp className="whatsapp-icon-inline" />
                      )}
                    </div>
                    <h3>{funcao.titulo}</h3>
                    <p>{funcao.descricao}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Roadmap – O que vem por aí */}
      {roadmapItens.length > 0 && (
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
      )}

      {/* Integração com o WhatsApp – No Forno */}
      {funcoesIA.filter(f => !f.ativa).length > 0 && (
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
                {/* Funções de IA inativas (em breve) */}
                {funcoesIA.filter(f => !f.ativa).map((funcao) => (
                  <div key={funcao.id} className="whatsapp-feature-card">
                    <div className="whatsapp-icon-inline-wrapper">
                      {funcao.icone_upload ? (
                        <img src={funcao.icone_upload} alt={funcao.titulo} style={{ width: '48px', height: '48px' }} />
                      ) : funcao.icone ? (
                        (() => {
                          const IconComponent = FaIcons[funcao.icone as keyof typeof FaIcons] as React.ComponentType<any>;
                          return IconComponent ? <IconComponent className="whatsapp-icon-inline" /> : <FaWhatsapp className="whatsapp-icon-inline" />;
                        })()
                      ) : (
                        <FaWhatsapp className="whatsapp-icon-inline" />
                      )}
                    </div>
                    <h3>{funcao.titulo}</h3>
                    <p>{funcao.descricao}</p>
                    <span className="whatsapp-tag">Em breve</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Planos */}
      {planos.length > 0 && (
        <section id="planos" className="planos-section">
          <div className="container">
            <h2 className="section-title">Escolha o plano ideal para você</h2>

            <div className="planos-grid-landing">
              {planos.map((plano) => {
                const valorComDesconto = plano.desconto_percentual 
                  ? plano.valor * (1 - plano.desconto_percentual / 100)
                  : plano.desconto_valor
                  ? plano.valor - plano.desconto_valor
                  : plano.valor;

                return (
                  <div 
                    key={plano.id} 
                    className={`plano-card-landing ${plano.mais_popular ? 'plano-destaque-landing' : ''}`}
                  >
                    {plano.mais_popular && (
                      <div className="plano-badge-landing">Mais Popular</div>
                    )}
                    <div className="plano-header-landing">
                      <h3>{plano.nome}</h3>
                      <div className="plano-preco-landing">
                        <span className="preco-valor-landing">
                          R$ {formatarValor(valorComDesconto)}
                        </span>
                        <span className="preco-periodo-landing">
                          {formatarPeriodo(plano.tipo, plano.periodo || null, plano.valor_parcelado || null)}
                        </span>
                      </div>
                      {plano.valor_total && plano.mostrar_valor_total && (
                        <p className="economia-texto">
                          💰 Total: R$ {formatarValor(plano.valor_total)}
                          {plano.tipo === 'recorrente' && plano.periodo === 'mensal' && ' por ano'}
                        </p>
                      )}
                      {plano.periodo && plano.tipo === 'unico' && (
                        <p className="plano-descricao-landing">Acesso por {plano.periodo}</p>
                      )}
                    </div>
                    <ul className="plano-beneficios-landing">
                      {plano.beneficios && plano.beneficios.map((beneficio, index) => (
                        <li 
                          key={index}
                          className={beneficio.startsWith('⚠️') ? 'texto-aviso' : ''}
                        >
                          {!beneficio.startsWith('⚠️') && <FaCheck />} {beneficio}
                        </li>
                      ))}
                    </ul>
                    <button 
                      onClick={handlePlanoClick} 
                      className={`btn-plano-landing ${!plano.mais_popular ? 'btn-plano-secundario' : ''}`}
                    >
                      {plano.tipo === 'unico' ? 'Comprar acesso único' : 'Assinar agora'}
                    </button>
                  </div>
                );
              })}
            </div>

            <p className="garantia-texto">7 dias de garantia ou seu dinheiro de volta</p>
          </div>
        </section>
      )}

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

