import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  PackagePlus,
  Trash2,
  PieChart as PieIcon,
  Filter,
  BarChart2,
  LineChart as LineChartIcon,
  AreaChart as AreaChartIcon,
  Calendar,
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
  Legend,
} from 'recharts';
import api from '../services/api';
import { StatCard } from '../components/StatCard';
import { parseLocalDate } from '../utils/dateUtils';

export const Aproveitamento: React.FC = () => {
  // Filtros de Período Pré-prontos
  const [selectedMonth, setSelectedMonth] = useState<string>('07'); // Default Julho
  const [selectedYear, setSelectedYear] = useState<string>('2026'); // Default 2026
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar'); // 3 opções de gráfico

  const [loading, setLoading] = useState(true);
  const [allEntradas, setAllEntradas] = useState<any[]>([]);
  const [allSobras, setAllSobras] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);

  // Estados calculados filtrados
  const [stats, setStats] = useState({
    totalEntradasMes: 0,
    totalSobrasMes: 0,
    consumoReal: 0,
    aproveitamentoMedio: 100,
  });
  const [groupedChartData, setGroupedChartData] = useState<any[]>([]);
  const [detailTable, setDetailTable] = useState<any[]>([]);

  const fetchRawData = async () => {
    setLoading(true);
    try {
      const [resReport, resProds] = await Promise.all([
        api.get('/reports/aproveitamento'),
        api.get('/products'),
      ]);

      const entradas = resReport.data.rawEntradas || [];
      const sobras = resReport.data.rawSobras || [];
      const prods = resProds.data.products || [];

      setAllEntradas(entradas);
      setAllSobras(sobras);
      setAllProducts(prods);
    } catch (err) {
      console.error('Erro ao carregar dados de aproveitamento:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRawData();
    const handleSync = () => fetchRawData();
    window.addEventListener('firestore:sync', handleSync);
    return () => window.removeEventListener('firestore:sync', handleSync);
  }, []);

  // Efeito para recalcular as métricas e gráficos sempre que o filtro de Mês/Ano for alterado
  useEffect(() => {
    if (allProducts.length === 0 && allEntradas.length === 0) return;

    // Filtrar entradas e sobras pelo mês e ano selecionados
    const filteredEntradas = allEntradas.filter((e) => {
      const d = parseLocalDate(e.data_entrada);
      const mStr = (d.getMonth() + 1).toString().padStart(2, '0');
      const yStr = d.getFullYear().toString();

      const monthMatch = selectedMonth === 'ALL' || mStr === selectedMonth;
      const yearMatch = selectedYear === 'ALL' || yStr === selectedYear;
      return monthMatch && yearMatch;
    });

    const filteredSobras = allSobras.filter((s) => {
      const d = parseLocalDate(s.data_sobra);
      const mStr = (d.getMonth() + 1).toString().padStart(2, '0');
      const yStr = d.getFullYear().toString();

      const monthMatch = selectedMonth === 'ALL' || mStr === selectedMonth;
      const yearMatch = selectedYear === 'ALL' || yStr === selectedYear;
      return monthMatch && yearMatch;
    });

    // 1. Calcular Totais
    const totalEntradasValor = filteredEntradas.reduce((acc, curr) => acc + (curr.valor_total || 0), 0);
    const totalSobrasValor = filteredSobras.reduce((acc, curr) => acc + (curr.valor_perda || 0), 0);
    const consumoReal = Math.max(0, totalEntradasValor - totalSobrasValor);
    const aproveitamentoMedio = totalEntradasValor > 0
      ? Number(((consumoReal / totalEntradasValor) * 100).toFixed(1))
      : 100;

    setStats({
      totalEntradasMes: Number(totalEntradasValor.toFixed(2)),
      totalSobrasMes: Number(totalSobrasValor.toFixed(2)),
      consumoReal: Number(consumoReal.toFixed(2)),
      aproveitamentoMedio,
    });

    // 2. Montar Tabela por Produto
    const productStatsMap: Record<string, any> = {};
    allProducts.forEach((p: any) => {
      productStatsMap[p.id] = {
        produtoId: p.id,
        nome: p.nome,
        unidade: p.unidade,
        entradaQtd: 0,
        entradaValor: 0,
        sobraQtd: 0,
        sobraValor: 0,
      };
    });

    filteredEntradas.forEach((e: any) => {
      if (productStatsMap[e.produto_id]) {
        productStatsMap[e.produto_id].entradaQtd += e.quantidade || 0;
        productStatsMap[e.produto_id].entradaValor += e.valor_total || 0;
      }
    });

    filteredSobras.forEach((s: any) => {
      if (productStatsMap[s.produto_id]) {
        productStatsMap[s.produto_id].sobraQtd += s.quantidade || 0;
        productStatsMap[s.produto_id].sobraValor += s.valor_perda || 0;
      }
    });

    const calculatedTable = Object.values(productStatsMap)
      .filter((item: any) => item.entradaQtd > 0 || item.sobraQtd > 0)
      .map((item: any) => {
        const cValor = Math.max(0, item.entradaValor - item.sobraValor);
        const cQtd = Math.max(0, item.entradaQtd - item.sobraQtd);
        const pct = item.entradaValor > 0
          ? Number(((cValor / item.entradaValor) * 100).toFixed(1))
          : (item.sobraValor > 0 ? 0 : 100);

        return {
          ...item,
          entradaQtd: Number(item.entradaQtd.toFixed(2)),
          entradaValor: Number(item.entradaValor.toFixed(2)),
          sobraQtd: Number(item.sobraQtd.toFixed(2)),
          sobraValor: Number(item.sobraValor.toFixed(2)),
          consumoQtd: Number(cQtd.toFixed(2)),
          consumoValor: Number(cValor.toFixed(2)),
          aproveitamentoPct: Math.min(100, Math.max(0, pct)),
        };
      })
      .sort((a, b) => b.entradaValor - a.entradaValor);

    setDetailTable(calculatedTable);

    // 3. Montar Gráficos por Semanas do Período
    const timelineWeeks: Record<string, { semana: string; entrada: number; sobra: number }> = {
      'Semana 1': { semana: 'Semana 1', entrada: 0, sobra: 0 },
      'Semana 2': { semana: 'Semana 2', entrada: 0, sobra: 0 },
      'Semana 3': { semana: 'Semana 3', entrada: 0, sobra: 0 },
      'Semana 4': { semana: 'Semana 4', entrada: 0, sobra: 0 },
    };

    filteredEntradas.forEach((e) => {
      const d = new Date(e.data_entrada);
      const dayOfMonth = d.getDate();
      const weekIdx = Math.min(4, Math.ceil(dayOfMonth / 7));
      const label = `Semana ${weekIdx}`;
      if (timelineWeeks[label]) timelineWeeks[label].entrada += e.valor_total || 0;
    });

    filteredSobras.forEach((s) => {
      const d = new Date(s.data_sobra);
      const dayOfMonth = d.getDate();
      const weekIdx = Math.min(4, Math.ceil(dayOfMonth / 7));
      const label = `Semana ${weekIdx}`;
      if (timelineWeeks[label]) timelineWeeks[label].sobra += s.valor_perda || 0;
    });

    const chartDataList = Object.values(timelineWeeks).map((item) => ({
      semana: item.semana,
      entrada: Number(item.entrada.toFixed(2)),
      sobra: Number(item.sobra.toFixed(2)),
    }));

    setGroupedChartData(chartDataList);
  }, [selectedMonth, selectedYear, allEntradas, allSobras, allProducts]);

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
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Barra de Filtros Pré-Prontos por Mês e Ano */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#f0f4e8] text-[#556b2f]">
            <Filter className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900">Filtro de Período de Aproveitamento</h3>
            <p className="text-xs text-stone-500">Selecione o mês e ano pré-prontos sem digitar datas</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Seletor Mês */}
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

          {/* Seletor Ano */}
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

          {/* Atalhos Rápidos */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 ml-auto md:ml-0">
            <button
              onClick={() => {
                setSelectedMonth('07');
                setSelectedYear('2026');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedMonth === '07' && selectedYear === '2026'
                  ? 'bg-[#556b2f] text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Jul/2026
            </button>
            <button
              onClick={() => {
                setSelectedMonth('06');
                setSelectedYear('2026');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedMonth === '06' && selectedYear === '2026'
                  ? 'bg-[#556b2f] text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Jun/2026
            </button>
            <button
              onClick={() => {
                setSelectedMonth('ALL');
                setSelectedYear('ALL');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedMonth === 'ALL' && selectedYear === 'ALL'
                  ? 'bg-[#556b2f] text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Geral
            </button>
          </div>
        </div>
      </div>

      {/* 1. Cards do Topo Atualizados Conforme Filtro */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Entradas (Período)"
          value={`R$ ${stats.totalEntradasMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle="Valor total de compras no período"
          icon={PackagePlus}
          variant="olive"
        />

        <StatCard
          title="Total Sobras (Período)"
          value={`R$ ${stats.totalSobrasMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle="Valor total de perdas no período"
          icon={Trash2}
          variant="terracotta"
        />

        <StatCard
          title="Consumo Real (Período)"
          value={`R$ ${stats.consumoReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle="Insumos efetivamente servidos"
          icon={PieIcon}
          variant="neutral"
        />

        <StatCard
          title="Aproveitamento Médio (%)"
          value={`${stats.aproveitamentoMedio.toFixed(1)}%`}
          subtitle="Eficiência do período selecionado"
          icon={TrendingUp}
          variant="olive"
          trend={{
            text: stats.aproveitamentoMedio >= 85 ? 'Excelente aproveitamento' : 'Abaixo da meta recomendada',
            isPositive: stats.aproveitamentoMedio >= 85,
          }}
        />
      </div>

      {/* 2. Gráfico Agrupado com 3 Opções de Visualização (Barras, Linhas, Área) */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-stone-100">
          <div>
            <h3 className="text-base font-bold text-stone-900">Comparativo Temporal: Entradas vs Sobras</h3>
            <p className="text-xs text-stone-500">
              Verde = Entradas (Investimento) | Vermelho = Sobras (Desperdício)
            </p>
          </div>

          {/* 3 Opções de Visualização de Gráfico */}
          <div className="flex items-center gap-1.5 bg-stone-100 p-1.5 rounded-xl border border-stone-200">
            <span className="text-[11px] font-bold text-stone-500 mr-1.5 pl-1">Tipo de Gráfico:</span>
            <button
              onClick={() => setChartType('bar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                chartType === 'bar'
                  ? 'bg-[#556b2f] text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Barras
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                chartType === 'line'
                  ? 'bg-[#556b2f] text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
              }`}
            >
              <LineChartIcon className="w-3.5 h-3.5" />
              Linhas
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                chartType === 'area'
                  ? 'bg-[#556b2f] text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
              }`}
            >
              <AreaChartIcon className="w-3.5 h-3.5" />
              Área
            </button>
          </div>
        </div>

        {loading ? (
          <div className="h-72 flex items-center justify-center text-stone-400 text-xs">Carregando gráfico...</div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={groupedChartData} margin={{ top: 25, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="semana" stroke="#a8a29e" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#a8a29e"
                    fontSize={11}
                    tickLine={false}
                    domain={[0, (dataMax: number) => Math.ceil((dataMax || 10) * 1.15)]}
                  />
                  <Legend
                    formatter={(value) => (value === 'entrada' ? 'Entrada (Insumo)' : 'Sobra (Desperdício)')}
                    wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                  />
                  <Bar dataKey="entrada" fill="#556b2f" name="entrada" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    <LabelList
                      dataKey="entrada"
                      position="top"
                      offset={6}
                      fill="#556b2f"
                      fontSize={10}
                      fontWeight="bold"
                      formatter={(val: number) =>
                        val > 0 ? `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''
                      }
                    />
                  </Bar>
                  <Bar dataKey="sobra" fill="#dc2626" name="sobra" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    <LabelList
                      dataKey="sobra"
                      position="top"
                      offset={6}
                      fill="#dc2626"
                      fontSize={10}
                      fontWeight="bold"
                      formatter={(val: number) =>
                        val > 0 ? `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''
                      }
                    />
                  </Bar>
                </BarChart>
              ) : chartType === 'line' ? (
                <LineChart data={groupedChartData} margin={{ top: 25, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="semana" stroke="#a8a29e" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#a8a29e"
                    fontSize={11}
                    tickLine={false}
                    domain={[0, (dataMax: number) => Math.ceil((dataMax || 10) * 1.15)]}
                  />
                  <Legend
                    formatter={(value) => (value === 'entrada' ? 'Entrada (Insumo)' : 'Sobra (Desperdício)')}
                    wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="entrada" stroke="#556b2f" strokeWidth={3} dot={{ r: 5, fill: '#556b2f' }} name="entrada">
                    <LabelList
                      dataKey="entrada"
                      position="top"
                      offset={8}
                      fill="#556b2f"
                      fontSize={10}
                      fontWeight="bold"
                      formatter={(val: number) =>
                        val > 0 ? `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''
                      }
                    />
                  </Line>
                  <Line type="monotone" dataKey="sobra" stroke="#dc2626" strokeWidth={3} dot={{ r: 5, fill: '#dc2626' }} name="sobra">
                    <LabelList
                      dataKey="sobra"
                      position="top"
                      offset={8}
                      fill="#dc2626"
                      fontSize={10}
                      fontWeight="bold"
                      formatter={(val: number) =>
                        val > 0 ? `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''
                      }
                    />
                  </Line>
                </LineChart>
              ) : (
                <AreaChart data={groupedChartData} margin={{ top: 25, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="semana" stroke="#a8a29e" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#a8a29e"
                    fontSize={11}
                    tickLine={false}
                    domain={[0, (dataMax: number) => Math.ceil((dataMax || 10) * 1.15)]}
                  />
                  <Legend
                    formatter={(value) => (value === 'entrada' ? 'Entrada (Insumo)' : 'Sobra (Desperdício)')}
                    wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="entrada" stroke="#556b2f" fill="#556b2f" fillOpacity={0.25} dot={{ r: 4, fill: '#556b2f' }} name="entrada">
                    <LabelList
                      dataKey="entrada"
                      position="top"
                      offset={8}
                      fill="#556b2f"
                      fontSize={10}
                      fontWeight="bold"
                      formatter={(val: number) =>
                        val > 0 ? `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''
                      }
                    />
                  </Area>
                  <Area type="monotone" dataKey="sobra" stroke="#dc2626" fill="#dc2626" fillOpacity={0.25} dot={{ r: 4, fill: '#dc2626' }} name="sobra">
                    <LabelList
                      dataKey="sobra"
                      position="top"
                      offset={8}
                      fill="#dc2626"
                      fontSize={10}
                      fontWeight="bold"
                      formatter={(val: number) =>
                        val > 0 ? `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''
                      }
                    />
                  </Area>
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 3. Tabela de Detalhamento por Insumo Filtrada */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs">
        <div className="p-6 border-b border-stone-100 bg-[#fcfbf9]">
          <h3 className="text-base font-bold text-stone-900">Detalhamento de Aproveitamento por Produto</h3>
          <p className="text-xs text-stone-500">
            Detalhamento do período selecionado: {detailTable.length} insumo(s) ativos.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-6">Produto</th>
                <th className="py-3.5 px-4">Entrada (R$ / Qtd)</th>
                <th className="py-3.5 px-4">Sobra (R$ / Qtd)</th>
                <th className="py-3.5 px-4">Consumo Real</th>
                <th className="py-3.5 px-6 text-right">% Aproveitamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-stone-400">
                    Carregando tabela de aproveitamento...
                  </td>
                </tr>
              ) : detailTable.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-stone-400">
                    Nenhum dado registrado para o mês/ano selecionados.
                  </td>
                </tr>
              ) : (
                detailTable.map((item) => {
                  const pct = item.aproveitamentoPct;
                  return (
                    <tr key={item.produtoId} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3.5 px-6 font-bold text-stone-900">{item.nome}</td>

                      <td className="py-3.5 px-4 text-stone-700">
                        <span className="font-semibold">R$ {item.entradaValor.toFixed(2)}</span>
                        <span className="text-stone-400 text-[11px] block">
                          {item.entradaQtd} {item.unidade}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-terracotta-700">
                        <span className="font-semibold text-orange-700">R$ {item.sobraValor.toFixed(2)}</span>
                        <span className="text-orange-400 text-[11px] block">
                          {item.sobraQtd} {item.unidade}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-stone-800">
                        R$ {item.consumoValor.toFixed(2)}
                        <span className="text-stone-400 text-[11px] font-normal block">
                          {item.consumoQtd} {item.unidade}
                        </span>
                      </td>

                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <div className="w-32 bg-stone-100 rounded-full h-2.5 overflow-hidden border border-stone-200">
                            <div
                              className={`h-full rounded-full transition-all ${
                                pct >= 85 ? 'bg-[#556b2f]' : pct >= 70 ? 'bg-[#ea580c]' : 'bg-[#dc2626]'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span
                            className={`font-bold text-xs px-2 py-0.5 rounded-md min-w-[50px] text-center ${
                              pct >= 85
                                ? 'bg-[#f0f4e8] text-[#3d4e21]'
                                : pct >= 70
                                ? 'bg-[#fff7ed] text-[#9a3412]'
                                : 'bg-red-50 text-red-700'
                            }`}
                          >
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
