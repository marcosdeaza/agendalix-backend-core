import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://agendalix.com"),
  title: {
    default: "Agendalix — Tus citas se reservan solas",
    template: "%s · Agendalix",
  },
  description:
    "El asistente con IA que responde el WhatsApp de tu negocio: reserva citas, envía recordatorios y recupera clientes, 24/7. Prueba 30 días gratis.",
  keywords: [
    "automatización",
    "WhatsApp",
    "reservas",
    "citas",
    "IA",
    "negocios locales",
    "peluquerías",
    "clínicas",
  ],
  authors: [{ name: "Agendalix" }],
  creator: "Agendalix",
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://agendalix.com",
    title: "Agendalix — Tus citas se reservan solas",
    description:
      "El asistente con IA que responde el WhatsApp de tu negocio: reserva citas, envía recordatorios y recupera clientes, 24/7. Prueba 30 días gratis.",
    siteName: "Agendalix",
  },
  twitter: {
    card: "summary_large_image",
    title: "Agendalix — Tus citas se reservan solas",
    description:
      "El asistente con IA que responde el WhatsApp de tu negocio, 24/7. Prueba 30 días gratis.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: ["/favicon.svg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#FAF7F0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-screen bg-bg text-white font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
