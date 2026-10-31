import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export const BUCKET_FOTOS = "criancas-fotos";

/** URLs assinadas (1h) para fotos privadas. Retorna mapa caminho → url. */
export async function urlsAssinadas(supabase: SupabaseClient<Database>, caminhos: (string | null)[]) {
  const validos = [...new Set(caminhos.filter((c): c is string => !!c))];
  const mapa = new Map<string, string>();
  if (!validos.length) return mapa;
  const { data } = await supabase.storage.from(BUCKET_FOTOS).createSignedUrls(validos, 60 * 60);
  for (const item of data ?? []) if (item.path && item.signedUrl) mapa.set(item.path, item.signedUrl);
  return mapa;
}
