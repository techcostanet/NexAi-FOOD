import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'olive' | 'terracotta' | 'neutral';
  trend?: {
    text: string;
    isPositive?: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'neutral',
  trend,
}) => {
  const iconColorMap = {
    olive: 'bg-[#f0f4e8] text-[#556b2f] border-[#d4e1c5]',
    terracotta: 'bg-[#fff7ed] text-[#ea580c] border-[#fed7aa]',
    neutral: 'bg-stone-100 text-stone-700 border-stone-200',
  };

  const accentBorderMap = {
    olive: 'border-l-4 border-l-[#556b2f]',
    terracotta: 'border-l-4 border-l-[#ea580c]',
    neutral: 'border-l-4 border-l-stone-300',
  };

  return (
    <div className={`bg-white rounded-xl p-5 border border-stone-200 shadow-sm transition-all hover:shadow-md ${accentBorderMap[variant]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-stone-500">{title}</p>
          <h3 className="text-2xl font-bold text-stone-900 mt-1">{value}</h3>
          {subtitle && <p className="text-xs text-stone-400 mt-0.5">{subtitle}</p>}
          {trend && (
            <p className={`text-xs font-semibold mt-2 ${trend.isPositive ? 'text-emerald-600' : 'text-amber-600'}`}>
              {trend.text}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl border ${iconColorMap[variant]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
