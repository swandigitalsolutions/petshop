import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

const ToastCtx = createContext(() => {});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const id = useRef(0);

  const dismiss = useCallback((tid) => setToasts((t) => t.filter((x) => x.id !== tid)), []);
  const toast = useCallback(
    (message, { type = 'success', action } = {}) => {
      id.current += 1;
      const tid = id.current;
      setToasts((t) => [...t.slice(-2), { id: tid, message, type, action }]);
      setTimeout(() => dismiss(tid), 3800);
    },
    [dismiss],
  );

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex flex-col items-center gap-2 px-4" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="toast-in pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-sm text-white shadow-xl">
            {t.type === 'error' ? <AlertCircle className="size-5 shrink-0 text-coral" /> : <CheckCircle2 className="size-5 shrink-0 text-yolk" />}
            <span className="flex-1">{t.message}</span>
            {t.action && (
              <button type="button" onClick={() => { t.action.onClick(); dismiss(t.id); }} className="font-semibold text-yolk hover:underline">
                {t.action.label}
              </button>
            )}
            <button type="button" aria-label="Dismiss" onClick={() => dismiss(t.id)} className="text-white/60 hover:text-white">
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
