import { notFound } from "next/navigation";
import { exigirPapel, clienteDaEscola } from "@/lib/escola";
import { obterUsuario } from "@/lib/auth/sessao";
import { carregarTurmaDia } from "@/lib/agenda/turma-dia";
import { dataValida, hoje } from "@/lib/agenda/data";
import { AgendaProvider } from "@/components/agenda/AgendaProvider";
import { ToastProvider } from "@/components/ui/Toast";

/**
 * Agenda de uma turma em qualquer dia, vista pela gestão. Mesmas telas da
 * professora; como gestor, pode corrigir inclusive dias já finalizados
 * (RLS: fn_dia_editavel libera o gestor). Cada correção guarda quem e quando.
 */
export default async function LayoutAgendaGestao({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string; turmaId: string; data: string }>;
}) {
  const { slug, turmaId, data } = await params;
  if (!dataValida(data) || data > hoje()) notFound();
  const escola = await exigirPapel(slug, "gestor");
  const usuario = (await obterUsuario())!;
  const dados = await carregarTurmaDia(await clienteDaEscola(), {
    escolaId: escola.id,
    turmaId,
    data,
    usuarioId: usuario.id,
    eGestor: true,
  });
  if (!dados) notFound();
  return (
    <ToastProvider>
      <AgendaProvider dados={dados} base={`/${slug}/gestao/agenda/${turmaId}/${data}`} voltar={`/${slug}/gestao/dia?data=${data}`}>
        {children}
      </AgendaProvider>
    </ToastProvider>
  );
}
