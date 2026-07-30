import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../db';
import { sendPasswordResetEmail } from '../services/emailService';
import { authMiddleware, AuthRequest } from '../middlewares/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-controle-de-sobras-key-2026';

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos' });
    }

    if (!user.ativo) {
      return res.status(403).json({ error: 'Sua conta de usuário está inativa. Entre em contato com o Administrador.' });
    }

    const isValidPassword = await bcrypt.compare(senha, user.senha_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos' });
    }

    const token = jwt.sign(
      { id: user.id, nome: user.nome, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        ativo: user.ativo,
        criado_em: user.criado_em,
      },
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ error: 'Erro interno no servidor ao realizar login' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Informe o e-mail cadastrado' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      // Por segurança, responder sucesso para evitar enumeração de usuários
      return res.json({ message: 'Se o e-mail estiver cadastrado, você receberá o link de redefinição de senha.' });
    }

    // Gerar token de redefinição aleatório
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hora

    await prisma.user.update({
      where: { id: user.id },
      data: {
        reset_token: resetToken,
        reset_token_expires: resetExpires,
      },
    });

    // Enviar e-mail (Resend com fallback mock)
    const emailResult = await sendPasswordResetEmail(user.email, resetToken, user.nome);

    return res.json({
      message: 'Instruções para redefinição de senha foram enviadas para seu e-mail.',
      mode: emailResult.mode,
      devResetLink: emailResult.mode === 'mock' ? emailResult.resetLink : undefined,
    });
  } catch (error) {
    console.error('Erro na solicitação de redefinição de senha:', error);
    return res.status(500).json({ error: 'Erro ao processar solicitação de recuperação de senha' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, novaSenha } = req.body;

  if (!token || !novaSenha) {
    return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
  }

  if (novaSenha.length < 6) {
    return res.status(400).json({ error: 'A nova senha deve ter no mínimo 6 caracteres' });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        reset_token: token,
        reset_token_expires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({ error: 'Token de redefinição inválido ou expirado. Solicite novamente.' });
    }

    const newPasswordHash = await bcrypt.hash(novaSenha, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        senha_hash: newPasswordHash,
        reset_token: null,
        reset_token_expires: null,
      },
    });

    return res.json({ message: 'Senha redefinida com sucesso! Você já pode realizar login.' });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    return res.status(500).json({ error: 'Erro interno ao redefinir a senha' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: { id: true, nome: true, email: true, role: true, ativo: true, criado_em: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao obter dados do usuário' });
  }
});

export default router;
