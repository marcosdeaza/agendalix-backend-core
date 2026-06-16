"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { IconX } from "../icons/Icons";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
};

export function Modal({ open, onClose, title, children, footer, maxWidth = "460px" }: Props) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ scale: 0.96, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 12 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-bg-card border-[0.5px] border-line-subtle sm:rounded-xl rounded-t-xl flex flex-col max-h-[92dvh]"
            style={{ maxWidth }}
          >
            {title ? (
              <div className="flex items-center justify-between px-5 py-4 border-b-[0.5px] border-line-subtle">
                <h2 className="text-[16px] font-medium text-white">{title}</h2>
                <button
                  onClick={onClose}
                  aria-label="Cerrar"
                  className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-bg-card2 transition"
                >
                  <IconX size={18} />
                </button>
              </div>
            ) : null}
            <div className="p-5 overflow-y-auto flex-1">{children}</div>
            {footer ? (
              <div className="px-5 py-4 border-t-[0.5px] border-line-subtle flex justify-end gap-2">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
