import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border transition-all animate-in slide-in-from-right-8 fade-in ${
            toast.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
            toast.type === 'error' ? 'bg-red-50 border-red-100 text-red-800' :
            'bg-amber-50 border-amber-100 text-amber-800'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 size={20} className="text-emerald-500" />}
          {toast.type === 'error' && <XCircle size={20} className="text-red-500" />}
          {toast.type === 'warning' && <AlertCircle size={20} className="text-amber-500" />}
          
          <span className="font-bold text-sm pr-4">{toast.message}</span>
          
          <button 
            onClick={() => removeToast(toast.id)}
            className="text-slate-400 hover:text-slate-600 ml-auto transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );

  return { addToast, ToastContainer };
}
