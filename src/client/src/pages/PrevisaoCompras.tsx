import React, { useState, useEffect } from 'react';
import { Sparkles, ShoppingBag, TrendingDown, Calendar, RefreshCw, CheckCircle2, ArrowRight, Filter, CheckSquare, Square } from 'lucide-react';
import api from '../services/api';
import { StatCard } from '../components/StatCard';

interface ProductPrediction {
  produtoId: string;
  nome: string;
  unidade: string;
  custoUnitario: number;
  consumoMedioDiario: number;
  sobraMedioDiario: number;
  taxaDesperdicioPct: number;
  quantidadeSugerida: number;
  custoEstimadoTotal: number;
  economiaEstimada: number;
  statusAlerta: 'excelente' | 'atencao' | 'critico';
  recomendacaoIA: string;
}

export const PrevisaoCompras: React.FC = () => {
  const [diasPrevisao, setDiasPrevisao] = useState<number>(7);
  const [margemSeguranca, setMargemSeguranca] = useState<number>(10); // %
  const [loading, setLoading] = useState<boolean>(true);
  const [allPredictions, setAllPredictions] = useState<ProductPrediction[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  const calcularPrevisao = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/aproveitamento');
      const detailTable = res.data.detailTable || [];

      const resProds = await api.get('/products');
      const products = resProds.data.products || [];

      const calcList: ProductPrediction[] = detailTable.map((item: any) => {
        const prodObj = products.find((p: any) => p.id === item.produtoId) || { custo_unitario: 10 };
        const custoUnit = prodObj.custo_unitario || 10;

        const consumoDiario = Math.max(0.1, item.consumoQtd / 30);
        const sobraDiaria = item.sobraQtd / 30;
        const taxaDesperdicio = item.entradaQtd > 0 ? (item.sobraQtd / item.entradaQtd) * 100 : 0;

        const qtdBase = consumoDiario * diasPrevisao;
        const qtdComMargem = qtdBase * (1 + margemSeguranca / 100);
        const economia = (sobraDiaria * diasPrevisao * 0.45) * custoUnit;
        const custoTotal = qtdComMargem * custoUnit;

        let statusAlerta: 'excelente' | 'atencao' | 'critico' = 'excelente';
        let recomendacaoIA = `Comprar ${qtdComMargem.toFixed(2)} ${item.unidade} garante estoque ideal para ${diasPrevisao} dias.`;

        if (taxaDesperdicio > 25) {
          statusAlerta = 'critico';
          recomendacaoIA = `Reduzir lote em 15% devido à alta taxa de desperdício histórico (${taxaDesperdicio.toFixed(1)}%). Economia de R$ ${economia.toFixed(2)}.`;
        } else if (taxaDesperdicio > 12) {
          statusAlerta = 'atencao';
          recomendacaoIA = `Fracionar compras em 2 lotes para evitar perdas no final de semana.`;
        }

        return {
          produtoId: item.produtoId,
          nome: item.nome,
          unidade: item.unidade,
          custoUnitario: custoUnit,
          consumoMedioDiario: Number(consumoDiario.toFixed(2)),
          sobraMedioDiario: Number(sobraDiaria.toFixed(2)),
          taxaDesperdicioPct: Number(taxaDesperdicio.toFixed(1)),
          quantidadeSugerida: Number(qtdComMargem.toFixed(2)),
          custoEstimadoTotal: Number(custoTotal.toFixed(2)),
          economiaEstimada: Number(economia.toFixed(2)),
          statusAlerta,
          recomendacaoIA,
        };
      });

      setAllPredictions(calcList);
      // Se ainda não houver produtos selecionados, selecionar todos por padrão
      if (selectedProductIds.length === 0) {
        setSelectedProductIds(calcList.map((p) => p.produtoId));
      }
    } catch (err) {
      console.error('Erro ao calcular previsão preditiva:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calcularPrevisao();
  }, [diasPrevisao, margemSeguranca]);

  // Filtrar apenas produtos selecionados pelo usuário
  const filteredPredictions = allPredictions.filter((p) => selectedProductIds.includes(p.produtoId));

  const totalInvestimento = filteredPredictions.reduce((acc, p) => acc + p.custoEstimadoTotal, 0);
  const totalEconomia = filteredPredictions.reduce((acc, p) => acc + p.economiaEstimada, 0);

  const toggleProduct = (id: string) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter((pId) => pId !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  const selectAll = () => {
    setSelectedProductIds(allPredictions.map((p) => p.produtoId));
  };

  const deselectAll = () => {
    setSelectedProductIds([]);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Banner Principal com Distintivo IA */}
      <div className="bg-gradient-to-r from-[#556b2f] to-[#3d4e21] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
          <Sparkles className="w-64 h-64" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-sm mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Algoritmo de Previsão Preditiva IA
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">Sugestão Preditiva de Compras</h2>
            <p className="text-stone-200 text-xs mt-1 max-w-2xl">
              Selecione os produtos que deseja analisar e simule o orçamento exato de compras para o período desejado.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-black/20 p-3 rounded-xl backdrop-blur-xs border border-white/10">
            <div>
              <span className="text-[11px] text-stone-300 block">Período de Previsão:</span>
              <div className="flex items-center gap-2 mt-1">
                {[7, 15, 30].map((dias) => (
                  <button
                    key={dias}
                    onClick={() => setDiasPrevisao(dias)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      diasPrevisao === dias
                        ? 'bg-amber-400 text-stone-900 shadow-xs'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {dias} Dias
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seletor de Produtos para Previsão */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#556b2f]" />
            <h4 className="text-xs font-bold text-stone-900">Selecione os Produtos para Incluir na Previsão:</h4>
            <span className="text-xs text-stone-500 font-semibold">
              ({selectedProductIds.length} de {allPredictions.length} selecionados)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={selectAll}
              className="text-[11px] font-bold text-[#556b2f] hover:underline px-2 py-1 rounded bg-[#f0f4e8]"
            >
              Marcar Todos
            </button>
            <button
              onClick={deselectAll}
              className="text-[11px] font-bold text-stone-500 hover:underline px-2 py-1 rounded bg-stone-100"
            >
              Desmarcar Todos
            </button>
          </div>
        </div>

        {/* Badges dos Produtos Selecionáveis */}
        <div className="flex flex-wrap gap-2 pt-1">
          {allPredictions.map((p) => {
            const isSelected = selectedProductIds.includes(p.produtoId);
            return (
              <button
                key={p.produtoId}
                onClick={() => toggleProduct(p.produtoId)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  isSelected
                    ? 'bg-[#f0f4e8] text-[#3d4e21] border-[#556b2f] shadow-2xs'
                    : 'bg-stone-50 text-stone-400 border-stone-200 hover:bg-stone-100'
                }`}
              >
                {isSelected ? (
                  <CheckSquare className="w-3.5 h-3.5 text-[#556b2f]" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-stone-300" />
                )}
                <span>{p.nome}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Orçamento Estimado de Compra"
          value={`R$ ${totalInvestimento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle={`Produtos selecionados para ${diasPrevisao} dias`}
          icon={ShoppingBag}
          variant="olive"
        />

        <StatCard
          title="Economia Prevista por IA"
          value={`R$ ${totalEconomia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle="Redução estimada de desperdício"
          icon={TrendingDown}
          variant="terracotta"
        />

        <StatCard
          title="Margem de Segurança Ajustada"
          value={`${margemSeguranca}%`}
          subtitle="Tolerância de variação de movimento"
          icon={CheckCircle2}
          variant="neutral"
        />
      </div>

      {/* Controles de Parâmetros */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-[#556b2f]" />
          <div>
            <h4 className="text-xs font-bold text-stone-900">Ajuste de Margem de Segurança</h4>
            <p className="text-[11px] text-stone-500">Adicione uma porcentagem de garantia para picos operacionais</p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto">
          <input
            type="range"
            min="0"
            max="30"
            step="5"
            value={margemSeguranca}
            onChange={(e) => setMargemSeguranca(Number(e.target.value))}
            className="w-48 accent-[#556b2f] cursor-pointer"
          />
          <span className="text-xs font-extrabold text-stone-900 bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200 min-w-[60px] text-center">
            +{margemSeguranca}%
          </span>
        </div>
      </div>

      {/* Tabela de Sugestão de Compras Recomendada */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs">
        <div className="p-6 border-b border-stone-100 bg-[#fcfbf9] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#556b2f]" />
              Lista de Compras Preditiva Recomendada ({diasPrevisao} Dias)
            </h3>
            <p className="text-xs text-stone-500">
              Exibindo {filteredPredictions.length} produto(s) selecionado(s).
            </p>
          </div>
          <button
            onClick={calcularPrevisao}
            className="inline-flex items-center gap-2 text-xs font-bold text-[#556b2f] bg-[#f0f4e8] hover:bg-[#e2eccf] px-3 py-2 rounded-xl transition-colors self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Recalcular
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-6">Produto / Insumo</th>
                <th className="py-3.5 px-4">Consumo Diário Médio</th>
                <th className="py-3.5 px-4">Taxa Desperdício</th>
                <th className="py-3.5 px-4">Qtd Sugerida ({diasPrevisao}d)</th>
                <th className="py-3.5 px-4">Valor Estimado</th>
                <th className="py-3.5 px-6">Orientação IA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400">
                    Processando algoritmo preditivo de compras...
                  </td>
                </tr>
              ) : filteredPredictions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400">
                    Nenhum produto selecionado para a previsão. Marque os produtos acima para visualizar a lista de compras.
                  </td>
                </tr>
              ) : (
                filteredPredictions.map((p) => (
                  <tr key={p.produtoId} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-stone-900">
                      {p.nome}
                      <span className="block text-[11px] text-stone-400 font-normal">
                        Custo: R$ {p.custoUnitario.toFixed(2)} / {p.unidade}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-stone-700">
                      {p.consumoMedioDiario} {p.unidade} / dia
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md font-bold text-[11px] ${
                          p.taxaDesperdicioPct > 20
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : p.taxaDesperdicioPct > 10
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {p.taxaDesperdicioPct}%
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-stone-900 font-extrabold text-sm bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200">
                        {p.quantidadeSugerida} {p.unidade}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-[#556b2f]">
                      R$ {p.custoEstimadoTotal.toFixed(2)}
                    </td>

                    <td className="py-3.5 px-6">
                      <div className="flex items-start gap-1.5 text-[11px] text-stone-700">
                        <ArrowRight className="w-3.5 h-3.5 text-[#556b2f] shrink-0 mt-0.5" />
                        <span>{p.recomendacaoIA}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
