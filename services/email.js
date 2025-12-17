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

// Enviar email de recuperação de senha para múltiplos usuários
const enviarEmailRecuperacaoMultiplos = async (email, usuariosComTokens) => {
  try {
    const transporter = await createTransporter();
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    
    // Criar lista de usuários com seus links
    const usuariosList = usuariosComTokens.map((item, index) => `
      <div style="background-color: #fff; padding: 15px; margin: 10px 0; border-left: 4px solid #FF6B35; border-radius: 4px;">
        <p style="margin: 0 0 10px 0;"><strong>Usuário ${index + 1}: ${item.username}</strong></p>
        <div style="text-align: center; margin: 15px 0;">
          <a href="${baseUrl}/reset-password?token=${item.token}" style="display: inline-block; padding: 10px 25px; background-color: #FF6B35; color: white; text-decoration: none; border-radius: 5px;">Redefinir Senha para ${item.username}</a>
        </div>
        <p style="font-size: 12px; color: #666; margin: 10px 0 0 0; word-break: break-all;">Link: ${baseUrl}/reset-password?token=${item.token}</p>
      </div>
    `).join('');

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@calculadora.com',
      to: email,
      subject: 'Recuperação de Senha - Múltiplas Contas - Recalcula Preço',
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
            .footer {
              margin-top: 20px;
              font-size: 12px;
              color: #666;
              text-align: center;
            }
            .warning {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Recuperação de Senha</h1>
            </div>
            <div class="content">
              <p>Olá!</p>
              <p>Recebemos uma solicitação para redefinir a senha. Encontramos <strong>${usuariosComTokens.length} conta(s)</strong> associada(s) a este email.</p>
              
              <div class="warning">
                <p><strong>⚠️ Selecione a conta que deseja recuperar:</strong></p>
              </div>
              
              ${usuariosList}
              
              <p style="margin-top: 30px;"><strong>⚠️ Importante:</strong></p>
              <ul>
                <li>Cada link é único e só funciona para a conta específica</li>
                <li>Os links expiram em 1 hora</li>
                <li>Se você não solicitou esta recuperação, ignore este email</li>
              </ul>
            </div>
            <div class="footer">
              <p>Este é um email automático, por favor não responda.</p>
              <p>&copy; ${new Date().getFullYear()} Recalcula Preço</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Recuperação de Senha - Múltiplas Contas
        
        Encontramos ${usuariosComTokens.length} conta(s) associada(s) a este email.
        
        Selecione a conta que deseja recuperar:
        
        ${usuariosComTokens.map((item, index) => `
        ${index + 1}. Usuário: ${item.username}
           Link: ${baseUrl}/reset-password?token=${item.token}
        `).join('\n')}
        
        Cada link é único e expira em 1 hora.
        Se você não solicitou esta recuperação, ignore este email.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    if (!process.env.SMTP_HOST && !process.env.SMTP_USER) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('\n═══════════════════════════════════════════════════════');
      console.log('📧 EMAIL DE RECUPERAÇÃO (MÚLTIPLOS USUÁRIOS) - MODO DESENVOLVIMENTO');
      console.log('═══════════════════════════════════════════════════════');
      console.log('Para:', email);
      console.log('Usuários encontrados:', usuariosComTokens.length);
      console.log('\n🔗 LINK DE PREVIEW (clique para ver o email):');
      console.log(previewUrl);
      console.log('═══════════════════════════════════════════════════════\n');
    } else {
      console.log(`✅ Email de recuperação (múltiplos usuários) enviado para: ${email} (${usuariosComTokens.length} conta(s))`);
    }
    
    return info;
  } catch (error) {
    console.error('Erro ao enviar email de recuperação (múltiplos usuários):', error);
    throw error;
  }
};

