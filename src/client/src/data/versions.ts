export interface VersionItem {
  version: string;
  date: string;
  title: string;
  tag: 'Major' | 'Feature' | 'Improvement' | 'Security';
  changes: {
    category: 'Novas Funcionalidades' | 'Melhorias' | 'Segurança' | 'Correções';
    description: string;
  }[];
}

export const CURRENT_VERSION = '1.7.6';
export const RELEASE_DATE = '11/08/2026';
export const DEVELOPER_BRAND = 'Tech Costa Systems';

export const VERSIONS_HISTORY: VersionItem[] = [
  {
    version: '1.7.6',
    date: '11/08/2026',
    title: 'Correção de Cálculo no Dashboard e Aproveitamento',
    tag: 'Improvement',
    changes: [
      {
        category: 'Correções',
        description: 'Correção nos indicadores de Desperdício e Aproveitamento que estavam somando todo o histórico do banco de dados em vez de filtrar corretamente por Dia, Semana (7 dias) e Mês (30 dias).',
      },
    ],
  },
  {
    version: '1.7.5',
    date: '07/08/2026',
    title: 'Sincronização Exata de Datas nos Modais de Edição e Tabela de Registros',
    tag: 'Improvement',
    changes: [
      {
        category: 'Correções',
        description: 'Unificação do motor de parsing de datas para garantir que a data exibida na tabela de entradas/sobras seja exatamente idêntica à data pré-preenchida no modal de edição, eliminando o avanço indevido de 1 dia.',
      },
    ],
  },
  {
    version: '1.7.4',
    date: '07/08/2026',
    title: 'Correção de Fuso Horário nas Datas de Entrada e Atualização de Registros',
    tag: 'Improvement',
    changes: [
      {
        category: 'Correções',
        description: 'Correção no tratamento e exibição de datas para evitar retrocesso de 1 dia por fuso horário (GMT-3) e avanço de 1 dia em todas as entradas no Firestore.',
      },
    ],
  },
  {
    version: '1.7.3',
    date: '31/07/2026',
    title: 'Liberação de Acesso e Configuração de Segurança no Firebase',
    tag: 'Security',
    changes: [
      {
        category: 'Segurança',
        description: 'Correção de regras de acesso (Firestore Rules) para garantir leitura e escrita do banco de dados na nuvem pela aplicação principal.',
      },
    ],
  },
  {
    version: '1.7.2',
    date: '31/07/2026',
    title: 'Integração Definitiva com Firebase Firestore & Correção de Persistência no F5',
    tag: 'Improvement',
    changes: [
      {
        category: 'Correções',
        description: 'Substituição completa da camada de persistência temporária (JSONBlob/localStorage destrutivo) pelo Firebase Cloud Firestore nativo, garantindo que cadastros de produtos, entradas, sobras e usuários nunca desapareçam ao recarregar a página (F5).',
      },
      {
        category: 'Melhorias',
        description: 'Sincronização imediata em tempo real com fallback resiliente em cache offline para todos os módulos.',
      },
    ],
  },
  {
    version: '1.7.1',
    date: '30/07/2026',
    title: 'Remoção de Credenciais Pré-preenchidas no Login & Gestão Completa de Usuários',
    tag: 'Improvement',
    changes: [
      {
        category: 'Segurança',
        description: 'Campos de e-mail e senha na tela de autenticação iniciam vazios para total privacidade e segurança ao acessar.',
      },
      {
        category: 'Novas Funcionalidades',
        description: 'Implementada edição completa de perfil/senha/permissão e exclusão com lixeira (Trash2) no cadastro de usuários.',
      },
    ],
  },
  {
    version: '1.7.0',
    date: '30/07/2026',
    title: 'Sincronização em Nuvem em Tempo Real & Edição/Exclusão Completa de Todos os Cadastros',
    tag: 'Major',
    changes: [
      {
        category: 'Novas Funcionalidades',
        description: 'Integração de banco de dados na nuvem com sincronização instantânea entre múltiplos navegadores (Chrome, Edge, Firefox, Mobile) e computadores.',
      },
      {
        category: 'Melhorias',
        description: 'Implementação de Edição (PUT) e Exclusão (DELETE) para Entradas, Sobras, Produtos, Áreas e Usuários em todas as camadas do sistema.',
      },
    ],
  },
  {
    version: '1.6.3',
    date: '27/07/2026',
    title: 'Correção na Edição, Atualização de Status e Exclusão de Produtos',
    tag: 'Improvement',
    changes: [
      {
        category: 'Correções',
        description: 'Implementação dos handlers dos métodos HTTP PUT, PATCH e DELETE na camada de serviço de dados da nuvem para persistência imediata de edições e alterações de produtos.',
      },
    ],
  },
  {
    version: '1.6.2',
    date: '27/07/2026',
    title: 'Remoção de Credenciais Expostas na Tela de Login',
    tag: 'Security',
    changes: [
      {
        category: 'Segurança',
        description: 'Remoção do bloco informativo de contas pré-cadastradas (Admin/Nutricionista) na tela de autenticação para reforçar a segurança do ambiente.',
      },
    ],
  },
  {
    version: '1.6.1',
    date: '26/07/2026',
    title: 'Correção de Mapeamento de Chaves para Exibição dos 125 Registros de Sobras',
    tag: 'Improvement',
    changes: [
      {
        category: 'Correções',
        description: 'Alinhamento completo do mapeamento de resposta API /waste (suporte duplo às chaves waste e wasteRecords) para renderizar instantaneamente os 125 registros de desperdício na tela.',
      },
    ],
  },
  {
    version: '1.6.0',
    date: '26/07/2026',
    title: 'Previsão de Compras por IA, Filtros por Mês/Ano & 3 Opções de Gráficos',
    tag: 'Major',
    changes: [
      {
        category: 'Novas Funcionalidades',
        description: 'Módulo de Sugestão Preditiva de Compras por IA com cálculo de lote ideal para 7, 15 ou 30 dias e estimativa de economia em R$.',
      },
      {
        category: 'Novas Funcionalidades',
        description: 'Filtro interativo de seleção de produtos na Previsão de Compras (IA) com recálculo instantâneo de orçamento e economia.',
      },
      {
        category: 'Novas Funcionalidades',
        description: 'Filtros de Período pré-prontos por Mês e Ano na tela de Aproveitamento, sem necessidade de digitação de datas.',
      },
      {
        category: 'Novas Funcionalidades',
        description: 'Modo de exibição com 3 opções de gráficos alternáveis (Barras, Linhas, Área e Donut/Pizza/Barras Horizontais) no Dashboard e no Aproveitamento.',
      },
      {
        category: 'Melhorias',
        description: 'Carga completa de todos os 155 lançamentos de entradas e 125 registros de sobras diárias na base Cloud.',
      },
      {
        category: 'Correções',
        description: 'Correção do recarregamento de página (F5) com interceptor inteligente de reescrita SPA do Firebase Hosting.',
      },
    ],
  },
  {
    version: '1.5.0',
    date: '26/07/2026',
    title: 'Lançamento Oficial Controle de Sobras SaaS & IA Insights',
    tag: 'Major',
    changes: [
      {
        category: 'Novas Funcionalidades',
        description: 'Módulo de Insights de IA para geração automática de recomendações de economia na cozinha.',
      },
      {
        category: 'Novas Funcionalidades',
        description: 'Dashboard financeiro com cartões de desperdício (Hoje, Semana, Mês) e gráfico Donut de Top Produtos.',
      },
      {
        category: 'Novas Funcionalidades',
        description: 'Relatório de Aproveitamento de Insumos com gráfico comparativo agrupado e barras de progresso percentuais.',
      },
      {
        category: 'Melhorias',
        description: 'Identidade visual em Verde Oliva, Terracota e Off-white com rodapé fixo de versionamento.',
      },
      {
        category: 'Novas Funcionalidades',
        description: 'Sistema integrado de Registro e Histórico de Versões (Changelog) consultável pelo usuário.',
      },
    ],
  },
  {
    version: '1.4.0',
    date: '15/07/2026',
    title: 'Recuperação de Senha & Integração E-mail Resend',
    tag: 'Feature',
    changes: [
      {
        category: 'Novas Funcionalidades',
        description: 'Função "Esqueci minha senha" na tela de login com suporte à API da Resend.',
      },
      {
        category: 'Segurança',
        description: 'Geração de tokens criptográficos temporários para redefinição de senha com expiração em 1 hora.',
      },
      {
        category: 'Melhorias',
        description: 'Fallback automático para simulação local de e-mails em ambiente de desenvolvimento.',
      },
    ],
  },
  {
    version: '1.3.0',
    date: '01/07/2026',
    title: 'Relatórios Operacionais de Aproveitamento',
    tag: 'Feature',
    changes: [
      {
        category: 'Novas Funcionalidades',
        description: 'Cálculo de Consumo Real (Entradas - Sobras) e % de Aproveitamento Médio por produto.',
      },
      {
        category: 'Melhorias',
        description: 'Indicadores visuais coloridos (Verde >=85%, Laranja 70-84%, Vermelho <70%).',
      },
    ],
  },
  {
    version: '1.2.0',
    date: '15/06/2026',
    title: 'Gestão de Desperdício e Sobras Diárias por Área',
    tag: 'Feature',
    changes: [
      {
        category: 'Novas Funcionalidades',
        description: 'Lançamento de descartes diários com vinculação por Área da Cozinha e motivo.',
      },
      {
        category: 'Novas Funcionalidades',
        description: 'Cálculo automático de Perda Financeira (R$) com base no custo unitário do insumo.',
      },
    ],
  },
  {
    version: '1.1.0',
    date: '01/06/2026',
    title: 'Catálogo de Produtos & Controle de Entradas de Estoque',
    tag: 'Feature',
    changes: [
      {
        category: 'Novas Funcionalidades',
        description: 'CRUD completo de produtos com unidades de medida (kg, L, un, g, ml) e custos unitários.',
      },
      {
        category: 'Novas Funcionalidades',
        description: 'Registro de entradas de estoque e reposições de mercadorias.',
      },
    ],
  },
  {
    version: '1.0.0',
    date: '15/05/2026',
    title: 'Arquitetura Base, Autenticação JWT e Banco Relacional',
    tag: 'Major',
    changes: [
      {
        category: 'Novas Funcionalidades',
        description: 'Estruturação da API Node.js Express e schema relacional Prisma ORM (SQLite).',
      },
      {
        category: 'Segurança',
        description: 'Autenticação JWT, encriptação de senhas com bcryptjs e perfis de acesso (Admin/Comum).',
      },
    ],
  },
];
