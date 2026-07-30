import { Router, Response } from 'express';
import { prisma } from '../db';
import { authMiddleware, AuthRequest } from '../middlewares/auth';

const router = Router();

router.use(authMiddleware);

// GET /api/waste
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const wasteList = await prisma.sobra.findMany({
      include: {
        produto: {
          select: { id: true, nome: true, unidade: true, custo_unitario: true },
        },
        area: {
          select: { id: true, nome: true },
        },
      },
      orderBy: { data_sobra: 'desc' },
    });

    return res.json({ waste: wasteList });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao listar registros de sobras' });
  }
});

// POST /api/waste
router.post('/', async (req: AuthRequest, res: Response) => {
  const { produto_id, quantidade, area_id, motivo, data_sobra } = req.body;

  if (!produto_id || !quantidade || Number(quantidade) <= 0 || !area_id) {
    return res.status(400).json({ error: 'Selecione o produto, área da cozinha e informe uma quantidade maior que zero' });
  }

  try {
    const product = await prisma.product.findUnique({ where: { id: produto_id } });
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    const area = await prisma.area.findUnique({ where: { id: area_id } });
    if (!area) {
      return res.status(404).json({ error: 'Área da cozinha não encontrada' });
    }

    const qty = Number(quantidade);
    const valorPerda = qty * product.custo_unitario;

    const sobra = await prisma.sobra.create({
      data: {
        produto_id,
        quantidade: qty,
        valor_perda: valorPerda,
        area_id,
        motivo: motivo ? motivo.trim() : 'Não especificado',
        data_sobra: data_sobra ? new Date(data_sobra) : new Date(),
      },
      include: {
        produto: {
          select: { id: true, nome: true, unidade: true, custo_unitario: true },
        },
        area: {
          select: { id: true, nome: true },
        },
      },
    });

    return res.status(201).json({ sobra, message: 'Registro de sobra/desperdício salvo com sucesso' });
  } catch (error) {
    console.error('Erro ao registrar sobra:', error);
    return res.status(500).json({ error: 'Erro interno ao salvar registro de sobra' });
  }
});

// PUT /api/waste/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { produto_id, quantidade, area_id, motivo, data_sobra } = req.body;

  try {
    const existing = await prisma.sobra.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Registro de sobra não encontrado' });
    }

    const prodId = produto_id || existing.produto_id;
    const product = await prisma.product.findUnique({ where: { id: prodId } });
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    const arId = area_id || existing.area_id;
    const area = await prisma.area.findUnique({ where: { id: arId } });
    if (!area) {
      return res.status(404).json({ error: 'Área da cozinha não encontrada' });
    }

    const qty = quantidade !== undefined ? Number(quantidade) : existing.quantidade;
    const valorPerda = qty * product.custo_unitario;

    const sobra = await prisma.sobra.update({
      where: { id },
      data: {
        produto_id: prodId,
        area_id: arId,
        quantidade: qty,
        valor_perda: valorPerda,
        motivo: motivo !== undefined ? (motivo ? motivo.trim() : 'Não especificado') : existing.motivo,
        data_sobra: data_sobra ? new Date(data_sobra) : existing.data_sobra,
      },
      include: {
        produto: {
          select: { id: true, nome: true, unidade: true, custo_unitario: true },
        },
        area: {
          select: { id: true, nome: true },
        },
      },
    });

    return res.json({ sobra, message: 'Registro de sobra atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar sobra:', error);
    return res.status(500).json({ error: 'Erro ao atualizar registro de sobra' });
  }
});

// DELETE /api/waste/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.sobra.delete({ where: { id } });
    return res.json({ message: 'Registro de sobra removido com sucesso' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao remover registro de sobra' });
  }
});

export default router;