// Enviar email de recuperação de senha (usuário único)
const enviarEmailRecuperacao = async (email, token, username) => {
  try {
    const transporter = await createTransporter();
    
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;
    
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@calculadora.com',
      to: email,
      subject: 'Recuperação de Senha - Recalcula Preço',
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
              <p>&copy; ${new Date().getFullYear()} Recalcula Preço</p>
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

// Enviar email de validação
const enviarEmailValidacao = async (email, token, username) => {
  try {
    // Validar se o token foi fornecido
    if (!token || token.trim().length === 0) {
      throw new Error('Token de validação não fornecido ou inválido');
    }
    
    const transporter = await createTransporter();
    
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const validationUrl = `${baseUrl}/validar-email?token=${token}`;
    
    console.log(`\n📧 Preparando envio de email de validação:`);
    console.log(`   Para: ${email}`);
    console.log(`   Username: ${username}`);
    console.log(`   Token: ${token.substring(0, 20)}...`);
    console.log(`   URL de validação: ${validationUrl}`);
    
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@calculadora.com',
      to: email,
      subject: 'Valide seu email - Recalcula Preço',
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
              <h1>Validação de Email</h1>
            </div>
            <div class="content">
              <p>Olá, <strong>${username}</strong>!</p>
              <p>Obrigado por se cadastrar no Recalcula Preço!</p>
              <p>Para continuar usando o sistema após adquirir um plano, você precisa validar seu email.</p>
              <p>Clique no botão abaixo para validar seu email:</p>
              <div style="text-align: center;">
                <a href="${validationUrl}" class="button">Validar Email</a>
              </div>
              <div class="token-info">
                <p><strong>Ou copie e cole este link no seu navegador:</strong></p>
                <p style="word-break: break-all; color: #666;">${validationUrl}</p>
              </div>
              <p><strong>Este link expira em 7 dias.</strong></p>
              <p>Se você não se cadastrou, ignore este email.</p>
            </div>
            <div class="footer">
              <p>Este é um email automático, por favor não responda.</p>
              <p>&copy; ${new Date().getFullYear()} Recalcula Preço</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Olá, ${username}!
        
        Obrigado por se cadastrar no Recalcula Preço!
        
        Para continuar usando o sistema após adquirir um plano, você precisa validar seu email.
        
        Acesse o link abaixo para validar:
        ${validationUrl}
        
        Este link expira em 7 dias.
        
        Se você não se cadastrou, ignore este email.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    // Se estiver usando Ethereal Email, mostrar o link de preview no console
    if (!process.env.SMTP_HOST && !process.env.SMTP_USER) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('\n═══════════════════════════════════════════════════════');
      console.log('📧 EMAIL DE VALIDAÇÃO ENVIADO (MODO DESENVOLVIMENTO)');
      console.log('═══════════════════════════════════════════════════════');
      console.log('Para:', email);
      console.log('Assunto:', mailOptions.subject);
      console.log('\n🔗 LINK DE PREVIEW (clique para ver o email):');
      console.log(previewUrl);
      console.log('═══════════════════════════════════════════════════════\n');
    } else {
      // Log detalhado para produção
      console.log(`\n📧 Email de validação enviado:`);
      console.log(`   Para: ${email}`);
      console.log(`   De: ${mailOptions.from}`);
      console.log(`   Assunto: ${mailOptions.subject}`);
      console.log(`   MessageId: ${info.messageId || 'N/A'}`);
      console.log(`   Response: ${info.response || 'N/A'}`);
      console.log(`   ⚠️  NOTA: Este log indica que o email foi aceito pelo servidor SMTP.`);
      console.log(`   ⚠️  Se o email não chegou, verifique:`);
      console.log(`      1. Pasta de spam/lixo eletrônico`);
      console.log(`      2. Filtros de email do provedor`);
      console.log(`      3. Logs do SendGrid (se estiver usando)`);
      console.log(`      4. BASE_URL está correto? (atual: ${baseUrl})`);
    }
    
    return info;
  } catch (error) {
    console.error('Erro ao enviar email de validação:', error);
    throw error;
  }
};

module.exports = {
  enviarEmailRecuperacao,
  enviarEmailRecuperacaoMultiplos,
  enviarEmailValidacao
};

