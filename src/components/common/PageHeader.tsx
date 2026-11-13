import React from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useCube } from '../../context';
import type { AppView } from '../../types/navigation';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  backTo?: AppView;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  backTo,
  actions,
}) => {
  const { setView } = useCube();

  return (
    <div className="w-full mb-8">
      {backTo && (
        <button
          onClick={() => setView(backTo)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-cyan-400 transition-colors mb-3 cursor-pointer group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back</span>
        </button>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {title}
            </h1>
            {badge && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Sparkles className="w-3 h-3" />
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-400 max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-3 flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
