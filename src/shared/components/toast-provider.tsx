"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type Toast = { id: number; message: string; tone: "success" | "error" | "info" };
type ToastContextValue = { showToast: (message: string, tone?: Toast["tone"]) => void };
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = useCallback((message: string, tone: Toast["tone"] = "info") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 3500);
  }, []);
  const value = useMemo(() => ({ showToast }), [showToast]);
  return <ToastContext.Provider value={value}><>{children}</><div className="rk-toast-region" aria-live="polite">{toasts.map((toast) => <div key={toast.id} role="status" className={`rk-toast ${toast.tone}`}>{toast.message}</div>)}</div></ToastContext.Provider>;
}

export function useToast() { const value = useContext(ToastContext); if (!value) throw new Error("useToast must be used inside ToastProvider"); return value; }
