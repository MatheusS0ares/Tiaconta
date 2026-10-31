/**
 * Variáveis públicas do Supabase. Lidas com acesso estático (process.env.X)
 * para que o Next.js consiga embuti-las no bundle do browser.
 */
export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !chave) {
    throw new Error(
      "Faltam NEXT_PUBLIC_SUPABASE_URL e/ou NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Veja .env.example.",
    );
  }
  return { url, chave };
}
