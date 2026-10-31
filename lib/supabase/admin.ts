import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { supabaseEnv } from "./env";

/**
 * Cliente com a service_role: IGNORA RLS.
 * Regra 3 do CLAUDE.md: só em código de servidor e só quando RLS realmente
 * não resolve. Todo uso deve ter um comentário explicando por quê.
 */
export function criarClienteAdmin() {
  const { url } = supabaseEnv();
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!chave) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY (só no servidor). Veja .env.example.");
  return createClient<Database>(url, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
