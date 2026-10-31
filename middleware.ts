import { NextResponse, type NextRequest } from "next/server";
import { atualizarSessao } from "@/lib/supabase/middleware";

/** Rotas que não exigem login. */
const PUBLICAS = ["/login", "/auth/", "/convite/", "/privacidade"];

export async function middleware(request: NextRequest) {
  const { response, userId } = await atualizarSessao(request);
  const { pathname, search } = request.nextUrl;

  const publica = PUBLICAS.some((p) => pathname === p || pathname.startsWith(p));
  if (!userId && !publica) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname + search)}`;
    const redirecionar = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirecionar.cookies.set(c));
    return redirecionar;
  }
  return response;
}

export const config = {
  matcher: [
    // Tudo, exceto arquivos estáticos, ícones da marca, manifest e service worker.
    "/((?!_next/static|_next/image|brand/|manifest.webmanifest|sw.js|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
