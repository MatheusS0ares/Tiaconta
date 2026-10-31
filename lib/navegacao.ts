/** Garante que o "next" de login/convite é um caminho interno (evita open redirect). */
export function caminhoSeguro(next: string | null | undefined, padrao = "/") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return padrao;
  return next;
}

export function urlDoSite() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
