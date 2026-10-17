import React from 'react';

interface MetricCardProps {
  label: string;
  value: number | string;
  subtext?: string;
  icon?: React.ReactNode;
  accent?: 'blue' | 'slate' | 'amber' | 'rose';
  href?: string;
}

export function MetricCard({
  label,
  value,
  subtext,
  icon,
  accent = 'slate',
  href,
}: MetricCardProps) {
  const accentBorder = {
    blue: 'hover:border-blue-400',
    slate: 'hover:border-slate-300',
    amber: 'hover:border-amber-400',
    rose: 'hover:border-rose-400',
  }[accent];

  const content = (
    <div className={`bg-white rounded-lg border border-slate-200 p-5 transition-colors duration-150 ${accentBorder}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-semibold tracking-tight text-slate-900">{value}</span>
      </div>
      {subtext && (
        <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1">
          {subtext}
        </p>
      )}
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block group">
        {content}
      </a>
    );
  }

  return content;
}
