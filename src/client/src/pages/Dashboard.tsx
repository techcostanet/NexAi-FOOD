import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingDown,
  Calendar,
  AlertTriangle,
  PackageCheck,
  BarChart2,
  LineChart as LineChartIcon,
  AreaChart as AreaChartIcon,
  PieChart as PieChartIcon,
  Filter,
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
  LabelList,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '../services/api';
import { StatCard } from '../components/StatCard';
import { TopProductDonut } from '../types';
import { parseLocalDate } from '../utils/dateUtils';

export const Dashboard: React.FC = () => {
  const now = new Date();
  const currentMonthStr = (now.getMonth() + 1).toString().padStart(2, '0');
  const currentYearStr = now.getFullYear().toString();

  // Filtro de Mês e Ano para a Dashboard
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [selectedYear, setSelectedYear] = useState<string>(currentYearStr);

  const [rawSobras, setRawSobras] = useState<any[]>([]);
  const [produtosAtivosCount, setProdutosAtivosCount] = useState<number>(0);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros do Gráfico 1: Histórico de Sobras
  const [metric, setMetric] = useState<'valor' | 'quantidade'>('valor');
  const [period, setPeriod] = useState<'dia' | 'semana'>('dia');
  const [chartTypeMain, setChartTypeMain] = useState<'bar' | 'line' | 'area'>('bar');

  // Filtros do Gráfico 2: Top Produtos
  const [chartTypeTop, setChartTypeTop] = useState<'donut' | 'pie' | 'bar'>('donut');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [resDash, resProds] = await Promise.all([
        api.get('/reports/dashboard'),
        api.get('/products'),
      ]);

      const sobras = resDash.data.rawSobras || [];
      const prods = resProds.data.products || [];

      setRawSobras(sobras);
      setProductsList(prods);
      setProdutosAtivosCount(prods.filter((p: any) => p.ativo).length);
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

  // Sobras Filtradas pelo Mês e Ano Selecionados
  const filteredSobras = useMemo(() => {
    return rawSobras.filter((s) => {
      const d = parseLocalDate(s.data_sobra || s.criado_em);
      const mStr = (d.getMonth() + 1).toString().padStart(2, '0');
      const yStr = d.getFullYear().toString();

      const monthMatch = selectedMonth === 'ALL' || mStr === selectedMonth;
      const yearMatch = selectedYear === 'ALL' || yStr === selectedYear;
      return monthMatch && yearMatch;
    });
  }, [rawSobras, selectedMonth, selectedYear]);

  // Recálculo Dinâmico dos Cards de Estatística
  const stats = useMemo(() => {
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0).getTime();
    const sevenDaysAgo = todayLocal - 7 * 24 * 60 * 60 * 1000;

    let desperdicioHoje = 0;
    let desperdicioSemana = 0;
    let desperdicioMes = 0;

    filteredSobras.forEach((s) => {
      const val = s.valor_perda || 0;
      desperdicioMes += val;

      const itemTime = parseLocalDate(s.data_sobra || s.criado_em).getTime();
      if (itemTime === todayLocal) {
        desperdicioHoje += val;
      }
      if (itemTime >= sevenDaysAgo) {
        desperdicioSemana += val;
      }
    });

    return {
      desperdicioHoje,
      desperdicioSemana,
      desperdicioMes,
      produtosAtivos: produtosAtivosCount,
    };
  }, [filteredSobras, produtosAtivosCount]);

  // Recálculo do Top Produtos por Desperdício
  const topProducts = useMemo<TopProductDonut[]>(() => {
    const productLossMap: Record<string, { nome: string; valor: number; qtd: number; unidade: string }> = {};

    filteredSobras.forEach((s: any) => {
      const prod = productsList.find((p: any) => p.id === s.produto_id) || s.produto || { nome: 'Outros', unidade: 'kg' };
      const pName = prod.nome || 'Outros';
      const pUnit = prod.unidade || 'kg';
      if (!productLossMap[pName]) {
        productLossMap[pName] = { nome: pName, valor: 0, qtd: 0, unidade: pUnit };
      }
      productLossMap[pName].valor += s.valor_perda || 0;
      productLossMap[pName].qtd += s.quantidade || 0;
    });

    const totalMes = stats.desperdicioMes;

    return Object.values(productLossMap)
      .map((item) => ({
        nome: item.nome,
        valor: Number(item.valor.toFixed(2)),
        quantidade: Number(item.qtd.toFixed(2)),
        unidade: item.unidade,
        percentual: totalMes > 0 ? Number(((item.valor / totalMes) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 6);
  }, [filteredSobras, productsList, stats.desperdicioMes]);

  // Processar dados para o gráfico de histórico interativo (ordenado cronologicamente: dia mais novo à direita)
  const mainChartData = useMemo(() => {
    if (!filteredSobras.length) return [];

    const grouped: Record<string, { label: string; sortKey: number; valor: number }> = {};

    filteredSobras.forEach((s) => {
      let key = '';
      let sortKey = 0;
      const d = parseLocalDate(s.data_sobra || s.criado_em);

      if (period === 'dia') {
        key = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        // Data mais antiga à esquerda, dia mais recente à direita
        sortKey = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      } else {
        const dayOfMonth = d.getDate();
        const weekNum = Math.ceil(dayOfMonth / 7);
        key = `Sem. ${weekNum}`;
        sortKey = weekNum;
      }

      const val = metric === 'valor' ? (s.valor_perda || 0) : (s.quantidade || 0);
      if (!grouped[key]) {
        grouped[key] = { label: key, sortKey, valor: 0 };
      }
      grouped[key].valor += val;
    });

    return Object.values(grouped)
      .sort((a, b) => a.sortKey - b.sortKey)
      .map((item) => ({
        name: item.label,
        valor: Number(item.valor.toFixed(2)),
      }));
  }, [filteredSobras, period, metric]);

  const DONUT_COLORS = ['#dc2626', '#b91c1c', '#ef4444', '#f87171', '#991b1b', '#e11d48'];

  const meses = [
    { value: 'ALL', label: 'Todos os Meses' },
    { value: '01', label: 'Janeiro' },
    { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' },
    { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
  ];

  const anos = [
    { value: 'ALL', label: 'Todos os Anos' },
    { value: '2026', label: '2026' },
    { value: '2025', label: '2025' },
    { value: '2024', label: '2024' },
  ];

  const monthLabel = selectedMonth === 'ALL' ? 'Todos os Meses' : meses.find((m) => m.value === selectedMonth)?.label;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 0. Barra de Filtro por Mês e Ano */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#f0f4e8] text-[#556b2f]">
            <Filter className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900">Filtro de Período da Dashboard</h3>
            <p className="text-xs text-stone-500">Selecione o mês e ano para analisar o histórico de desperdício</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-600">Mês:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-stone-50 border border-stone-200 text-stone-900 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#556b2f]"
            >
              {meses.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-600">Ano:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-stone-50 border border-stone-200 text-stone-900 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#556b2f]"
            >
              {anos.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

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
          title={`Desperdício (${monthLabel})`}
          value={`R$ ${stats.desperdicioMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle={selectedMonth === 'ALL' ? 'Acumulado no período' : `Perda acumulada em ${monthLabel}`}
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
        {/* Gráfico 1: Histórico de Sobras */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-stone-100">
            <div>
              <h3 className="text-base font-bold text-stone-900">Histórico de Sobras</h3>
              <p className="text-xs text-stone-500">Acompanhe a evolução temporal das perdas por filtros</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
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
                  <BarChart data={mainChartData} margin={{ top: 25, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#a8a29e" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#a8a29e"
                      fontSize={11}
                      tickLine={false}
                      domain={[0, (dataMax: number) => Math.ceil((dataMax || 10) * 1.15)]}
                    />
                    <Bar dataKey="valor" fill="#dc2626" radius={[6, 6, 0, 0]} maxBarSize={48}>
                      <LabelList
                        dataKey="valor"
                        position="top"
                        offset={6}
                        fill="#dc2626"
                        fontSize={11}
                        fontWeight="bold"
                        formatter={(val: number) =>
                          metric === 'valor'
                            ? `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : `${val}`
                        }
                      />
                    </Bar>
                  </BarChart>
                ) : chartTypeMain === 'line' ? (
                  <LineChart data={mainChartData} margin={{ top: 25, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#a8a29e" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#a8a29e"
                      fontSize={11}
                      tickLine={false}
                      domain={[0, (dataMax: number) => Math.ceil((dataMax || 10) * 1.15)]}
                    />
                    <Line type="monotone" dataKey="valor" stroke="#dc2626" strokeWidth={3} dot={{ r: 5, fill: '#dc2626' }}>
                      <LabelList
                        dataKey="valor"
                        position="top"
                        offset={8}
                        fill="#dc2626"
                        fontSize={11}
                        fontWeight="bold"
                        formatter={(val: number) =>
                          metric === 'valor'
                            ? `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : `${val}`
                        }
                      />
                    </Line>
                  </LineChart>
                ) : (
                  <AreaChart data={mainChartData} margin={{ top: 25, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#a8a29e" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#a8a29e"
                      fontSize={11}
                      tickLine={false}
                      domain={[0, (dataMax: number) => Math.ceil((dataMax || 10) * 1.15)]}
                    />
                    <Area type="monotone" dataKey="valor" stroke="#dc2626" fill="#dc2626" fillOpacity={0.25} dot={{ r: 4, fill: '#dc2626' }}>
                      <LabelList
                        dataKey="valor"
                        position="top"
                        offset={8}
                        fill="#dc2626"
                        fontSize={11}
                        fontWeight="bold"
                        formatter={(val: number) =>
                          metric === 'valor'
                            ? `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : `${val}`
                        }
                      />
                    </Area>
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Gráfico 2: Top Produtos por Desperdício */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-base font-bold text-stone-900">Top Produtos por Desperdício</h3>
                <p className="text-xs text-stone-500">Maior impacto de perda no período</p>
              </div>

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
                Nenhum dado de perda disponível para o período.
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-44 h-44 shrink-0 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartTypeTop === 'bar' ? (
                      <BarChart layout="vertical" data={topProducts} margin={{ top: 5, right: 55, left: -25, bottom: 5 }}>
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="nome" stroke="#a8a29e" fontSize={10} tickLine={false} width={70} />
                        <Bar dataKey="valor" fill="#dc2626" radius={[0, 4, 4, 0]}>
                          <LabelList
                            dataKey="valor"
                            position="right"
                            offset={6}
                            fill="#dc2626"
                            fontSize={10}
                            fontWeight="bold"
                            formatter={(val: number) => `R$ ${Number(val).toFixed(2)}`}
                          />
                        </Bar>
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
                          {topProducts.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    )}
                  </ResponsiveContainer>
                </div>

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
    </div>
  );
};
