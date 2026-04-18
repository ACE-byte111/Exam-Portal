import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useToastStore } from '../stores/toastStore';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success: 'border-accent-green text-accent-green',
  error: 'border-accent-red text-accent-red',
  warning: 'border-accent-orange text-accent-orange',
  info: 'border-accent-blue text-accent-blue',
};

export default function Toast() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm">
      {toasts.map((toast) => {
        const Icon = icons[toast.type] || Info;
        return (
          <div
            key={toast.id}
            className={`glass rounded-xl px-4 py-3 flex items-start gap-3 animate-slide-down border-l-2 ${colors[toast.type] || colors.info}`}
          >
            <Icon size={18} className="mt-0.5 flex-shrink-0" />
            <p className="text-sm text-text-primary flex-1">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-text-muted hover:text-text-primary transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
