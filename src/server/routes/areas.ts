import { Router, Response } from 'express';
import { prisma } from '../db';
import { authMiddleware, AuthRequest } from '../middlewares/auth';

const router = Router();

router.use(authMiddleware);

// GET /api/areas
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const areas = await prisma.area.findMany({
      orderBy: { nome: 'asc' },
    });
    return res.json({ areas });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar áreas da cozinha' });
  }
});

export default router;
