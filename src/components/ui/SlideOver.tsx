"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { IconX } from "../icons/Icons";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  widthClass?: string;
};

export function SlideOver({ open, onClose, title, children, widthClass = "w-full sm:w-[440px]" }: Props) {
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
          className="fixed inset-0 z-[60]"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60"
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className={`absolute right-0 top-0 h-full bg-bg-card border-l-[0.5px] border-line-subtle overflow-y-auto ${widthClass}`}
          >
            <div className="sticky top-0 z-10 bg-bg-card/95 backdrop-blur flex items-center justify-between px-5 py-4 border-b-[0.5px] border-line-subtle">
              <h2 className="text-[16px] font-medium text-white truncate">{title}</h2>
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-bg-card2 transition"
              >
                <IconX size={18} />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
