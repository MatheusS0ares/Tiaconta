import type { Metadata } from "next";
import { fredoka, nunito } from "./fontes";
import "./globals.css";

export const metadata: Metadata = {
  title: "TiaConta",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${fredoka.variable} ${nunito.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
