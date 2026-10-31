import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { supabaseEnv } from "./env";

/**
 * Cliente Supabase para Server Components, Server Actions e Route Handlers,
 * com a sessão do usuário (RLS vale). Criar um por requisição.
 */
export async function criarClienteServidor() {
  const { url, chave } = supabaseEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, chave, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Chamado de um Server Component: não dá para gravar cookie aqui.
          // O middleware já renova a sessão a cada requisição.
        }
      },
    },
  });
}
