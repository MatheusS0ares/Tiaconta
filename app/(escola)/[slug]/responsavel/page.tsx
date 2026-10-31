import { redirect } from "next/navigation";
import Link from "next/link";
import { Baby, ChevronRight } from "lucide-react";
import { EstadoVazio } from "@/components/ui/EstadoVazio";
import { Avatar } from "@/components/ui/Avatar";
import { Titulo } from "@/components/ui/Titulo";
import { escolaAtual, clienteDaEscola } from "@/lib/escola";
import { urlsAssinadas } from "@/lib/fotos";
import { hoje } from "@/lib/agenda/data";

/** Início do responsável: um filho → resumo de hoje direto; vários → escolher. */
export default async function InicioResponsavel({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const escola = await escolaAtual(slug);
  const supabase = await clienteDaEscola();
  // RLS: o responsável só enxerga os próprios filhos.
  const { data: filhos, error } = await supabase
    .from("criancas")
    .select("id, nome, foto_path, turmas(nome), agenda_dias(status, faltou, data)")
    .eq("escola_id", escola.id)
    .eq("ativa", true)
    .eq("agenda_dias.data", hoje())
    .order("nome");
  if (error) throw error;
  if (filhos.length === 1) redirect(`/${slug}/responsavel/${filhos[0]!.id}`);
  const fotos = await urlsAssinadas(supabase, filhos.map((f) => f.foto_path));

  return (
    <>
      <Titulo>Hoje</Titulo>
      {filhos.length === 0 ? (
        <EstadoVazio icone={Baby} titulo="Nenhuma criança vinculada" principal>
          <p>Peça para a escola enviar o convite com o nome do seu filho.</p>
        </EstadoVazio>
      ) : (
        <ul className="flex flex-col gap-3">
          {filhos.map((f) => {
            const d = f.agenda_dias[0];
            const status = d?.faltou ? "Faltou hoje" : d?.status === "finalizado" ? "Dia finalizado" : d ? "Dia em andamento" : "Sem registros ainda";
            return (
              <li key={f.id}>
                <Link href={`/${slug}/responsavel/${f.id}`} className="flex min-h-20 items-center gap-4 rounded-tc border border-neutra p-3">
                  <Avatar nome={f.nome} url={f.foto_path ? fotos.get(f.foto_path) : null} tamanho={56} />
                  <span className="flex-1">
                    <span className="block font-bold">{f.nome}</span>
                    <span className="block text-sm text-texto-2">{[f.turmas?.nome, status].filter(Boolean).join(" · ")}</span>
                  </span>
                  <ChevronRight className="size-5 text-texto-2" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
