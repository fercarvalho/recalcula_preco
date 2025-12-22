import { useState, useEffect } from 'react';
import '../pages/TermosUso.css';

const TermosUsoContent = () => {
  const [conteudo, setConteudo] = useState<string>('');
  const [dataAtualizacao, setDataAtualizacao] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarTermos = async () => {
      try {
        const response = await fetch('/api/termos-uso');
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
        console.error('Erro ao carregar termos de uso:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarTermos();
  }, []);

  if (loading) {
    return (
      <div className="termos-uso-content">
        <p>Carregando termos de uso...</p>
      </div>
    );
  }

  // Se houver conteúdo do backend, renderizar como HTML
  if (conteudo) {
    return (
      <div className="termos-uso-content">
        <p className="termos-uso-data-modal">Última atualização: {dataAtualizacao || new Date().toLocaleDateString('pt-BR')}</p>
        <div dangerouslySetInnerHTML={{ __html: conteudo }} />
      </div>
    );
  }

  // Conteúdo padrão (fallback)
  return (
    <div className="termos-uso-content">
      <p className="termos-uso-data-modal">Última atualização: {dataAtualizacao || new Date().toLocaleDateString('pt-BR')}</p>
      
      <section className="termos-uso-section">
        <h2>1. Introdução</h2>
        <p>
          Bem-vindo aos Termos de Uso da Calculadora de Reajuste. Estes termos regem o uso de nosso serviço 
          e plataforma. Ao acessar ou usar nosso serviço, você concorda em cumprir e estar vinculado a estes 
          Termos de Uso. Se você não concorda com qualquer parte destes termos, não deve usar nosso serviço.
        </p>
      </section>

      <section className="termos-uso-section">
        <h2>2. Definições</h2>
        <ul>
          <li><strong>Serviço:</strong> Refere-se à plataforma de calculadora de reajuste de preços, incluindo todos os recursos, funcionalidades e serviços oferecidos.</li>
          <li><strong>Usuário:</strong> Qualquer pessoa que acessa ou utiliza o Serviço.</li>
          <li><strong>Conta:</strong> O registro criado pelo Usuário para acessar o Serviço.</li>
          <li><strong>Conteúdo:</strong> Todas as informações, dados, textos, gráficos, imagens e outros materiais disponibilizados através do Serviço.</li>
          <li><strong>Dados do Usuário:</strong> Informações fornecidas pelo Usuário, incluindo itens de cardápio, preços, categorias e outras informações relacionadas.</li>
        </ul>
      </section>

      <section className="termos-uso-section">
        <h2>3. Elegibilidade e Registro</h2>
        <p>
          Para usar nosso Serviço, você deve:
        </p>
        <ul>
          <li>Ter pelo menos 18 anos de idade ou ter o consentimento de um responsável legal;</li>
          <li>Fornecer informações precisas, completas e atualizadas durante o registro;</li>
          <li>Manter a segurança de sua conta e senha;</li>
          <li>Ser responsável por todas as atividades que ocorrem sob sua conta;</li>
          <li>Notificar-nos imediatamente sobre qualquer uso não autorizado de sua conta.</li>
        </ul>
      </section>

      <section className="termos-uso-section">
        <h2>4. Uso do Serviço</h2>
        <h3>4.1. Uso Permitido</h3>
        <p>Você pode usar nosso Serviço para:</p>
        <ul>
          <li>Calcular reajustes de preços de produtos e serviços;</li>
          <li>Gerenciar cardápios e listas de produtos;</li>
          <li>Organizar itens por categorias;</li>
          <li>Gerar visualizações e relatórios de reajustes;</li>
          <li>Compartilhar cardápios públicos através de links personalizados.</li>
        </ul>

        <h3>4.2. Restrições de Uso</h3>
        <p>Você concorda em NÃO:</p>
        <ul>
          <li>Usar o Serviço para qualquer propósito ilegal ou não autorizado;</li>
          <li>Violar qualquer lei local, estadual, nacional ou internacional;</li>
          <li>Transmitir qualquer vírus, malware ou código malicioso;</li>
          <li>Tentar obter acesso não autorizado ao Serviço ou a sistemas relacionados;</li>
          <li>Interferir ou interromper o funcionamento do Serviço;</li>
          <li>Usar robôs, scripts automatizados ou métodos similares para acessar o Serviço sem autorização;</li>
          <li>Copiar, modificar, distribuir, vender ou alugar qualquer parte do Serviço;</li>
          <li>Remover ou alterar qualquer aviso de direitos autorais ou marca registrada;</li>
          <li>Usar o Serviço de forma que possa danificar, desabilitar, sobrecarregar ou comprometer nossos servidores ou redes.</li>
        </ul>
      </section>

      <section className="termos-uso-section">
        <h2>5. Conteúdo do Usuário</h2>
        <h3>5.1. Propriedade do Conteúdo</h3>
        <p>
          Você mantém todos os direitos sobre o Conteúdo que você cria, envia, publica ou exibe através do Serviço. 
          Você é o único responsável por seu Conteúdo e pelas consequências de sua publicação.
        </p>

        <h3>5.2. Licença de Uso</h3>
        <p>
          Ao enviar, publicar ou exibir Conteúdo através do Serviço, você nos concede uma licença mundial, 
          não exclusiva, livre de royalties, transferível e sublicenciável para usar, reproduzir, modificar, 
          adaptar, publicar, traduzir, criar trabalhos derivados, distribuir e exibir tal Conteúdo em conexão 
          com a operação e promoção do Serviço.
        </p>

        <h3>5.3. Responsabilidade pelo Conteúdo</h3>
        <p>
          Você declara e garante que:
        </p>
        <ul>
          <li>Você possui ou tem os direitos necessários para usar e licenciar o Conteúdo;</li>
          <li>O Conteúdo não viola direitos de terceiros, incluindo direitos autorais, marcas registradas, privacidade ou outros direitos pessoais ou de propriedade;</li>
          <li>O Conteúdo não contém material difamatório, calunioso, obsceno, ofensivo ou ilegal;</li>
          <li>O Conteúdo não contém vírus ou outros componentes prejudiciais.</li>
        </ul>

        <h3>5.4. Moderação</h3>
        <p>
          Reservamo-nos o direito de revisar, editar, recusar ou remover qualquer Conteúdo que, a nosso exclusivo 
          critério, viole estes Termos de Uso ou seja de outra forma inaceitável, sem aviso prévio.
        </p>
      </section>

      <section className="termos-uso-section">
        <h2>6. Propriedade Intelectual</h2>
        <p>
          O Serviço e seu conteúdo original, funcionalidades e recursos são e permanecerão propriedade exclusiva 
          da Calculadora de Reajuste e seus licenciadores. O Serviço é protegido por direitos autorais, marcas 
          registradas e outras leis. Nossas marcas e logotipos não podem ser usados sem nosso consentimento prévio 
          por escrito.
        </p>
      </section>

      <section className="termos-uso-section">
        <h2>7. Planos e Pagamentos</h2>
        <h3>7.1. Planos de Assinatura</h3>
        <p>
          Oferecemos diferentes planos de assinatura com funcionalidades variadas. Os detalhes dos planos, 
          incluindo preços e funcionalidades, estão disponíveis em nossa página de planos.
        </p>

        <h3>7.2. Pagamentos</h3>
        <p>
          Os pagamentos são processados através de provedores de pagamento terceirizados seguros. Você concorda 
          em fornecer informações de pagamento precisas e autoriza o processamento de pagamentos de acordo com 
          o plano selecionado.
        </p>

        <h3>7.3. Renovação e Cancelamento</h3>
        <p>
          As assinaturas são renovadas automaticamente, a menos que você cancele antes do final do período de 
          cobrança. Você pode cancelar sua assinatura a qualquer momento através das configurações da sua conta. 
          O cancelamento entrará em vigor no final do período de cobrança atual.
        </p>

        <h3>7.4. Reembolsos</h3>
        <p>
          Políticas de reembolso estão sujeitas aos termos específicos de cada plano e podem variar. Entre em 
          contato conosco para mais informações sobre reembolsos.
        </p>
      </section>

      <section className="termos-uso-section">
        <h2>8. Privacidade</h2>
        <p>
          Sua privacidade é importante para nós. Nossa coleta e uso de informações pessoais é regida por nossa 
          Política de Privacidade, que faz parte integrante destes Termos de Uso. Ao usar o Serviço, você concorda 
          com a coleta e uso de informações de acordo com nossa Política de Privacidade.
        </p>
      </section>

      <section className="termos-uso-section">
        <h2>9. Limitação de Responsabilidade</h2>
        <p>
          NA MÁXIMA EXTENSÃO PERMITIDA POR LEI, O SERVIÇO É FORNECIDO "COMO ESTÁ" E "CONFORME DISPONÍVEL", SEM 
          GARANTIAS DE QUALQUER TIPO, EXPRESSAS OU IMPLÍCITAS, INCLUINDO, MAS NÃO SE LIMITANDO A, GARANTIAS DE 
          COMERCIALIZAÇÃO, ADEQUAÇÃO A UM PROPÓSITO ESPECÍFICO E NÃO VIOLAÇÃO.
        </p>
        <p>
          NÃO SEREMOS RESPONSÁVEIS POR QUAISQUER DANOS DIRETOS, INDIRETOS, INCIDENTAIS, ESPECIAIS, CONSEQUENCIAIS 
          OU PUNITIVOS RESULTANTES DO USO OU INCAPACIDADE DE USAR O SERVIÇO, MESMO QUE TENHAMOS SIDO ADVERTIDOS 
          DA POSSIBILIDADE DE TAIS DANOS.
        </p>
        <p>
          Nossa responsabilidade total para com você por todas as reivindicações relacionadas ao Serviço não 
          excederá o valor pago por você nos últimos 12 meses.
        </p>
      </section>

      <section className="termos-uso-section">
        <h2>10. Indenização</h2>
        <p>
          Você concorda em indenizar, defender e isentar a Calculadora de Reajuste, seus afiliados, diretores, 
          funcionários, agentes e licenciadores de e contra todas e quaisquer reivindicações, obrigações, danos, 
          perdas, custos e despesas (incluindo honorários advocatícios) decorrentes de ou relacionados ao seu uso 
          do Serviço, violação destes Termos de Uso, ou violação de qualquer direito de terceiros.
        </p>
      </section>

      <section className="termos-uso-section">
        <h2>11. Modificações nos Termos</h2>
        <p>
          Reservamo-nos o direito de modificar ou substituir estes Termos de Uso a qualquer momento, a nosso 
          exclusivo critério. Se fizermos alterações materiais, notificaremos você por e-mail ou através de um 
          aviso em nosso Serviço. O uso continuado do Serviço após tais modificações constitui sua aceitação 
          dos novos Termos de Uso.
        </p>
        <p>
          É sua responsabilidade revisar periodicamente estes Termos de Uso para estar ciente de quaisquer 
          alterações.
        </p>
      </section>

      <section className="termos-uso-section">
        <h2>12. Rescisão</h2>
        <p>
          Podemos encerrar ou suspender sua conta e acesso ao Serviço imediatamente, sem aviso prévio ou 
          responsabilidade, por qualquer motivo, incluindo, mas não se limitando a, violação destes Termos de Uso.
        </p>
        <p>
          Se você deseja encerrar sua conta, pode fazê-lo através das configurações da sua conta ou entrando 
          em contato conosco.
        </p>
        <p>
          Após a rescisão, seu direito de usar o Serviço cessará imediatamente. Todas as disposições destes 
          Termos de Uso que por sua natureza devem sobreviver à rescisão sobreviverão, incluindo, mas não se 
          limitando a, disposições de propriedade, renúncias de garantia, indenização e limitações de 
          responsabilidade.
        </p>
      </section>

      <section className="termos-uso-section">
        <h2>13. Lei Aplicável e Jurisdição</h2>
        <p>
          Estes Termos de Uso serão regidos e interpretados de acordo com as leis do Brasil, sem dar efeito a 
          quaisquer princípios de conflitos de leis. Qualquer disputa decorrente ou relacionada a estes Termos 
          de Uso será submetida à jurisdição exclusiva dos tribunais competentes do Brasil.
        </p>
      </section>

      <section className="termos-uso-section">
        <h2>14. Disposições Gerais</h2>
        <h3>14.1. Acordo Completo</h3>
        <p>
          Estes Termos de Uso constituem o acordo completo entre você e a Calculadora de Reajuste em relação 
          ao uso do Serviço e substituem todos os acordos anteriores e contemporâneos.
        </p>

        <h3>14.2. Divisibilidade</h3>
        <p>
          Se qualquer disposição destes Termos de Uso for considerada inválida ou inexequível, as disposições 
          restantes permanecerão em pleno vigor e efeito.
        </p>

        <h3>14.3. Renúncia</h3>
        <p>
          A falha em fazer cumprir qualquer direito ou disposição destes Termos de Uso não constituirá uma 
          renúncia a tal direito ou disposição.
        </p>

        <h3>14.4. Cessão</h3>
        <p>
          Você não pode ceder ou transferir estes Termos de Uso, por operação de lei ou de outra forma, sem 
          nosso consentimento prévio por escrito. Podemos ceder estes Termos de Uso a qualquer momento sem 
          restrições.
        </p>
      </section>

      <section className="termos-uso-section">
        <h2>15. Contato</h2>
        <p>
          Se você tiver alguma dúvida sobre estes Termos de Uso, entre em contato conosco através dos canais 
          de suporte disponíveis em nosso Serviço.
        </p>
      </section>
    </div>
  );
};

export default TermosUsoContent;

