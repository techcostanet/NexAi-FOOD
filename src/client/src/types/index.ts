export interface User {
  id: string;
  nome: string;
  email: string;
  role: 'Admin' | 'Comum';
  ativo: boolean;
  criado_em: string;
}

export interface Product {
  id: string;
  nome: string;
  unidade: string;
  custo_unitario: number;
  ativo: boolean;
  criado_em: string;
  _count?: {
    entradas: number;
    sobras: number;
  };
}

export interface Area {
  id: string;
  nome: string;
}

export interface Entrada {
  id: string;
  produto_id: string;
  produto: {
    id: string;
    nome: string;
    unidade: string;
    custo_unitario: number;
  };
  quantidade: number;
  valor_total: number;
  data_entrada: string;
  observacao?: string;
}

export interface Sobra {
  id: string;
  produto_id: string;
  produto: {
    id: string;
    nome: string;
    unidade: string;
    custo_unitario: number;
  };
  area_id: string;
  area: {
    id: string;
    nome: string;
  };
  quantidade: number;
  valor_perda: number;
  motivo?: string;
  data_sobra: string;
}

export interface DashboardStats {
  desperdicioHoje: number;
  desperdicioSemana: number;
  desperdicioMes: number;
  produtosAtivos: number;
}

export interface TopProductDonut {
  nome: string;
  valor: number;
  quantidade: number;
  unidade: string;
  percentual: number;
}

export interface AproveitamentoStats {
  totalEntradasMes: number;
  totalSobrasMes: number;
  consumoReal: number;
  aproveitamentoMedio: number;
}

export interface AproveitamentoDetail {
  produtoId: string;
  nome: string;
  unidade: string;
  entradaQtd: number;
  entradaValor: number;
  sobraQtd: number;
  sobraValor: number;
  consumoQtd: number;
  consumoValor: number;
  aproveitamentoPct: number;
}

export interface AIInsightRecommendation {
  title: string;
  description: string;
  type: 'critical' | 'warning' | 'opportunity';
}

export interface AIInsightData {
  generatedAt: string;
  summary: string;
  totalLoss30Days: number;
  topLossProduct: {
    nome: string;
    valorPerda: number;
    quantidade: number;
    unidade: string;
    percentualDoTotal: number;
  } | null;
  topLossArea: {
    nome: string;
    valorPerda: number;
    percentualDoTotal: number;
  } | null;
  recommendations: AIInsightRecommendation[];
}
