import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";
import { supabaseEnv } from "./env";

/**
 * Renova a sessão do Supabase a cada requisição e devolve a resposta com os
 * cookies atualizados. Retorna também o id do usuário (ou null).
 */
export async function atualizarSessao(request: NextRequest) {
  const { url, chave } = supabaseEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(url, chave, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([chaveHeader, valor]) => response.headers.set(chaveHeader, valor));
      },
    },
  });

  // Não colocar código entre a criação do cliente e getClaims():
  // é aqui que o token é validado e renovado.
  const { data } = await supabase.auth.getClaims();
  const userId = (data?.claims?.sub as string | undefined) ?? null;

  return { response, userId };
}
