/**
 * Cor primária da escola (escolas.cor_primaria) → variáveis CSS do tenant.
 * Valida o hex (evita injeção de CSS) e escolhe a cor de texto com maior
 * contraste sobre ela (branco ou marinho da marca).
 */
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function canal(c: number) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminancia(hex: string) {
  let h = hex.slice(1);
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * canal(r!) + 0.7152 * canal(g!) + 0.0722 * canal(b!);
}

export function contraste(hexA: string, hexB: string) {
  const [a, b] = [luminancia(hexA), luminancia(hexB)].sort((x, y) => y - x);
  return (a! + 0.05) / (b! + 0.05);
}

const BRANCO = "#FFFFFF";
const MARINHO = "#1F2A44"; // mesmo valor de --tc-marinho

/** Estilo inline para o wrapper do tenant. Sem cor válida, vale o fallback coral dos tokens. */
export function estiloCorEscola(corPrimaria: string | null | undefined): React.CSSProperties {
  if (!corPrimaria || !HEX.test(corPrimaria)) return {};
  const texto =
    contraste(corPrimaria, BRANCO) >= contraste(corPrimaria, MARINHO) ? "var(--tc-branco)" : "var(--tc-marinho)";
  return {
    ["--escola-primaria" as string]: corPrimaria,
    ["--escola-primaria-texto" as string]: texto,
  };
}
