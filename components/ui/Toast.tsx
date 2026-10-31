"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { CircleAlert, CircleCheck } from "lucide-react";

type Toast = { id: number; texto: string; tipo: "sucesso" | "erro"; desfazer?: () => void };
type Ctx = { mostrar: (t: Omit<Toast, "id">) => void };

const ToastCtx = createContext<Ctx>({ mostrar: () => {} });
export const useToast = () => useContext(ToastCtx);

const DURACAO = 5000; // UX.md: "Desfazer" por 5 segundos

/** Um toast por vez, acima da barra inferior, com "Desfazer" opcional. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const seq = useRef(0);

  const mostrar = useCallback((t: Omit<Toast, "id">) => setToast({ ...t, id: ++seq.current }), []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast((atual) => (atual?.id === toast.id ? null : atual)), DURACAO);
    return () => clearTimeout(timer);
  }, [toast]);

  const Icone = toast?.tipo === "erro" ? CircleAlert : CircleCheck;
  return (
    <ToastCtx.Provider value={{ mostrar }}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-30 mb-[env(safe-area-inset-bottom)] px-4">
        {toast ? (
          <div
            key={toast.id}
            role={toast.tipo === "erro" ? "alert" : "status"}
            className="pointer-events-auto mx-auto flex max-w-xl items-center gap-3 rounded-tc bg-marinho py-1 pl-4 pr-1 text-branco shadow-lg"
          >
            <Icone className={`size-5 shrink-0 ${toast.tipo === "erro" ? "text-coral-claro" : ""}`} aria-hidden />
            <span className="flex-1 py-2 font-semibold">{toast.texto}</span>
            {toast.desfazer ? (
              <button
                type="button"
                onClick={() => {
                  toast.desfazer?.();
                  setToast(null);
                }}
                className="min-h-12 shrink-0 rounded-tc px-4 font-bold text-girassol underline underline-offset-4"
              >
                Desfazer
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </ToastCtx.Provider>
  );
}
