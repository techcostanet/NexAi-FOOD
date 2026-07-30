import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

let resendClient: Resend | null = null;
if (RESEND_API_KEY && !RESEND_API_KEY.includes('mock')) {
  resendClient = new Resend(RESEND_API_KEY);
}

export async function sendPasswordResetEmail(email: string, token: string, userName: string) {
  const resetLink = `${FRONTEND_URL}/reset-password?token=${token}`;

  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #fcfbf9; padding: 40px 20px; color: #292524;">
      <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e7e5e0; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background-color: #f0f4e8; padding: 12px; border-radius: 50%; color: #556b2f; margin-bottom: 12px;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
          </div>
          <h2 style="color: #556b2f; margin: 0; font-size: 24px; font-weight: 700;">Controle de Sobras</h2>
          <p style="color: #78716c; font-size: 14px; margin-top: 4px;">SaaS de Gestão de Estoque e Aproveitamento</p>
        </div>

        <hr style="border: 0; border-top: 1px solid #f2f0ea; margin: 20px 0;" />

        <h3 style="color: #1c1917; font-size: 18px; margin-top: 0;">Olá, ${userName}!</h3>
        <p style="line-height: 1.6; color: #44403c; font-size: 15px;">
          Recebemos uma solicitação para redefinir a senha da sua conta no sistema <strong>Controle de Sobras</strong>.
        </p>
        <p style="line-height: 1.6; color: #44403c; font-size: 15px;">
          Clique no botão abaixo para escolher uma nova senha de acesso. Este link é válido por 1 hora.
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetLink}" style="background-color: #556b2f; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 2px 4px rgba(85,107,47,0.3);">
            Redefinir Minha Senha
          </a>
        </div>

        <p style="font-size: 13px; color: #78716c; line-height: 1.5;">
          Se você não solicitou a alteração de senha, por favor ignore este e-mail. Sua conta continuará segura.
        </p>

        <hr style="border: 0; border-top: 1px solid #f2f0ea; margin: 24px 0 16px 0;" />

        <div style="text-align: center; font-size: 12px; color: #a8a29e;">
          <p style="margin: 4px 0;">Desenvolvido por Tech Costa Systems © 2026 - v1.5.0</p>
          <p style="margin: 0; color: #d6d3d1;">Se o botão não funcionar, copie este link: <br/><a href="${resetLink}" style="color: #6b8e23;">${resetLink}</a></p>
        </div>
      </div>
    </div>
  `;

  if (resendClient) {
    try {
      await resendClient.emails.send({
        from: 'Controle de Sobras <suporte@controledesobras.com.br>',
        to: [email],
        subject: '🔐 Recuperação de Senha - Controle de Sobras',
        html: htmlContent,
      });
      console.log(`[RESEND] E-mail de recuperação enviado com sucesso para ${email}`);
      return { success: true, mode: 'resend' };
    } catch (error) {
      console.error('[RESEND] Erro ao enviar e-mail via Resend API:', error);
      // Fallback local se falhar
    }
  }

  // Fallback para desenvolvimento / ambiente sem chave real do Resend
  console.log('\n======================================================');
  console.log('📧 [MOCK EMAIL SERVICE / DEV RESEND FALLBACK]');
  console.log(`Para: ${email}`);
  console.log(`Assunto: 🔐 Recuperação de Senha - Controle de Sobras`);
  console.log(`Link de Redefinição: ${resetLink}`);
  console.log(`Token: ${token}`);
  console.log('======================================================\n');

  return { success: true, mode: 'mock', resetLink };
}
