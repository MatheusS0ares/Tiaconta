import { redirect } from "next/navigation";
import { escolaAtual } from "@/lib/escola";
import { papelPrincipal, ROTA_DO_PAPEL } from "@/lib/auth/papeis";

/** Entrada da escola: leva para a área do papel principal do usuário. */
export default async function EntradaEscola({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const escola = await escolaAtual(slug);
  const papel = papelPrincipal(escola.papeis)!;
  redirect(`/${slug}/${ROTA_DO_PAPEL[papel]}`);
}
