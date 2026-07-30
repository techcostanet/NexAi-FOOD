import { Router, Response } from 'express';
import { prisma } from '../db';
import { authMiddleware, AuthRequest } from '../middlewares/auth';

const router = Router();

router.use(authMiddleware);

// GET /api/products
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { search, ativo } = req.query;

    const where: any = {};
    if (search && typeof search === 'string') {
      where.nome = { contains: search };
    }
    if (ativo !== undefined && ativo !== '') {
      where.ativo = ativo === 'true';
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { nome: 'asc' },
      include: {
        _count: {
          select: { entradas: true, sobras: true },
        },
      },
    });

    return res.json({ products });
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    return res.status(500).json({ error: 'Erro ao buscar lista de produtos' });
  }
});

// POST /api/products
router.post('/', async (req: AuthRequest, res: Response) => {
  const { nome, unidade, custo_unitario } = req.body;

  if (!nome || !unidade || custo_unitario === undefined || custo_unitario < 0) {
    return res.status(400).json({ error: 'Preencha o nome, unidade e custo unitário válido' });
  }

  try {
    const existing = await prisma.product.findFirst({
      where: { nome: { equals: nome.trim() } },
    });

    if (existing) {
      return res.status(400).json({ error: 'Já existe um produto cadastrado com este nome' });
    }

    const product = await prisma.product.create({
      data: {
        nome: nome.trim(),
        unidade: unidade.trim(),
        custo_unitario: Number(custo_unitario),
        ativo: true,
      },
    });

    return res.status(201).json({ product, message: 'Produto cadastrado com sucesso' });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    return res.status(500).json({ error: 'Erro interno ao salvar novo produto' });
  }
});

// PUT /api/products/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { nome, unidade, custo_unitario, ativo } = req.body;

  if (!nome || !unidade || custo_unitario === undefined || custo_unitario < 0) {
    return res.status(400).json({ error: 'Campos nome, unidade e custo unitário são obrigatórios' });
  }

  try {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        nome: nome.trim(),
        unidade: unidade.trim(),
        custo_unitario: Number(custo_unitario),
        ativo: ativo !== undefined ? Boolean(ativo) : existing.ativo,
      },
    });

    return res.json({ product, message: 'Produto atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

// PATCH /api/products/:id/status
router.patch('/:id/status', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { ativo: !existing.ativo },
    });

    return res.json({ product: updated, message: `Status alterado para ${updated.ativo ? 'Ativo' : 'Inativo'}` });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao alterar status do produto' });
  }
});

// DELETE /api/products/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.product.delete({ where: { id } });
    return res.json({ message: 'Produto excluído com sucesso' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao excluir produto. Verifique se existem entradas ou sobras vinculadas.' });
  }
});

export default router;
