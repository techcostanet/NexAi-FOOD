import React, { useState, useEffect } from 'react';
import {
  TrendingDown,
  Calendar,
  AlertTriangle,
  PackageCheck,
  Sparkles,
  RefreshCw,
  Info,
  ChevronRight,
  BarChart2,
  LineChart as LineChartIcon,
  AreaChart as AreaChartIcon,
  PieChart as PieChartIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '../services/api';
import { StatCard } from '../components/StatCard';
import { DashboardStats, TopProductDonut, AIInsightData } from '../types';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    desperdicioHoje: 0,
    desperdicioSemana: 0,
    desperdicioMes: 0,
    produtosAtivos: 0,
  });
  const [topProducts, setTopProducts] = useState<TopProductDonut[]>([]);
  const [rawSobras, setRawSobras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros do Gráfico 1: Histórico de Sobras
  const [metric, setMetric] = useState<'valor' | 'quantidade'>('valor');
  const [period, setPeriod] = useState<'dia' | 'semana'>('dia');
  const [chartTypeMain, setChartTypeMain] = useState<'bar' | 'line' | 'area'>('bar'); // 3 Opções de Gráfico 1

  // Filtros do Gráfico 2: Top Produtos
  const [chartTypeTop, setChartTypeTop] = useState<'donut' | 'pie' | 'bar'>('donut'); // 3 Opções de Gráfico 2

  // Estado dos Insights da IA
  const [aiData, setAiData] = useState<AIInsightData | null>(null);
  const [generatingAi, setGeneratingAi] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/dashboard');
      setStats(res.data.stats);
      setTopProducts(res.data.topProductsDonut || []);
      setRawSobras(res.data.rawSobras || []);
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const handleSync = () => fetchDashboardData();
    window.addEventListener('firestore:sync', handleSync);
    return () => window.removeEventListener('firestore:sync', handleSync);
  }, []);

  const handleGenerateAI = async () => {
    setGeneratingAi(true);
    try {
      const res = await api.post('/reports/ai-insights');
      setAiData(res.data);
    } catch (err) {
      console.error('Erro ao gerar insights:', err);
    } finally {
      setGeneratingAi(false);
    }
  };

  // Processar dados para o gráfico de histórico interativo
  const processBarChartData = () => {
    if (!rawSobras.length) return [];

    const grouped: Record<string, number> = {};

    rawSobras.forEach((s) => {
      let key = '';

      if (period === 'dia') {
        const d = new Date(s.data_sobra);
        key = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      } else {
        const d = new Date(s.data_sobra);
        const dayOfMonth = d.getDate();
        const weekNum = Math.ceil(dayOfMonth / 7);
        key = `Sem. ${weekNum}`;
      }

      const val = metric === 'valor' ? s.valor_perda : s.quantidade;
      grouped[key] = (grouped[key] || 0) + val;
    });

    return Object.keys(grouped).map((k) => ({
      name: k,
      valor: Number(grouped[k].toFixed(2)),
    }));
  };

  const mainChartData = processBarChartData();

  // Cores do gráfico Donut
  const DONUT_COLORS = ['#ea580c', '#c2410c', '#f97316', '#fb923c', '#556b2f', '#8fad72'];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Cards do Topo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Desperdício Hoje"
          value={`R$ ${stats.desperdicioHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle="Registros do dia atual"
          icon={TrendingDown}
          variant="terracotta"
        />

        <StatCard
          title="Desperdício Semana"
          value={`R$ ${stats.desperdicioSemana.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle="Últimos 7 dias acumulados"
          icon={Calendar}
          variant="terracotta"
        />

        <StatCard
          title="Desperdício Mês"
          value={`R$ ${stats.desperdicioMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle="Perda acumulada em 30 dias"
          icon={AlertTriangle}
          variant="terracotta"
        />

        <StatCard
          title="Produtos Ativos"
          value={stats.produtosAtivos}
          subtitle="Catálogo disponível no estoque"
          icon={PackageCheck}
          variant="olive"
        />
      </div>

      {/* 2. Seção dos Gráficos em Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Gráfico 1: Histórico de Sobras (com 3 Opções de Visualização) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-stone-100">
            <div>
              <h3 className="text-base font-bold text-stone-900">Histórico de Sobras</h3>
              <p className="text-xs text-stone-500">Acompanhe a evolução temporal das perdas por filtros</p>
            </div>

            {/* Controles de Filtros e 3 Opções de Gráfico */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Métrica */}
              <div className="flex bg-[#fcfbf9] p-1 rounded-xl border border-stone-200">
                <button
                  onClick={() => setMetric('valor')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    metric === 'valor' ? 'bg-[#ea580c] text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  R$
                </button>
                <button
                  onClick={() => setMetric('quantidade')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    metric === 'quantidade' ? 'bg-[#ea580c] text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Qtd
                </button>
              </div>

              {/* Período */}
              <div className="flex bg-[#fcfbf9] p-1 rounded-xl border border-stone-200">
                <button
                  onClick={() => setPeriod('dia')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    period === 'dia' ? 'bg-[#556b2f] text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Dia
                </button>
                <button
                  onClick={() => setPeriod('semana')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    period === 'semana' ? 'bg-[#556b2f] text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Semana
                </button>
              </div>

              {/* 3 Seletores de Gráfico */}
              <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200">
                <button
                  onClick={() => setChartTypeMain('bar')}
                  title="Gráfico de Barras"
                  className={`p-1.5 rounded-lg transition-all ${
                    chartTypeMain === 'bar' ? 'bg-[#556b2f] text-white shadow-2xs' : 'text-stone-600'
                  }`}
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setChartTypeMain('line')}
                  title="Gráfico de Linhas"
                  className={`p-1.5 rounded-lg transition-all ${
                    chartTypeMain === 'line' ? 'bg-[#556b2f] text-white shadow-2xs' : 'text-stone-600'
                  }`}
                >
                  <LineChartIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setChartTypeMain('area')}
                  title="Gráfico de Área"
                  className={`p-1.5 rounded-lg transition-all ${
                    chartTypeMain === 'area' ? 'bg-[#556b2f] text-white shadow-2xs' : 'text-stone-600'
                  }`}
                >
                  <AreaChartIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Renderização do Gráfico com 3 Estilos Alternáveis */}
          {loading ? (
            <div className="h-72 flex items-center justify-center text-stone-400 text-xs">Carregando gráfico...</div>
          ) : mainChartData.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-stone-400 text-xs">
              Nenhuma sobra registrada para o período selecionado.
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {chartTypeMain === 'bar' ? (
                  <BarChart data={mainChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#a8a29e" fontSize={11} tickLine={false} />
                    <YAxis stroke="#a8a29e" fontSize={11} tickLine={false} />
                    <Tooltip
                      formatter={(val: number) =>
                        metric === 'valor'
                          ? [`R$ ${val.toFixed(2)}`, 'Perda Financeira']
                          : [`${val} unidades/kg`, 'Quantidade Descartada']
                      }
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e7e5e0',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="valor" fill="#ea580c" radius={[6, 6, 0, 0]} maxBarSize={48} />
                  </BarChart>
                ) : chartTypeMain === 'line' ? (
                  <LineChart data={mainChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#a8a29e" fontSize={11} tickLine={false} />
                    <YAxis stroke="#a8a29e" fontSize={11} tickLine={false} />
                    <Tooltip
                      formatter={(val: number) =>
                        metric === 'valor'
                          ? [`R$ ${val.toFixed(2)}`, 'Perda Financeira']
                          : [`${val} unidades/kg`, 'Quantidade Descartada']
                      }
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e7e5e0',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                    <Line type="monotone" dataKey="valor" stroke="#ea580c" strokeWidth={3} dot={{ r: 5 }} />
                  </LineChart>
                ) : (
                  <AreaChart data={mainChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#a8a29e" fontSize={11} tickLine={false} />
                    <YAxis stroke="#a8a29e" fontSize={11} tickLine={false} />
                    <Tooltip
                      formatter={(val: number) =>
                        metric === 'valor'
                          ? [`R$ ${val.toFixed(2)}`, 'Perda Financeira']
                          : [`${val} unidades/kg`, 'Quantidade Descartada']
                      }
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e7e5e0',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                    <Area type="monotone" dataKey="valor" stroke="#ea580c" fill="#ea580c" fillOpacity={0.25} />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Gráfico 2: Top Produtos por Desperdício (Com 3 Opções de Visualização) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-base font-bold text-stone-900">Top Produtos por Desperdício</h3>
                <p className="text-xs text-stone-500">Maior impacto de perda no mês</p>
              </div>

              {/* 3 Opções do Gráfico 2: Donut, Pie, Horizontal Bar */}
              <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs">
                <button
                  onClick={() => setChartTypeTop('donut')}
                  title="Rosca / Donut"
                  className={`p-1.5 rounded-lg transition-all ${
                    chartTypeTop === 'donut' ? 'bg-[#ea580c] text-white shadow-2xs' : 'text-stone-600'
                  }`}
                >
                  <PieChartIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setChartTypeTop('pie')}
                  title="Pizza Cheia"
                  className={`p-1.5 rounded-lg transition-all ${
                    chartTypeTop === 'pie' ? 'bg-[#ea580c] text-white shadow-2xs' : 'text-stone-600'
                  }`}
                >
                  <PieChartIcon className="w-3.5 h-3.5 fill-current" />
                </button>
                <button
                  onClick={() => setChartTypeTop('bar')}
                  title="Barras Horizontais"
                  className={`p-1.5 rounded-lg transition-all ${
                    chartTypeTop === 'bar' ? 'bg-[#ea580c] text-white shadow-2xs' : 'text-stone-600'
                  }`}
                >
                  <BarChart2 className="w-3.5 h-3.5 rotate-90" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="h-56 flex items-center justify-center text-stone-400 text-xs">Carregando dados...</div>
            ) : topProducts.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-stone-400 text-xs">
                Nenhum dado de perda disponível.
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Visual Chart */}
                <div className="w-44 h-44 shrink-0 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartTypeTop === 'bar' ? (
                      <BarChart layout="vertical" data={topProducts} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="nome" stroke="#a8a29e" fontSize={10} tickLine={false} width={70} />
                        <Tooltip formatter={(val: number) => [`R$ ${val.toFixed(2)}`, 'Perda']} />
                        <Bar dataKey="valor" fill="#ea580c" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    ) : (
                      <PieChart>
                        <Pie
                          data={topProducts}
                          cx="50%"
                          cy="50%"
                          innerRadius={chartTypeTop === 'donut' ? 45 : 0}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="valor"
                        >
                          {topProducts.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(val: number) => [`R$ ${val.toFixed(2)}`, 'Perda']}
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            borderColor: '#e7e5e0',
                            borderRadius: '8px',
                            fontSize: '11px',
                          }}
                        />
                      </PieChart>
                    )}
                  </ResponsiveContainer>
                </div>

                {/* Legenda Detalhada em Lista */}
                <div className="w-full space-y-2 max-h-48 overflow-y-auto pr-1">
                  {topProducts.map((prod, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-stone-50 transition-colors">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length] }}
                        />
                        <span className="font-semibold text-stone-800 truncate" title={prod.nome}>
                          {prod.nome}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-stone-900">R$ {prod.valor.toFixed(2)}</span>
                        <span className="text-[10px] text-stone-400 block">
                          {prod.quantidade} {prod.unidade} ({prod.percentual}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Banner Inferior: Insights de IA */}
      <div className="bg-gradient-to-r from-[#f0f4e8] via-[#f8f9f3] to-white rounded-2xl border border-[#d4e1c5] p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#556b2f] text-white flex items-center justify-center shrink-0 shadow-md">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-stone-900">Insights de IA & Inteligência Operacional</h3>
                <span className="bg-[#556b2f] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  NOVO
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-1 max-w-2xl">
                Nossa IA analisa padrões de desperdício, picos de descarte por área e sugere ações corretivas imediatas para economizar no orçamento da cozinha.
              </p>
            </div>
          </div>

          <button
            onClick={handleGenerateAI}
            disabled={generatingAi}
            className="flex items-center justify-center gap-2 bg-[#556b2f] hover:bg-[#415224] text-white px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg shrink-0 disabled:opacity-60"
          >
            {generatingAi ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processando IA...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Gerar Insights de IA</span>
              </>
            )}
          </button>
        </div>

        {/* Exibição dos Insights gerados */}
        {aiData && (
          <div className="mt-6 pt-5 border-t border-[#d4e1c5] space-y-4 animate-fadeIn">
            <div className="p-3.5 bg-white rounded-xl border border-[#d4e1c5] text-xs text-stone-700">
              <p className="font-semibold text-stone-900 mb-1 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-[#556b2f]" />
                Resumo Executivo da IA:
              </p>
              <p className="leading-relaxed">{aiData.summary}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {aiData.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border text-xs bg-white ${
                    rec.type === 'critical'
                      ? 'border-red-200 text-red-900 bg-red-50/40'
                      : rec.type === 'warning'
                      ? 'border-amber-200 text-amber-900 bg-amber-50/40'
                      : 'border-[#d4e1c5] text-stone-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    {rec.type === 'critical' ? (
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[#556b2f]" />
                    )}
                    <span>{rec.title}</span>
                  </div>
                  <p className="text-stone-600 leading-relaxed">{rec.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
