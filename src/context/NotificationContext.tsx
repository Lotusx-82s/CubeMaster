import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

export interface NotificationContextType {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, 'id'>) => string;
  success: (message: string, title?: string) => string;
  error: (message: string, title?: string) => string;
  warning: (message: string, title?: string) => string;
  info: (message: string, title?: string) => string;
  removeToast: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const duration = toast.duration ?? (toast.type === 'error' ? 5000 : 3500);

    const newToast: ToastItem = { ...toast, id, duration };
    setToasts((prev) => [...prev.slice(-4), newToast]); // Keep at most 5 toasts visible

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, [removeToast]);

  const success = useCallback((message: string, title?: string) => {
    return showToast({ type: 'success', title: title || 'Success', message });
  }, [showToast]);

  const error = useCallback((message: string, title?: string) => {
    return showToast({ type: 'error', title: title || 'Error', message });
  }, [showToast]);

  const warning = useCallback((message: string, title?: string) => {
    return showToast({ type: 'warning', title: title || 'Warning', message });
  }, [showToast]);

  const info = useCallback((message: string, title?: string) => {
    return showToast({ type: 'info', title: title || 'Note', message });
  }, [showToast]);

  return (
    <NotificationContext.Provider
      value={{ toasts, showToast, success, error, warning, info, removeToast }}
    >
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </NotificationContext.Provider>
  );
};

// oxlint-disable-next-line react/only-export-components
export function useNotification(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

const ToastContainer: React.FC<{
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 sm:top-20 sm:bottom-auto sm:right-6 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        const borderClass = isSuccess
          ? 'border-emerald-500/40 bg-slate-900/90 dark:bg-slate-950/95 light:bg-white/95 text-slate-100 light:text-slate-900 shadow-emerald-500/10'
          : isError
          ? 'border-rose-500/40 bg-slate-900/90 dark:bg-slate-950/95 light:bg-white/95 text-slate-100 light:text-slate-900 shadow-rose-500/10'
          : isWarning
          ? 'border-amber-500/40 bg-slate-900/90 dark:bg-slate-950/95 light:bg-white/95 text-slate-100 light:text-slate-900 shadow-amber-500/10'
          : 'border-cyan-500/40 bg-slate-900/90 dark:bg-slate-950/95 light:bg-white/95 text-slate-100 light:text-slate-900 shadow-cyan-500/10';

        const iconColor = isSuccess
          ? 'text-emerald-400'
          : isError
          ? 'text-rose-400'
          : isWarning
          ? 'text-amber-400'
          : 'text-cyan-400';

        return (
          <div
            key={toast.id}
            role="alert"
            className={`pointer-events-auto flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-300 animate-in slide-in-from-right-4 fade-in ${borderClass}`}
          >
            <div className={`mt-0.5 shrink-0 ${iconColor}`}>
              {isSuccess && <CheckCircle2 className="w-5 h-5" />}
              {isError && <AlertCircle className="w-5 h-5" />}
              {isWarning && <AlertTriangle className="w-5 h-5" />}
              {toast.type === 'info' && <Info className="w-5 h-5" />}
            </div>

            <div className="flex-1 min-w-0 pr-1">
              {toast.title && (
                <div className="text-xs font-bold uppercase tracking-wider mb-0.5 text-slate-200 light:text-slate-800">
                  {toast.title}
                </div>
              )}
              <div className="text-xs font-medium text-slate-300 light:text-slate-700 leading-snug break-words">
                {toast.message}
              </div>
            </div>

            <button
              onClick={() => onRemove(toast.id)}
              aria-label="Dismiss notification"
              className="p-1 rounded-lg text-slate-400 hover:text-white light:hover:text-slate-900 hover:bg-slate-800/60 light:hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
