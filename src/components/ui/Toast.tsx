"use client";

import { AnimatePresence, motion } from "framer-motion";
import { createContext, useCallback, useContext, useRef, useState } from "react";

type ToastItem = { id: string; kind: "success" | "error" | "info"; message: string };
type Ctx = { toast: (kind: ToastItem["kind"], message: string) => void };

const ToastCtx = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const remove = useCallback((id: string) => {
    setItems((x) => x.filter((i) => i.id !== id));
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback<Ctx["toast"]>((kind, message) => {
    const id = crypto.randomUUID();
    setItems((x) => [...x, { id, kind, message }]);
    const t = setTimeout(() => remove(id), 4000);
    timers.current.set(id, t);
  }, [remove]);

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="fixed z-[80] top-4 right-4 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence initial={false}>
          {items.map((i) => (
            <motion.div
              key={i.id}
              role="status"
              initial={{ opacity: 0, x: 40, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className={`pointer-events-auto max-w-[340px] bg-bg-card border-[0.5px] border-line-subtle shadow-lg rounded-lg text-[13px] text-white px-3.5 py-3 pl-4 ${
                i.kind === "success"
                  ? "border-l-2 border-l-purple"
                  : i.kind === "error"
                    ? "border-l-2 border-l-[#A32D2D]"
                    : "border-l-2 border-l-[#7BB3F7]"
              }`}
              onClick={() => remove(i.id)}
            >
              {i.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
