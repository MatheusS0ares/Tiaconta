import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { criarClienteServidor } from "@/lib/supabase/server";
import { caminhoSeguro } from "@/lib/navegacao";

/**
 * Destino do link mágico. Aceita os dois formatos:
 *  - token_hash + type (template próprio; funciona mesmo abrindo o e-mail em outro navegador)
 *  - code (fluxo PKCE padrão do Supabase)
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = caminhoSeguro(searchParams.get("next"));
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  const supabase = await criarClienteServidor();
  let ok = false;
  if (tokenHash && type) {
    ok = !(await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).error;
  } else if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  }

  const destino = ok ? next : `/login?erro=link&next=${encodeURIComponent(next)}`;
  return NextResponse.redirect(new URL(destino, origin));
}
