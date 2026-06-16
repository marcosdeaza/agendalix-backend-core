"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "./Logo";

const LINKS = [
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#features", label: "Producto" },
  { href: "#pricing", label: "Precios" },
  { href: "#faq", label: "Preguntas" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={[
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        "backdrop-blur-xl",
        scrolled
          ? "bg-[rgba(250,247,240,0.88)] border-b border-linel shadow-[0_1px_0_rgba(32,28,18,0.02)]"
          : "bg-[rgba(250,247,240,0.65)]",
      ].join(" ")}
    >
      <nav
        aria-label="Principal"
        className="mx-auto max-w-content h-[72px] px-6 flex items-center justify-between"
      >
        <Link
          href="/"
          aria-label="Inicio — Agendalix"
          className="flex items-center gap-2 -my-1 transition-opacity hover:opacity-80"
        >
          <Logo variant="compact" size={34} tone="light" />
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-8">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="text-[14px] text-inkl-soft hover:text-inkl transition-colors duration-150"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* CTA / Mobile toggle */}
        <div className="flex items-center gap-3">
          <Link
            href="/panel/login"
            className="hidden sm:inline-flex items-center text-[14px] font-medium text-inkl-soft hover:text-inkl transition-colors duration-150"
          >
            Acceder
          </Link>

          <Link
            href="/registro"
            className="hidden sm:inline-flex items-center gap-2 bg-brand text-white text-[14px] font-medium px-5 py-2.5 rounded-full hover:bg-brand-deep transition-colors duration-150 shadow-card"
          >
            Prueba 30 días gratis
          </Link>

          <button
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setOpen((v) => !v)}
            className="md:hidden w-10 h-10 -mr-2 flex flex-col items-center justify-center gap-1.5"
          >
            <span
              className={[
                "w-5 h-[1.5px] bg-inkl transition-transform duration-300",
                open ? "translate-y-[3.5px] rotate-45" : "",
              ].join(" ")}
            />
            <span
              className={[
                "w-5 h-[1.5px] bg-inkl transition-all duration-300",
                open ? "opacity-0" : "opacity-100",
              ].join(" ")}
            />
            <span
              className={[
                "w-5 h-[1.5px] bg-inkl transition-transform duration-300",
                open ? "-translate-y-[3.5px] -rotate-45" : "",
              ].join(" ")}
            />
          </button>
        </div>
      </nav>

      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-0 top-full h-[calc(100dvh-72px)] bg-paper md:hidden overflow-y-auto"
            style={{ zIndex: 49 }}
          >
            <ul className="px-6 py-10 flex flex-col gap-1">
              {LINKS.map((l, i) => (
                <motion.li
                  key={l.href}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.06 }}
                >
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block py-4 text-[20px] font-serif text-inkl border-b border-linel"
                  >
                    {l.label}
                  </Link>
                </motion.li>
              ))}
              <motion.li
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + LINKS.length * 0.06 }}
                className="mt-6 flex flex-col gap-3"
              >
                <Link
                  href="/panel/login"
                  onClick={() => setOpen(false)}
                  className="block text-center border border-linel-strong text-inkl text-[15px] font-medium px-4 py-3.5 rounded-full"
                >
                  Acceder al panel
                </Link>
                <Link
                  href="/registro"
                  onClick={() => setOpen(false)}
                  className="block text-center bg-brand text-white text-[15px] font-medium px-4 py-3.5 rounded-full"
                >
                  Prueba 30 días gratis
                </Link>
              </motion.li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
