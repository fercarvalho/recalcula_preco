const nodemailer = require('nodemailer');

// Configuração do transporter de email
const createTransporter = async () => {
  // Se não houver configuração SMTP, usar Ethereal Email (modo desenvolvimento/teste)
  if (!process.env.SMTP_HOST && !process.env.SMTP_USER) {
    try {
      console.log('📧 Modo desenvolvimento: Criando conta Ethereal Email para testes...');
      // Criar conta de teste Ethereal
      const testAccount = await nodemailer.createTestAccount();
      console.log('✅ Conta Ethereal criada com sucesso!');
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    } catch (error) {
      console.error('❌ Erro ao criar conta Ethereal:', error.message);
      throw new Error('Não foi possível configurar o serviço de email. Configure SMTP no arquivo .env ou verifique sua conexão com a internet.');
    }
  }

  // Configuração SMTP para produção
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('Configuração SMTP incompleta. Defina SMTP_USER e SMTP_PASS no arquivo .env');
  }

  console.log('📧 Usando configuração SMTP:', process.env.SMTP_HOST);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true para 465, false para outras portas
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Enviar email de recuperação de senha
const enviarEmailRecuperacao = async (email, token, username) => {
  try {
    const transporter = await createTransporter();
    
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;
    
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@calculadora.com',
      to: email,
      subject: 'Recuperação de Senha - Calculadora de Reajuste',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #FF6B35;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 5px 5px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background-color: #FF6B35;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 20px;
              font-size: 12px;
              color: #666;
              text-align: center;
            }
            .token-info {
              background-color: #fff;
              padding: 15px;
              border-left: 4px solid #FF6B35;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Recuperação de Senha</h1>
            </div>
            <div class="content">
              <p>Olá, <strong>${username}</strong>!</p>
              <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
              <p>Clique no botão abaixo para redefinir sua senha:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Redefinir Senha</a>
              </div>
              <div class="token-info">
                <p><strong>Ou copie e cole este link no seu navegador:</strong></p>
                <p style="word-break: break-all; color: #666;">${resetUrl}</p>
              </div>
              <p><strong>Este link expira em 1 hora.</strong></p>
              <p>Se você não solicitou esta recuperação de senha, ignore este email.</p>
            </div>
            <div class="footer">
              <p>Este é um email automático, por favor não responda.</p>
              <p>&copy; ${new Date().getFullYear()} Calculadora de Reajuste</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Olá, ${username}!
        
        Recebemos uma solicitação para redefinir a senha da sua conta.
        
        Acesse o link abaixo para redefinir sua senha:
        ${resetUrl}
        
        Este link expira em 1 hora.
        
        Se você não solicitou esta recuperação de senha, ignore este email.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    // Se estiver usando Ethereal Email, mostrar o link de preview no console
    if (!process.env.SMTP_HOST && !process.env.SMTP_USER) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('\n═══════════════════════════════════════════════════════');
      console.log('📧 EMAIL DE RECUPERAÇÃO ENVIADO (MODO DESENVOLVIMENTO)');
      console.log('═══════════════════════════════════════════════════════');
      console.log('Para:', email);
      console.log('Assunto:', mailOptions.subject);
      console.log('\n🔗 LINK DE PREVIEW (clique para ver o email):');
      console.log(previewUrl);
      console.log('\n💡 DICA: Em produção, configure SMTP no arquivo .env');
      console.log('═══════════════════════════════════════════════════════\n');
    } else {
      console.log(`✅ Email de recuperação enviado para: ${email}`);
    }
    
    return info;
  } catch (error) {
    console.error('Erro ao enviar email de recuperação:', error);
    throw error;
  }
};

module.exports = {
  enviarEmailRecuperacao
};

