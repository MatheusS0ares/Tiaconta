"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { supabaseEnv } from "./env";

let cliente: ReturnType<typeof createBrowserClient<Database>> | undefined;

/** Cliente Supabase do browser, com a sessão do usuário (RLS vale). */
export function criarClienteBrowser() {
  if (!cliente) {
    const { url, chave } = supabaseEnv();
    cliente = createBrowserClient<Database>(url, chave);
  }
  return cliente;
}
