import type { NextRequest } from "next/server";
import { atualizarSessao } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { response } = await atualizarSessao(request);
  return response;
}

export const config = {
  matcher: [
    // Tudo, exceto arquivos estáticos, ícones da marca, manifest e service worker.
    "/((?!_next/static|_next/image|brand/|manifest.webmanifest|sw.js|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
