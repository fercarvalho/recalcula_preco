import { useState, useEffect } from 'react';
import '../pages/PoliticaPrivacidade.css';

const PoliticaPrivacidadeContent = () => {
  const [conteudo, setConteudo] = useState<string>('');
  const [dataAtualizacao, setDataAtualizacao] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarPolitica = async () => {
      try {
        const response = await fetch('/api/politica-privacidade');
        if (response.ok) {
          const data = await response.json();
          if (data.conteudo) {
            setConteudo(data.conteudo);
            if (data.updated_at) {
              const dataFormatada = new Date(data.updated_at).toLocaleDateString('pt-BR');
              setDataAtualizacao(dataFormatada);
            }
          }
        }
      } catch (error) {
        console.error('Erro ao carregar política de privacidade:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarPolitica();
  }, []);

  if (loading) {
    return (
      <div className="politica-privacidade-content">
        <p>Carregando política de privacidade...</p>
      </div>
    );
  }

  // Se houver conteúdo do backend, renderizar como HTML
  if (conteudo) {
    return (
      <div className="politica-privacidade-content">
        <p className="politica-privacidade-data-modal">Última atualização: {dataAtualizacao || new Date().toLocaleDateString('pt-BR')}</p>
        <div dangerouslySetInnerHTML={{ __html: conteudo }} />
      </div>
    );
  }

  // Conteúdo padrão (fallback)
  return (
    <div className="politica-privacidade-content">
      <p className="politica-privacidade-data-modal">Última atualização: {dataAtualizacao || new Date().toLocaleDateString('pt-BR')}</p>
      
      <section className="politica-privacidade-section">
        <h2>1. Introdução</h2>
        <p>
          A Calculadora de Reajuste está comprometida em proteger a privacidade e os dados pessoais de nossos 
          usuários. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas 
          informações pessoais quando você utiliza nosso serviço.
        </p>
        <p>
          Ao utilizar nosso serviço, você concorda com a coleta e uso de informações de acordo com esta política. 
          Esta Política de Privacidade está em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 
          13.709/2018) e outras legislações aplicáveis.
        </p>
      </section>

      <section className="politica-privacidade-section">
        <h2>2. Informações que Coletamos</h2>
        <h3>2.1. Informações Fornecidas por Você</h3>
        <p>Coletamos informações que você nos fornece diretamente, incluindo:</p>
        <ul>
          <li><strong>Dados de Registro:</strong> Nome, endereço de e-mail, nome de usuário e senha;</li>
          <li><strong>Dados de Perfil:</strong> Informações adicionais que você escolhe fornecer, como nome do estabelecimento, logo personalizado e configurações de tema;</li>
          <li><strong>Dados de Conteúdo:</strong> Itens de cardápio, preços, categorias, descrições e outras informações relacionadas aos seus produtos ou serviços;</li>
          <li><strong>Dados de Pagamento:</strong> Informações necessárias para processar pagamentos, incluindo dados de cartão de crédito (processados por provedores terceirizados seguros);</li>
          <li><strong>Dados de Comunicação:</strong> Informações fornecidas quando você entra em contato conosco para suporte ou feedback.</li>
        </ul>

        <h3>2.2. Informações Coletadas Automaticamente</h3>
        <p>Quando você utiliza nosso serviço, coletamos automaticamente certas informações, incluindo:</p>
        <ul>
          <li><strong>Dados de Uso:</strong> Informações sobre como você interage com nosso serviço, incluindo páginas visitadas, tempo de permanência, cliques e ações realizadas;</li>
          <li><strong>Dados de Dispositivo:</strong> Tipo de dispositivo, sistema operacional, navegador, endereço IP, identificadores únicos de dispositivo e informações de conexão;</li>
          <li><strong>Dados de Localização:</strong> Informações de localização aproximada baseadas em seu endereço IP;</li>
          <li><strong>Cookies e Tecnologias Similares:</strong> Informações coletadas através de cookies, pixels, tags e outras tecnologias de rastreamento.</li>
        </ul>

        <h3>2.3. Informações de Terceiros</h3>
        <p>
          Podemos receber informações sobre você de terceiros, como provedores de serviços de autenticação, 
          processadores de pagamento e serviços de análise, quando você utiliza seus serviços em conexão com 
          nosso serviço.
        </p>
      </section>

      <section className="politica-privacidade-section">
        <h2>3. Como Utilizamos Suas Informações</h2>
        <p>Utilizamos as informações coletadas para os seguintes propósitos:</p>
        <ul>
          <li><strong>Fornecimento do Serviço:</strong> Processar e gerenciar sua conta, fornecer funcionalidades do serviço, processar pagamentos e permitir que você use todas as funcionalidades disponíveis;</li>
          <li><strong>Melhoria do Serviço:</strong> Analisar o uso do serviço para entender como melhorar a experiência do usuário, desenvolver novos recursos e otimizar a funcionalidade;</li>
          <li><strong>Comunicação:</strong> Enviar notificações sobre sua conta, atualizações do serviço, informações sobre pagamentos e responder a suas solicitações de suporte;</li>
          <li><strong>Personalização:</strong> Personalizar sua experiência, incluindo recomendações, conteúdo e funcionalidades adaptadas às suas preferências;</li>
          <li><strong>Segurança:</strong> Detectar, prevenir e responder a fraudes, abusos, riscos de segurança e atividades técnicas que possam comprometer nosso serviço ou usuários;</li>
          <li><strong>Conformidade Legal:</strong> Cumprir obrigações legais, responder a solicitações legais e proteger nossos direitos e os de nossos usuários;</li>
          <li><strong>Marketing:</strong> Com seu consentimento, enviar comunicações de marketing sobre produtos, serviços e ofertas que possam ser do seu interesse.</li>
        </ul>
      </section>

      <section className="politica-privacidade-section">
        <h2>4. Compartilhamento de Informações</h2>
        <p>Não vendemos suas informações pessoais. Podemos compartilhar suas informações nas seguintes circunstâncias:</p>

        <h3>4.1. Prestadores de Serviços</h3>
        <p>
          Compartilhamos informações com prestadores de serviços terceirizados que nos auxiliam na operação do 
          serviço, incluindo:
        </p>
        <ul>
          <li>Processadores de pagamento para processar transações;</li>
          <li>Provedores de hospedagem e infraestrutura de nuvem;</li>
          <li>Serviços de análise e monitoramento;</li>
          <li>Provedores de serviços de e-mail e comunicação;</li>
          <li>Serviços de autenticação e segurança.</li>
        </ul>
        <p>
          Esses prestadores de serviços são contratualmente obrigados a proteger suas informações e utilizá-las 
          apenas para os fins especificados.
        </p>

        <h3>4.2. Requisitos Legais</h3>
        <p>
          Podemos divulgar suas informações se acreditarmos de boa fé que tal divulgação é necessária para:
        </p>
        <ul>
          <li>Cumprir uma obrigação legal, processo judicial ou ordem governamental;</li>
          <li>Proteger e defender nossos direitos ou propriedade;</li>
          <li>Prevenir ou investigar possíveis violações relacionadas ao serviço;</li>
          <li>Proteger a segurança pessoal dos usuários do serviço ou do público;</li>
          <li>Proteger contra responsabilidade legal.</li>
        </ul>

        <h3>4.3. Transferências de Negócio</h3>
        <p>
          Em caso de fusão, aquisição, reestruturação ou venda de ativos, suas informações podem ser transferidas 
          como parte dessa transação. Notificaremos você sobre qualquer mudança na propriedade ou uso de suas 
          informações pessoais.
        </p>

        <h3>4.4. Com Seu Consentimento</h3>
        <p>
          Podemos compartilhar suas informações com terceiros quando você nos der consentimento explícito para 
          fazê-lo.
        </p>
      </section>

      <section className="politica-privacidade-section">
        <h2>5. Cookies e Tecnologias de Rastreamento</h2>
        <p>
          Utilizamos cookies e tecnologias similares para coletar e armazenar informações sobre suas preferências 
          e atividades no serviço.
        </p>

        <h3>5.1. Tipos de Cookies</h3>
        <ul>
          <li><strong>Cookies Necessários:</strong> Essenciais para o funcionamento do serviço. Sem esses cookies, 
          algumas funcionalidades podem não estar disponíveis;</li>
          <li><strong>Cookies de Análise:</strong> Nos ajudam a entender como os visitantes interagem com o serviço, 
          coletando informações de forma anônima;</li>
          <li><strong>Cookies de Marketing:</strong> Usados para personalizar anúncios e medir a eficácia de 
          campanhas publicitárias.</li>
        </ul>

        <h3>5.2. Gerenciamento de Cookies</h3>
        <p>
          Você pode gerenciar suas preferências de cookies através das configurações do seu navegador ou através 
          do nosso banner de cookies. Note que desabilitar certos cookies pode afetar a funcionalidade do serviço.
        </p>
      </section>

      <section className="politica-privacidade-section">
        <h2>6. Segurança das Informações</h2>
        <p>
          Implementamos medidas de segurança técnicas, administrativas e físicas apropriadas para proteger suas 
          informações pessoais contra acesso não autorizado, alteração, divulgação ou destruição. Essas medidas 
          incluem:
        </p>
        <ul>
          <li>Criptografia de dados em trânsito e em repouso;</li>
          <li>Controles de acesso rigorosos e autenticação;</li>
          <li>Monitoramento regular de segurança e testes de vulnerabilidade;</li>
          <li>Backups regulares e planos de recuperação de desastres;</li>
          <li>Treinamento de pessoal sobre práticas de segurança de dados;</li>
          <li>Revisões regulares de nossas práticas de segurança.</li>
        </ul>
        <p>
          Embora nos esforcemos para proteger suas informações, nenhum método de transmissão pela internet ou 
          armazenamento eletrônico é 100% seguro. Não podemos garantir segurança absoluta, mas nos comprometemos 
          a notificá-lo sobre qualquer violação de dados que possa afetar suas informações pessoais.
        </p>
      </section>

      <section className="politica-privacidade-section">
        <h2>7. Retenção de Dados</h2>
        <p>
          Mantemos suas informações pessoais apenas pelo tempo necessário para cumprir os propósitos descritos 
          nesta Política de Privacidade, a menos que um período de retenção mais longo seja exigido ou permitido 
          por lei. Fatores que determinam o período de retenção incluem:
        </p>
        <ul>
          <li>A duração necessária para fornecer o serviço;</li>
          <li>Obrigações legais e regulatórias;</li>
          <li>Resolução de disputas e aplicação de acordos;</li>
          <li>Prevenção de fraudes e abusos.</li>
        </ul>
        <p>
          Quando suas informações não forem mais necessárias, as excluiremos ou anonimizaremos de forma segura.
        </p>
      </section>

      <section className="politica-privacidade-section">
        <h2>8. Seus Direitos (LGPD)</h2>
        <p>
          De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem os seguintes direitos em relação às 
          suas informações pessoais:
        </p>

        <h3>8.1. Direito de Acesso</h3>
        <p>
          Você tem o direito de solicitar uma cópia das informações pessoais que mantemos sobre você e informações 
          sobre como as utilizamos.
        </p>

        <h3>8.2. Direito de Correção</h3>
        <p>
          Você pode solicitar a correção de informações pessoais imprecisas ou incompletas. Você também pode atualizar 
          suas informações diretamente através das configurações da sua conta.
        </p>

        <h3>8.3. Direito de Exclusão</h3>
        <p>
          Você pode solicitar a exclusão de suas informações pessoais quando não forem mais necessárias para os 
          propósitos para os quais foram coletadas, ou quando você retirar seu consentimento.
        </p>

        <h3>8.4. Direito de Portabilidade</h3>
        <p>
          Você pode solicitar que forneçamos suas informações pessoais em um formato estruturado, de uso comum e 
          legível por máquina, ou que as transmitamos diretamente a outro controlador.
        </p>

        <h3>8.5. Direito de Oposição</h3>
        <p>
          Você pode se opor ao processamento de suas informações pessoais para certos fins, como marketing direto.
        </p>

        <h3>8.6. Direito de Revogação do Consentimento</h3>
        <p>
          Quando o processamento for baseado em consentimento, você tem o direito de retirar seu consentimento 
          a qualquer momento, sem afetar a legalidade do processamento baseado em consentimento antes da retirada.
        </p>

        <h3>8.7. Como Exercer Seus Direitos</h3>
        <p>
          Para exercer qualquer um desses direitos, entre em contato conosco através dos canais de suporte disponíveis 
          em nosso serviço. Responderemos à sua solicitação dentro de um prazo razoável e de acordo com a legislação 
          aplicável.
        </p>
      </section>

      <section className="politica-privacidade-section">
        <h2>9. Privacidade de Menores</h2>
        <p>
          Nosso serviço não é direcionado a menores de 18 anos. Não coletamos intencionalmente informações pessoais 
          de menores. Se tomarmos conhecimento de que coletamos informações pessoais de um menor sem o consentimento 
          adequado do responsável legal, tomaremos medidas para excluir essas informações de nossos servidores.
        </p>
        <p>
          Se você é um responsável legal e acredita que seu filho nos forneceu informações pessoais, entre em contato 
          conosco imediatamente.
        </p>
      </section>

      <section className="politica-privacidade-section">
        <h2>10. Transferências Internacionais de Dados</h2>
        <p>
          Suas informações podem ser transferidas e mantidas em servidores localizados fora do Brasil. Ao utilizar 
          nosso serviço, você consente com a transferência de suas informações para esses servidores. Garantimos que 
          tais transferências sejam realizadas de acordo com esta Política de Privacidade e as leis aplicáveis de 
          proteção de dados.
        </p>
      </section>

      <section className="politica-privacidade-section">
        <h2>11. Links para Sites de Terceiros</h2>
        <p>
          Nosso serviço pode conter links para sites de terceiros. Não somos responsáveis pelas práticas de privacidade 
          ou pelo conteúdo desses sites. Recomendamos que você revise as políticas de privacidade de qualquer site de 
          terceiros que visite.
        </p>
      </section>

      <section className="politica-privacidade-section">
        <h2>12. Alterações nesta Política de Privacidade</h2>
        <p>
          Podemos atualizar esta Política de Privacidade periodicamente para refletir mudanças em nossas práticas, 
          tecnologias, requisitos legais ou outros fatores. Notificaremos você sobre alterações materiais através de:
        </p>
        <ul>
          <li>E-mail para o endereço associado à sua conta;</li>
          <li>Aviso em nosso serviço;</li>
          <li>Atualização da data de "Última atualização" no topo desta política.</li>
        </ul>
        <p>
          Recomendamos que você revise esta Política de Privacidade periodicamente para se manter informado sobre 
          como protegemos suas informações. O uso continuado de nosso serviço após a publicação de alterações constitui 
          sua aceitação da Política de Privacidade revisada.
        </p>
      </section>

      <section className="politica-privacidade-section">
        <h2>13. Encarregado de Proteção de Dados (DPO)</h2>
        <p>
          Em conformidade com a LGPD, designamos um Encarregado de Proteção de Dados (DPO) responsável por receber 
          comunicações dos titulares de dados e da Autoridade Nacional de Proteção de Dados (ANPD). Para entrar em 
          contato com nosso DPO, utilize os canais de suporte disponíveis em nosso serviço.
        </p>
      </section>

      <section className="politica-privacidade-section">
        <h2>14. Consentimento</h2>
        <p>
          Ao utilizar nosso serviço, você declara ter lido, compreendido e concordado com esta Política de Privacidade. 
          Se você não concordar com esta política, não utilize nosso serviço.
        </p>
      </section>

      <section className="politica-privacidade-section">
        <h2>15. Contato</h2>
        <p>
          Se você tiver dúvidas, preocupações ou solicitações relacionadas a esta Política de Privacidade ou ao 
          tratamento de suas informações pessoais, entre em contato conosco através dos canais de suporte disponíveis 
          em nosso serviço.
        </p>
        <p>
          Comprometemo-nos a responder suas solicitações de forma oportuna e de acordo com a legislação aplicável.
        </p>
      </section>
    </div>
  );
};

export default PoliticaPrivacidadeContent;

