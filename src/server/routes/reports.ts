import { Router, Response } from 'express';
import { prisma } from '../db';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import { generateAIInsights } from '../services/aiService';

const router = Router();

router.use(authMiddleware);

// GET /api/reports/dashboard
router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();

    // Início do dia de hoje (00:00:00)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Início desta semana (últimos 7 dias)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    // Início deste mês (30 dias)
    const startOfMonth = new Date(now);
    startOfMonth.setDate(startOfMonth.getDate() - 30);

    // 1. Stat Cards
    const [sobrasHoje, sobrasSemana, sobrasMes, activeProductsCount] = await Promise.all([
      prisma.sobra.aggregate({
        where: { data_sobra: { gte: startOfToday } },
        _sum: { valor_perda: true },
      }),
      prisma.sobra.aggregate({
        where: { data_sobra: { gte: startOfWeek } },
        _sum: { valor_perda: true },
      }),
      prisma.sobra.aggregate({
        where: { data_sobra: { gte: startOfMonth } },
        _sum: { valor_perda: true },
      }),
      prisma.product.count({
        where: { ativo: true },
      }),
    ]);

    const desperdicioHoje = sobrasHoje._sum.valor_perda || 0;
    const desperdicioSemana = sobrasSemana._sum.valor_perda || 0;
    const desperdicioMes = sobrasMes._sum.valor_perda || 0;

    // 2. Histórico de Sobras (Gráfico de Barras com Filtros)
    const allSobras = await prisma.sobra.findMany({
      where: { data_sobra: { gte: startOfMonth } },
      include: { produto: true, area: true },
      orderBy: { data_sobra: 'asc' },
    });

    // 3. Top Produtos por Desperdício (Gráfico de Rosca / Donut)
    const productLossMap: Record<string, { nome: string; valor: number; qtd: number; unidade: string }> = {};
    for (const s of allSobras) {
      if (!productLossMap[s.produto_id]) {
        productLossMap[s.produto_id] = {
          nome: s.produto.nome,
          valor: 0,
          qtd: 0,
          unidade: s.produto.unidade,
        };
      }
      productLossMap[s.produto_id].valor += s.valor_perda;
      productLossMap[s.produto_id].qtd += s.quantidade;
    }

    const sortedTopProducts = Object.values(productLossMap)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 6);

    const totalTopLoss = sortedTopProducts.reduce((acc, curr) => acc + curr.valor, 0);

    const topProductsDonut = sortedTopProducts.map((item) => ({
      nome: item.nome,
      valor: Number(item.valor.toFixed(2)),
      quantidade: Number(item.qtd.toFixed(2)),
      unidade: item.unidade,
      percentual: desperdicioMes > 0 ? Number(((item.valor / desperdicioMes) * 100).toFixed(1)) : 0,
    }));

    return res.json({
      stats: {
        desperdicioHoje: Number(desperdicioHoje.toFixed(2)),
        desperdicioSemana: Number(desperdicioSemana.toFixed(2)),
        desperdicioMes: Number(desperdicioMes.toFixed(2)),
        produtosAtivos: activeProductsCount,
      },
      topProductsDonut,
      rawSobras: allSobras,
    });
  } catch (error) {
    console.error('Erro no relatório do Dashboard:', error);
    return res.status(500).json({ error: 'Erro ao gerar dados do Dashboard' });
  }
});

