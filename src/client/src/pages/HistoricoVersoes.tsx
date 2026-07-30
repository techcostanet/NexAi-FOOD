import React, { useState } from 'react';
import {
  GitCommit,
  Calendar,
  Sparkles,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Tag,
  Search,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { VERSIONS_HISTORY, CURRENT_VERSION, RELEASE_DATE, DEVELOPER_BRAND } from '../data/versions';
import { Badge } from '../components/Badge';

export const HistoricoVersoes: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedVersion, setExpandedVersion] = useState<string | null>(CURRENT_VERSION);

  const toggleExpand = (v: string) => {
    setExpandedVersion(expandedVersion === v ? null : v);
  };

  const filteredVersions = VERSIONS_HISTORY.filter(
    (v) =>
      v.version.includes(searchTerm) ||
      v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.changes.some((c) => c.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header & App Version Card */}
      <div className="bg-gradient-to-r from-[#f0f4e8] via-white to-[#fcfbf9] p-6 rounded-2xl border border-[#d4e1c5] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#556b2f] text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0">
            <GitCommit className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-stone-900">Histórico de Versões & Release Notes</h2>
              <Badge variant="olive">Versão Atual v{CURRENT_VERSION}</Badge>
            </div>
            <p className="text-xs text-stone-600 mt-1">
              Registro contínuo de atualizações, melhorias e segurança do sistema.
            </p>
          </div>
        </div>

        <div className="text-left md:text-right shrink-0 text-xs">
          <span className="text-stone-400 block">Desenvolvido por</span>
          <strong className="text-[#556b2f] font-bold">{DEVELOPER_BRAND}</strong>
          <span className="text-stone-500 block text-[11px] mt-0.5">Última Atualização: {RELEASE_DATE}</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl border border-stone-200">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por versão ou funcionalidade..."
            className="w-full pl-10 pr-4 py-1.5 text-xs bg-[#fcfbf9] border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#556b2f]"
          />
        </div>
        <span className="text-xs text-stone-400 font-semibold">
          {filteredVersions.length} versões registradas
        </span>
      </div>

      {/* Timeline List of Versions */}
      <div className="space-y-4">
        {filteredVersions.map((item) => {
          const isCurrent = item.version === CURRENT_VERSION;
          const isExpanded = expandedVersion === item.version;

          return (
            <div
              key={item.version}
              className={`bg-white rounded-2xl border transition-all shadow-2xs overflow-hidden ${
                isCurrent ? 'border-[#556b2f] ring-1 ring-[#556b2f]/20' : 'border-stone-200'
              }`}
            >
              {/* Header Accordion Bar */}
              <div
                onClick={() => toggleExpand(item.version)}
                className="p-5 cursor-pointer flex items-center justify-between hover:bg-stone-50/80 transition-colors select-none"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                      isCurrent ? 'bg-[#556b2f] text-white shadow-sm' : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    v{item.version}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-stone-900 text-sm">{item.title}</h3>
                      {isCurrent && (
                        <span className="bg-[#f0f4e8] text-[#3d4e21] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#d4e1c5]">
                          EM USO
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-400 flex items-center gap-2 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-stone-400 inline" />
                      <span>{item.date}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      item.tag === 'Major'
                        ? 'olive'
                        : item.tag === 'Security'
                        ? 'terracotta'
                        : 'gray'
                    }
                  >
                    {item.tag}
                  </Badge>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-stone-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-stone-400" />
                  )}
                </div>
              </div>

              {/* Accordion Details */}
              {isExpanded && (
                <div className="px-6 pb-6 pt-2 border-t border-stone-100 bg-[#fcfbf9]/60 animate-fadeIn">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
                    Mudanças e Implementações nesta Versão:
                  </h4>
                  <div className="space-y-2.5">
                    {item.changes.map((change, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-stone-200 text-xs text-stone-700"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#556b2f] shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-stone-900 mr-2 bg-stone-100 px-1.5 py-0.5 rounded text-[10px] uppercase">
                            {change.category}
                          </span>
                          <span>{change.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
