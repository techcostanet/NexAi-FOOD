import React from 'react';
import {
  LayoutDashboard,
  Trash2,
  PackagePlus,
  TrendingUp,
  Sparkles,
  Package,
  Users,
  GitCommit,
  LogOut,
  Leaf,
  ShieldCheck,
} from 'lucide-react';
import { User } from '../types';
import { CURRENT_VERSION, DEVELOPER_BRAND } from '../data/versions';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'registros', label: 'Registros', icon: Trash2 },
    { id: 'entradas', label: 'Entradas', icon: PackagePlus },
    { id: 'aproveitamento', label: 'Aproveitamento', icon: TrendingUp },
    { id: 'previsao', label: 'Previsão de Compras (IA)', icon: Sparkles },
    { id: 'produtos', label: 'Produtos', icon: Package },
    { id: 'usuarios', label: 'Usuários', icon: Users },
    { id: 'versoes', label: 'Versões & Release Notes', icon: GitCommit },
  ];

  return (
    <aside className="w-64 bg-[#f7f6f2] border-r border-[#e7e5e0] flex flex-col justify-between h-screen sticky top-0 select-none z-30">
      {/* Top Header & Logo */}
      <div>
        <div className="p-6 border-b border-[#e7e5e0] flex items-center gap-3 bg-white/50">
          <div className="w-10 h-10 rounded-xl bg-[#556b2f] flex items-center justify-center text-white shadow-sm">
            <Leaf className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-base text-stone-900 leading-tight">Controle de Sobras</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11px] font-medium text-[#556b2f] bg-[#f0f4e8] px-2 py-0.5 rounded-full inline-block">
                Gestão de Cozinha
              </span>
              <span className="text-[10px] font-bold text-stone-500 bg-stone-200/70 px-1.5 py-0.2 rounded">
                v{CURRENT_VERSION}
              </span>
            </div>
          </div>
        </div>

        {/* User Card */}
        {currentUser && (
          <div className="mx-4 mt-4 p-3 bg-white rounded-xl border border-stone-200/80 shadow-2xs flex items-center justify-between">
            <div className="overflow-hidden pr-2">
              <p className="text-xs font-bold text-stone-900 truncate">{currentUser.nome}</p>
              <div className="flex items-center gap-1 mt-0.5">
                {currentUser.role === 'Admin' ? (
                  <span className="text-[10px] font-bold text-[#556b2f] bg-[#f0f4e8] px-1.5 py-0.2 rounded border border-[#d4e1c5] flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3" /> Admin
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-stone-500 bg-stone-100 px-1.5 py-0.2 rounded">
                    Operacional
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Sair da Conta"
              className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="p-4 space-y-1 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  isActive
                    ? 'bg-[#556b2f] text-white shadow-sm font-semibold'
                    : 'text-stone-600 hover:bg-[#eae8e1] hover:text-stone-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-stone-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Global Required Footer Fixo no Menu Lateral com link para Versões */}
      <div
        onClick={() => setActiveTab('versoes')}
        className="p-4 border-t border-[#e7e5e0] bg-[#f2f0ea]/50 text-center cursor-pointer hover:bg-[#eae8e1] transition-colors"
        title="Clique para consultar o histórico completo de versões"
      >
        <p className="text-[11px] font-medium text-stone-500 leading-tight">
          Desenvolvido por {DEVELOPER_BRAND} © 2026 - v{CURRENT_VERSION}
        </p>
        <span className="text-[10px] text-[#556b2f] font-semibold underline block mt-0.5">
          Ver notas da versão v{CURRENT_VERSION}
        </span>
      </div>
    </aside>
  );
};
