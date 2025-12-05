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
  const [faqs, setFaqs] = useState<Array<{ id: number; pergunta: string; resposta: string }>>([]);
  const [rodapeLinks, setRodapeLinks] = useState<Array<{ id: number; texto: string; link: string; coluna: string; ordem: number; eh_link: boolean }>>([]);

  const toggleFaq = (id: number) => {
    setFaqOpen(faqOpen === id ? null : id);
  };

  const handlePlanoClick = () => {
    // Redirecionar para login
    onLoginClick();
  };

  const formatarValor = (valor: number | null | undefined): string => {
    if (valor === null || valor === undefined || isNaN(valor) || valor <= 0) return '0,00';
    return valor.toFixed(2).replace('.', ',');
  };

  const formatarPeriodo = (tipo: string, periodo: string | null | undefined, valorParcelado: number | null | undefined): string => {
    if (tipo === 'unico') {
      return periodo || 'pagamento único';
    }
    if (tipo === 'parcelado') {
      if (valorParcelado && valorParcelado > 0) {
        return '/mês em parcelas';
      }
      return '';
    }
    if (tipo === 'recorrente') {
      if (periodo && periodo.trim() !== '') {
        return `/${periodo}`;
      }
      return '/mês';
    }
    return '';
  };

  useEffect(() => {
    carregarFuncoes();
    carregarSecoesMenu();
    carregarPlanos();
    carregarFAQ();
    carregarRodapeLinks();
    
    // Ouvir atualizações de configuração do menu
    const handleMenuConfigUpdate = () => {
      carregarSecoesMenu();
    };
    
    // Ouvir atualizações de planos
    const handlePlanosUpdate = () => {
      carregarPlanos();
    };
    
    // Ouvir atualizações de FAQ
    const handleFAQUpdate = () => {
      carregarFAQ();
    };
    
    // Ouvir atualizações de rodapé
    const handleRodapeUpdate = () => {
      carregarRodapeLinks();
    };
    
    // Ouvir atualizações de funções
    const handleFuncoesUpdate = () => {
      carregarFuncoes();
    };
    
    window.addEventListener('menu-config-updated', handleMenuConfigUpdate);
    window.addEventListener('planos-updated', handlePlanosUpdate);
    window.addEventListener('faq-updated', handleFAQUpdate);
    window.addEventListener('rodape-updated', handleRodapeUpdate);
    window.addEventListener('funcoes-updated', handleFuncoesUpdate);
    
    // Também ouvir quando a página ganha foco (quando o usuário volta para a landing page)
    const handleFocus = () => {
      carregarSecoesMenu();
      carregarPlanos();
      carregarFAQ();
      carregarRodapeLinks();
      carregarFuncoes();
    };
    
    window.addEventListener('focus', handleFocus);
    
    // Recarregar quando a visibilidade da página mudar
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        carregarSecoesMenu();
        carregarPlanos();
        carregarFAQ();
        carregarRodapeLinks();
        carregarFuncoes();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('menu-config-updated', handleMenuConfigUpdate);
      window.removeEventListener('planos-updated', handlePlanosUpdate);
      window.removeEventListener('faq-updated', handleFAQUpdate);
      window.removeEventListener('rodape-updated', handleRodapeUpdate);
      window.removeEventListener('funcoes-updated', handleFuncoesUpdate);
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
      
      // Ordenar primeiro por ordem (campo que define a ordem na lista de gerenciamento)
      // e depois por mais_popular como critério secundário
      const planosOrdenados = planosConvertidos.sort((a, b) => {
        // Primeiro critério: ordem
        const ordemA = a.ordem ?? 999;
        const ordemB = b.ordem ?? 999;
        if (ordemA !== ordemB) {
          return ordemA - ordemB;
        }
        // Segundo critério: mais popular (apenas se a ordem for igual)
        if (a.mais_popular && !b.mais_popular) return -1;
        if (!a.mais_popular && b.mais_popular) return 1;
        return 0;
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

  const carregarFAQ = async () => {
    try {
      const faqCarregado = await apiService.obterFAQ();
      setFaqs(faqCarregado);
    } catch (error) {
      console.error('Erro ao carregar FAQ:', error);
      setFaqs([]);
    }
  };

  const carregarRodapeLinks = async () => {
    try {
      const linksCarregados = await apiService.obterRodapeLinks();
      setRodapeLinks(linksCarregados);
    } catch (error) {
      console.error('Erro ao carregar links do rodapé:', error);
      setRodapeLinks([]);
    }
  };

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

            <div className={`planos-grid-landing planos-${planos.length}`}>
              {planos.map((plano) => {
                const temDescontoPercentual = !!(plano.desconto_percentual && plano.desconto_percentual > 0);
                const temDescontoValor = !!(plano.desconto_valor && plano.desconto_valor > 0);
                const temDesconto = temDescontoPercentual || temDescontoValor;
                
                const valorComDesconto = temDescontoPercentual
                  ? plano.valor * (1 - plano.desconto_percentual / 100)
                  : temDescontoValor
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
                    {temDescontoPercentual && (
                      <div className="plano-badge-desconto-landing">
                        {plano.desconto_percentual}% OFF
                      </div>
                    )}
                    {temDescontoValor && !temDescontoPercentual && (
                      <div className="plano-badge-desconto-landing">
                        R$ {formatarValor(plano.desconto_valor!)} OFF
                      </div>
                    )}
                    <div className="plano-header-landing">
                      <h3>{plano.nome}</h3>
                      <div className="plano-preco-landing">
                        {temDesconto && (
                          <div className="preco-original-landing">
                            <span className="preco-original-texto">De: R$ {formatarValor(plano.valor)}</span>
                          </div>
                        )}
                        <span className="preco-valor-landing">
                          R$ {formatarValor(valorComDesconto)}
                        </span>
                        {formatarPeriodo(plano.tipo, plano.periodo || null, plano.valor_parcelado || null) && (
                          <span className="preco-periodo-landing">
                            {formatarPeriodo(plano.tipo, plano.periodo || null, plano.valor_parcelado || null)}
                          </span>
                        )}
                        {temDescontoPercentual && (
                          <p className="desconto-info-landing">
                            Economize {plano.desconto_percentual}%
                          </p>
                        )}
                        {temDescontoValor && !temDescontoPercentual && (
                          <p className="desconto-info-landing">
                            Economize R$ {formatarValor(plano.desconto_valor!)}
                          </p>
                        )}
                      </div>
                      {plano.valor_total && plano.valor_total > 0 && plano.mostrar_valor_total && (
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
                      {plano.beneficios && plano.beneficios.map((beneficio, index) => {
                        const texto = typeof beneficio === 'string' ? beneficio : beneficio.texto;
                        const ehAviso = typeof beneficio === 'string' 
                          ? texto.startsWith('⚠️')
                          : (beneficio.eh_aviso || false);
                        const textoLimpo = typeof beneficio === 'string' && texto.startsWith('⚠️')
                          ? texto.substring(1).trim()
                          : texto;
                        return (
                          <li 
                            key={typeof beneficio === 'string' ? index : (beneficio.id || index)}
                            className={ehAviso ? 'texto-aviso' : ''}
                          >
                            {ehAviso ? (
                              <>⚠️ {textoLimpo}</>
                            ) : (
                              <><FaCheck /> {textoLimpo}</>
                            )}
                          </li>
                        );
                      })}
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
            {faqs.map((faq) => (
              <div key={faq.id} className="faq-item">
                <button
                  className={`faq-question ${faqOpen === faq.id ? 'open' : ''}`}
                  onClick={() => toggleFaq(faq.id)}
                >
                  <span>{faq.pergunta}</span>
                  {faqOpen === faq.id ? <FaChevronUp /> : <FaChevronDown />}
                </button>
                {faqOpen === faq.id && (
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
            {(() => {
              // Agrupar links por coluna
              const linksPorColuna = rodapeLinks.reduce((acc, link) => {
                if (!acc[link.coluna]) {
                  acc[link.coluna] = [];
                }
                acc[link.coluna].push(link);
                return acc;
              }, {} as Record<string, typeof rodapeLinks>);

              // Ordenar links dentro de cada coluna por ordem
              Object.keys(linksPorColuna).forEach(coluna => {
                linksPorColuna[coluna].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
              });

              // Obter colunas únicas ordenadas (a ordem vem do banco de dados)
              const colunas = Array.from(new Set(rodapeLinks.map(l => l.coluna)));
              // Manter a ordem que vem do banco (já ordenada pela função obterColunasRodape)

              return colunas.map((coluna) => {
                const linksDaColuna = linksPorColuna[coluna] || [];

                return (
                  <div key={coluna} className="footer-section">
                    <h4>{coluna}</h4>
                    {linksDaColuna.map((link) => {
                      const handleLinkClick = (e: React.MouseEvent) => {
                        if (link.link && link.link.startsWith('#')) {
                          e.preventDefault();
                          const targetId = link.link.substring(1);
                          if (targetId === 'login') {
                            onLoginClick();
                          } else if (targetId) {
                            document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
                          }
                        }
                      };

                      // Se não for um link (eh_link = false), renderizar como texto (parágrafo)
                      if (!link.eh_link) {
                        return (
                          <p key={link.id}>
                            {link.texto}
                          </p>
                        );
                      }

                      // Se for um link
                      if (link.link === '#login' || link.texto.toLowerCase() === 'login') {
                        return (
                          <button
                            key={link.id}
                            onClick={onLoginClick}
                            className="footer-link"
                          >
                            {link.texto}
                          </button>
                        );
                      }

                      return (
                        <a
                          key={link.id}
                          href={link.link || '#'}
                          onClick={handleLinkClick}
                        >
                          {link.texto}
                        </a>
                      );
                    })}
                  </div>
                );
              });
            })()}
            {rodapeLinks.length === 0 && (
              <>
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
              </>
            )}
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

