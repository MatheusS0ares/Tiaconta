import { notFound } from "next/navigation";
import { exigirPapel, clienteDaEscola } from "@/lib/escola";
import { obterUsuario } from "@/lib/auth/sessao";
import { carregarTurmaDia } from "@/lib/agenda/turma-dia";
import { hoje } from "@/lib/agenda/data";
import { AgendaProvider } from "@/components/agenda/AgendaProvider";

/**
 * Carrega o dia da turma (hoje, no fuso da escola) uma vez e compartilha com
 * lista, criança, lote e mural via AgendaProvider (estado otimista + fila).
 */
export default async function LayoutTurma({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string; turmaId: string }>;
}) {
  const { slug, turmaId } = await params;
  const escola = await exigirPapel(slug, "professora");
  const usuario = (await obterUsuario())!;
  const dados = await carregarTurmaDia(await clienteDaEscola(), {
    escolaId: escola.id,
    turmaId,
    data: hoje(),
    usuarioId: usuario.id,
    eGestor: escola.papeis.includes("gestor"),
  });
  if (!dados) notFound();
  return (
    <AgendaProvider dados={dados} base={`/${slug}/professora/turma/${turmaId}`}>
      {children}
    </AgendaProvider>
  );
}
