import type { Metadata, Viewport } from "next";
import { fredoka, nunito } from "./fontes";
import { RegistrarSW } from "@/components/RegistrarSW";
import { Hidratado } from "@/components/Hidratado";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "TiaConta",
  title: { default: "TiaConta", template: "%s · TiaConta" },
  description: "O dia do seu filho na escola, contado pela tia.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/brand/favicon.svg", type: "image/svg+xml" },
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: { capable: true, title: "TiaConta", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1F2A44", // marinho; igual a theme_color do manifest
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${fredoka.variable} ${nunito.variable}`}>
      <body className="min-h-dvh antialiased">
        {children}
        <RegistrarSW />
        <Hidratado />
      </body>
    </html>
  );
}
