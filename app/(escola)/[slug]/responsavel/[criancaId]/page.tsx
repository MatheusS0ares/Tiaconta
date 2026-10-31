import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResumoDia } from "@/components/responsavel/ResumoDia";
import { escolaAtual, clienteDaEscola } from "@/lib/escola";
import { obterUsuario } from "@/lib/auth/sessao";
import { carregarResumo } from "@/lib/agenda/resumo";
import { dataValida, hoje } from "@/lib/agenda/data";

export const metadata: Metadata = { title: "Resumo do dia" };

/** Resumo do dia (Server Component: rápido no 4G, sem JS além de Visto/leitura). */
export default async function PaginaResumo({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; criancaId: string }>;
  searchParams: Promise<{ dia?: string }>;
}) {
  const { slug, criancaId } = await params;
  const { dia } = await searchParams;
  const escola = await escolaAtual(slug);
  const usuario = (await obterUsuario())!;
  const hojeEscola = hoje();
  const data = dataValida(dia) && dia <= hojeEscola ? dia : hojeEscola;
  const supabase = await clienteDaEscola();

  const resumo = await carregarResumo(supabase, { escolaId: escola.id, criancaId, data, usuarioId: usuario.id });
  if (!resumo) notFound();

  const autor = resumo.dia?.finalizadoPor;
  const { data: perfil } = autor
    ? await supabase.from("perfis").select("user_id, nome").eq("user_id", autor).maybeSingle()
    : { data: null };
  const nomes = perfil ? { [perfil.user_id]: perfil.nome.split(" ")[0]! } : {};

  return <ResumoDia resumo={resumo} slug={slug} nomes={nomes} hoje={hojeEscola} />;
}
