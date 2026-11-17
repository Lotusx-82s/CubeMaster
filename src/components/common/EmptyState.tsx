import React from 'react';
import { Box, Camera, Edit3, Link2, Sparkles, ArrowRight } from 'lucide-react';

export type EmptyStateType = 'solution' | 'scan' | 'manual' | 'url' | 'validation' | 'generic';

interface EmptyStateProps {
  type?: EmptyStateType;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'generic',
  title,
  description,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'solution':
        return <Box className="w-10 h-10 text-cyan-400" />;
      case 'scan':
        return <Camera className="w-10 h-10 text-blue-400" />;
      case 'manual':
        return <Edit3 className="w-10 h-10 text-indigo-400" />;
      case 'url':
        return <Link2 className="w-10 h-10 text-teal-400" />;
      default:
        return <Sparkles className="w-10 h-10 text-cyan-400" />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80 shadow-2xl max-w-xl mx-auto my-6 space-y-6">
      {/* Decorative Illustrated Icon Circle */}
      <div className="relative">
        <div className="absolute inset-0 bg-cyan-500/10 rounded-full blur-xl animate-pulse" />
        <div className="relative w-20 h-20 rounded-3xl bg-slate-950 border border-slate-800 flex items-center justify-center shadow-inner">
          {getIcon()}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
        <p className="text-sm text-slate-400 max-w-md leading-relaxed">{description}</p>
      </div>

      {/* Action Buttons */}
      {(actionText || secondaryActionText) && (
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          {actionText && onAction && (
            <button
              onClick={onAction}
              className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{actionText}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {secondaryActionText && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className="w-full sm:w-auto px-5 py-3 rounded-xl font-semibold text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
            >
              {secondaryActionText}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