// GET /api/reports/aproveitamento
router.get('/aproveitamento', async (req: AuthRequest, res: Response) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [entradas, sobras, products] = await Promise.all([
      prisma.entrada.findMany({
        where: { data_entrada: { gte: thirtyDaysAgo } },
        include: { produto: true },
      }),
      prisma.sobra.findMany({
        where: { data_sobra: { gte: thirtyDaysAgo } },
        include: { produto: true },
      }),
      prisma.product.findMany({
        where: { ativo: true },
      }),
    ]);

    const totalEntradasValor = entradas.reduce((acc, curr) => acc + curr.valor_total, 0);
    const totalSobrasValor = sobras.reduce((acc, curr) => acc + curr.valor_perda, 0);

    const consumoReal = Math.max(0, totalEntradasValor - totalSobrasValor);
    const aproveitamentoMedio = totalEntradasValor > 0
      ? Number(((consumoReal / totalEntradasValor) * 100).toFixed(1))
      : 100;

    // Tabela de Detalhamento por Produto
    const productStatsMap: Record<string, {
      produtoId: string;
      nome: string;
      unidade: string;
      entradaQtd: number;
      entradaValor: number;
      sobraQtd: number;
      sobraValor: number;
    }> = {};

    for (const p of products) {
      productStatsMap[p.id] = {
        produtoId: p.id,
        nome: p.nome,
        unidade: p.unidade,
        entradaQtd: 0,
        entradaValor: 0,
        sobraQtd: 0,
        sobraValor: 0,
      };
    }

    for (const e of entradas) {
      if (productStatsMap[e.produto_id]) {
        productStatsMap[e.produto_id].entradaQtd += e.quantidade;
        productStatsMap[e.produto_id].entradaValor += e.valor_total;
      }
    }

    for (const s of sobras) {
      if (productStatsMap[s.produto_id]) {
        productStatsMap[s.produto_id].sobraQtd += s.quantidade;
        productStatsMap[s.produto_id].sobraValor += s.valor_perda;
      }
    }

    const detailTable = Object.values(productStatsMap)
      .filter((item) => item.entradaQtd > 0 || item.sobraQtd > 0)
      .map((item) => {
        const consumoValor = Math.max(0, item.entradaValor - item.sobraValor);
        const consumoQtd = Math.max(0, item.entradaQtd - item.sobraQtd);
        const percentAproveitamento = item.entradaValor > 0
          ? Number(((consumoValor / item.entradaValor) * 100).toFixed(1))
          : (item.sobraValor > 0 ? 0 : 100);

        return {
          ...item,
          entradaQtd: Number(item.entradaQtd.toFixed(2)),
          entradaValor: Number(item.entradaValor.toFixed(2)),
          sobraQtd: Number(item.sobraQtd.toFixed(2)),
          sobraValor: Number(item.sobraValor.toFixed(2)),
          consumoQtd: Number(consumoQtd.toFixed(2)),
          consumoValor: Number(consumoValor.toFixed(2)),
          aproveitamentoPct: Math.min(100, Math.max(0, percentAproveitamento)),
        };
      })
      .sort((a, b) => b.entradaValor - a.entradaValor);

    // Gráfico Agrupado Entrada vs Sobra (por semanas dos últimos 30 dias)
    const timelineWeeks: Record<string, { semana: string; entrada: number; sobra: number }> = {};

    for (let i = 3; i >= 0; i--) {
      const label = `Semana ${4 - i}`;
      timelineWeeks[label] = { semana: label, entrada: 0, sobra: 0 };
    }

    const nowTime = new Date().getTime();
    const dayMs = 24 * 60 * 60 * 1000;

    for (const e of entradas) {
      const daysAgo = Math.floor((nowTime - new Date(e.data_entrada).getTime()) / dayMs);
      const weekIndex = Math.min(3, Math.floor(daysAgo / 7));
      const label = `Semana ${4 - weekIndex}`;
      if (timelineWeeks[label]) {
        timelineWeeks[label].entrada += e.valor_total;
      }
    }

    for (const s of sobras) {
      const daysAgo = Math.floor((nowTime - new Date(s.data_sobra).getTime()) / dayMs);
      const weekIndex = Math.min(3, Math.floor(daysAgo / 7));
      const label = `Semana ${4 - weekIndex}`;
      if (timelineWeeks[label]) {
        timelineWeeks[label].sobra += s.valor_perda;
      }
    }

    const groupedChartData = Object.values(timelineWeeks).map(item => ({
      semana: item.semana,
      entrada: Number(item.entrada.toFixed(2)),
      sobra: Number(item.sobra.toFixed(2)),
    }));

    return res.json({
      stats: {
        totalEntradasMes: Number(totalEntradasValor.toFixed(2)),
        totalSobrasMes: Number(totalSobrasValor.toFixed(2)),
        consumoReal: Number(consumoReal.toFixed(2)),
        aproveitamentoMedio,
      },
      groupedChartData,
      detailTable,
    });
  } catch (error) {
    console.error('Erro no relatório de Aproveitamento:', error);
    return res.status(500).json({ error: 'Erro ao gerar dados de Aproveitamento' });
  }
});

// POST /api/reports/ai-insights
router.post('/ai-insights', async (req: AuthRequest, res: Response) => {
  try {
    const insights = await generateAIInsights();
    return res.json(insights);
  } catch (error) {
    console.error('Erro ao gerar AI Insights:', error);
    return res.status(500).json({ error: 'Erro ao processar inteligência de insights' });
  }
});

export default router;
