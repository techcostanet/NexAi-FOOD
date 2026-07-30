import React from 'react';

interface BadgeProps {
  variant?: 'olive' | 'terracotta' | 'gray' | 'blue';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'olive', children }) => {
  const styles = {
    olive: 'bg-[#f0f4e8] text-[#3d4e21] border-[#d4e1c5]',
    terracotta: 'bg-[#fff7ed] text-[#9a3412] border-[#fed7aa]',
    gray: 'bg-stone-100 text-stone-600 border-stone-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[variant]}`}>
      {children}
    </span>
  );
};
