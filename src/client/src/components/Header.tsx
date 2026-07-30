import React from 'react';
import { PackagePlus, Trash2, Calendar, GitCommit } from 'lucide-react';
import { CURRENT_VERSION } from '../data/versions';

interface HeaderProps {
  activeTab: string;
  onOpenNovaEntrada: () => void;
  onOpenRegistrarSobra: () => void;
  onOpenVersoes: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onOpenNovaEntrada,
  onOpenRegistrarSobra,
  onOpenVersoes,
}) => {
  const titles: Record<string, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Dashboard de Perdas e Resumos',
      subtitle: 'Acompanhe indicadores financeiros e padrões de desperdício em tempo real.',
    },
    registros: {
      title: 'Registros de Sobras (Desperdício)',
      subtitle: 'Lançamento diário de descartes, motivos e áreas da cozinha.',
    },
    entradas: {
      title: 'Entradas de Insumos',
      subtitle: 'Controle de aquisição e reposição de estoque de mercadorias.',
    },
    aproveitamento: {
      title: 'Relatório de Aproveitamento',
      subtitle: 'Análise de eficiência entre insumos adquiridos vs consumidos.',
    },
    produtos: {
      title: 'Gestão de Produtos',
      subtitle: 'Cadastro e manutenção do catálogo de insumos e custos unitários.',
    },
    usuarios: {
      title: 'Gestão de Usuários e Acessos',
      subtitle: 'Controle de contas ativas e permissões de acesso ao sistema.',
    },
    versoes: {
      title: 'Histórico de Versões e Release Notes',
      subtitle: 'Consulte o histórico completo de atualizações, correções e novas funcionalidades.',
    },
  };

  const currentInfo = titles[activeTab] || {
    title: 'Controle de Sobras',
    subtitle: 'Gestão Inteligente de Cozinha',
  };

  const formattedDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <header className="bg-white border-b border-[#e7e5e0] px-8 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 sticky top-0 z-20 shadow-2xs">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">{currentInfo.title}</h2>
          <button
            onClick={onOpenVersoes}
            className="text-[10px] font-bold bg-[#f0f4e8] text-[#3d4e21] border border-[#d4e1c5] px-2 py-0.5 rounded-full hover:bg-[#e4ebd7] transition-colors"
            title="Ver histórico de versões"
          >
            v{CURRENT_VERSION}
          </button>
        </div>
        <p className="text-xs text-stone-500 mt-0.5">{currentInfo.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-stone-500 bg-[#fcfbf9] px-3 py-2 rounded-xl border border-stone-200">
          <Calendar className="w-4 h-4 text-[#556b2f]" />
          <span className="capitalize">{formattedDate}</span>
        </div>

        <button
          onClick={onOpenNovaEntrada}
          className="flex items-center gap-2 bg-[#f0f4e8] text-[#3d4e21] border border-[#d4e1c5] hover:bg-[#e4ebd7] px-3.5 py-2 rounded-xl font-semibold text-xs transition-colors shadow-2xs"
        >
          <PackagePlus className="w-4 h-4 text-[#556b2f]" />
          <span>+ Nova Entrada</span>
        </button>

        <button
          onClick={onOpenRegistrarSobra}
          className="flex items-center gap-2 bg-[#ea580c] hover:bg-[#c2410c] text-white px-3.5 py-2 rounded-xl font-semibold text-xs transition-colors shadow-sm"
        >
          <Trash2 className="w-4 h-4" />
          <span>+ Registrar Sobra</span>
        </button>
      </div>
    </header>
  );
};
