import { Router, Response } from 'express';
import { prisma } from '../db';
import { authMiddleware, AuthRequest } from '../middlewares/auth';

const router = Router();

router.use(authMiddleware);

// GET /api/entries
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const entries = await prisma.entrada.findMany({
      include: {
        produto: {
          select: { id: true, nome: true, unidade: true, custo_unitario: true },
        },
      },
      orderBy: { data_entrada: 'desc' },
    });

    return res.json({ entries });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao listar entradas de insumos' });
  }
});

// POST /api/entries
router.post('/', async (req: AuthRequest, res: Response) => {
  const { produto_id, quantidade, valor_total, data_entrada, observacao } = req.body;

  if (!produto_id || !quantidade || Number(quantidade) <= 0) {
    return res.status(400).json({ error: 'Selecione o produto e informe uma quantidade maior que zero' });
  }

  try {
    const product = await prisma.product.findUnique({ where: { id: produto_id } });
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    const qty = Number(quantidade);
    const calculatedTotal = valor_total !== undefined && Number(valor_total) > 0
      ? Number(valor_total)
      : qty * product.custo_unitario;

    const entry = await prisma.entrada.create({
      data: {
        produto_id,
        quantidade: qty,
        valor_total: calculatedTotal,
        data_entrada: data_entrada ? new Date(data_entrada) : new Date(),
        observacao: observacao ? observacao.trim() : null,
      },
      include: {
        produto: {
          select: { id: true, nome: true, unidade: true, custo_unitario: true },
        },
      },
    });

    return res.status(201).json({ entry, message: 'Entrada de insumo registrada com sucesso' });
  } catch (error) {
    console.error('Erro ao registrar entrada:', error);
    return res.status(500).json({ error: 'Erro ao registrar entrada no estoque' });
  }
});

// PUT /api/entries/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { produto_id, quantidade, valor_total, data_entrada, observacao } = req.body;

  try {
    const existing = await prisma.entrada.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Registro de entrada não encontrado' });
    }

    const prodId = produto_id || existing.produto_id;
    const product = await prisma.product.findUnique({ where: { id: prodId } });
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    const qty = quantidade !== undefined ? Number(quantidade) : existing.quantidade;
    const calculatedTotal = valor_total !== undefined && Number(valor_total) > 0
      ? Number(valor_total)
      : qty * product.custo_unitario;

    const entry = await prisma.entrada.update({
      where: { id },
      data: {
        produto_id: prodId,
        quantidade: qty,
        valor_total: calculatedTotal,
        data_entrada: data_entrada ? new Date(data_entrada) : existing.data_entrada,
        observacao: observacao !== undefined ? (observacao ? observacao.trim() : null) : existing.observacao,
      },
      include: {
        produto: {
          select: { id: true, nome: true, unidade: true, custo_unitario: true },
        },
      },
    });

    return res.json({ entry, message: 'Entrada atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar entrada:', error);
    return res.status(500).json({ error: 'Erro ao atualizar registro de entrada' });
  }
});

// DELETE /api/entries/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.entrada.delete({ where: { id } });
    return res.json({ message: 'Registro de entrada removido com sucesso' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao remover registro de entrada' });
  }
});

export default router;
