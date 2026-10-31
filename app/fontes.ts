import { Fredoka, Nunito } from "next/font/google";

/** Marca e títulos (docs/MARCA.md): Fredoka 500/600. */
export const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-fredoka",
  display: "swap",
});

/** Texto: Nunito 400/600/700. */
export const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-nunito",
  display: "swap",
});
