import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middlewares/auth';

const router = Router();

router.use(authMiddleware);

// GET /api/users
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        ativo: true,
        criado_em: true,
      },
      orderBy: { nome: 'asc' },
    });

    return res.json({ users });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao listar usuários' });
  }
});

// POST /api/users (Apenas Admin)
router.post('/', adminMiddleware, async (req: AuthRequest, res: Response) => {
  const { nome, email, senha, role } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios' });
  }

  if (senha.length < 6) {
    return res.status(400).json({ error: 'A senha deve conter no mínimo 6 caracteres' });
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return res.status(400).json({ error: 'Já existe um usuário cadastrado com este e-mail' });
    }

    const passwordHash = await bcrypt.hash(senha, 10);

    const user = await prisma.user.create({
      data: {
        nome: nome.trim(),
        email: email.toLowerCase().trim(),
        senha_hash: passwordHash,
        role: role === 'Admin' ? 'Admin' : 'Comum',
        ativo: true,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        ativo: true,
        criado_em: true,
      },
    });

    return res.status(201).json({ user, message: 'Usuário cadastrado com sucesso' });
  } catch (error) {
    console.error('Erro ao cadastrar usuário:', error);
    return res.status(500).json({ error: 'Erro interno ao salvar novo usuário' });
  }
});

// PUT /api/users/:id (Admin ou Próprio Usuário)
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { nome, email, senha, role } = req.body;

  // Se não for admin, só pode editar o próprio perfil
  if (req.user?.role !== 'Admin' && req.user?.id !== id) {
    return res.status(403).json({ error: 'Você não tem permissão para alterar este usuário' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const updateData: any = {
      nome: nome ? nome.trim() : existing.nome,
      email: email ? email.toLowerCase().trim() : existing.email,
    };

    if (req.user?.role === 'Admin' && role) {
      updateData.role = role === 'Admin' ? 'Admin' : 'Comum';
    }

    if (senha && senha.trim() !== '') {
      if (senha.length < 6) {
        return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres' });
      }
      updateData.senha_hash = await bcrypt.hash(senha, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        ativo: true,
        criado_em: true,
      },
    });

    return res.json({ user, message: 'Dados do usuário atualizados' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao atualizar dados do usuário' });
  }
});

// PATCH /api/users/:id/status (Apenas Admin)
router.patch('/:id/status', adminMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (req.user?.id === id) {
    return res.status(400).json({ error: 'Não é possível desativar a sua própria conta ativa' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { ativo: !existing.ativo },
      select: { id: true, nome: true, email: true, role: true, ativo: true, criado_em: true },
    });

    return res.json({
      user: updated,
      message: `Acesso do usuário ${updated.ativo ? 'ativado' : 'desativado'} com sucesso`,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao alterar status do usuário' });
  }
});

// DELETE /api/users/:id (Apenas Admin)
router.delete('/:id', adminMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (req.user?.id === id) {
    return res.status(400).json({ error: 'Não é possível excluir a sua própria conta ativa' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    await prisma.user.delete({ where: { id } });
    return res.json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    return res.status(500).json({ error: 'Erro ao excluir usuário' });
  }
});

export default router;
