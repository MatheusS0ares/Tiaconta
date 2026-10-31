import type { Metadata } from "next";
import Link from "next/link";
import { Baby, ChevronRight, Plus } from "lucide-react";
import { Titulo } from "@/components/ui/Titulo";
import { EstadoVazio } from "@/components/ui/EstadoVazio";
import { BotaoLink } from "@/components/ui/Botao";
import { Avatar } from "@/components/ui/Avatar";
import { exigirPapel, clienteDaEscola } from "@/lib/escola";
import { urlsAssinadas } from "@/lib/fotos";
import { idade } from "@/lib/gestao";

export const metadata: Metadata = { title: "Crianças" };

const chip = "flex min-h-12 shrink-0 items-center rounded-full border-2 px-4 font-semibold";

export default async function Criancas({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ turma?: string; arquivadas?: string }>;
}) {
  const { slug } = await params;
  const { turma, arquivadas } = await searchParams;
  const escola = await exigirPapel(slug, "gestor");
  const supabase = await clienteDaEscola();
  const verArquivadas = arquivadas === "1";

  const [{ data: turmas }, consulta] = await Promise.all([
    supabase.from("turmas").select("id, nome").eq("escola_id", escola.id).eq("ativa", true).order("nome"),
    (() => {
      let q = supabase
        .from("criancas")
        .select("id, nome, data_nascimento, foto_path, autoriza_imagem, turmas(nome), responsaveis_criancas(user_id)")
        .eq("escola_id", escola.id)
        .eq("ativa", !verArquivadas)
        .order("nome");
      if (turma) q = q.eq("turma_id", turma);
      return q;
    })(),
  ]);
  if (consulta.error) throw consulta.error;
  const criancas = consulta.data;
  const fotos = await urlsAssinadas(supabase, criancas.map((c) => c.foto_path));
  const base = `/${slug}/gestao/criancas`;

  return (
    <>
      <Titulo>Crianças</Titulo>
      <nav aria-label="Filtrar por turma" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {[{ id: undefined, nome: "Todas" }, ...(turmas ?? [])].map((t) => {
          const ativo = (t.id ?? null) === (turma ?? null) && !verArquivadas;
          return (
            <Link
              key={t.id ?? "todas"}
              href={t.id ? `${base}?turma=${t.id}` : base}
              aria-current={ativo ? "page" : undefined}
              className={`${chip} ${ativo ? "border-primaria bg-primaria text-primaria-texto" : "border-neutra"}`}
            >
              {t.nome}
            </Link>
          );
        })}
      </nav>

      {criancas.length === 0 ? (
        <EstadoVazio icone={Baby} titulo={verArquivadas ? "Nenhuma criança arquivada" : "Nenhuma criança aqui ainda"}>
          {verArquivadas ? null : <p>Toque em &quot;Nova criança&quot; para cadastrar.</p>}
        </EstadoVazio>
      ) : (
        <ul className="flex flex-col gap-2">
          {criancas.map((c) => {
            const detalhes = [
              turma ? null : c.turmas?.nome,
              idade(c.data_nascimento),
              c.responsaveis_criancas.length ? null : "sem responsável",
            ].filter(Boolean);
            return (
              <li key={c.id}>
                <Link href={`${base}/${c.id}`} className="flex min-h-16 items-center gap-3 rounded-tc border border-neutra px-3 py-2">
                  <Avatar nome={c.nome} url={c.foto_path ? fotos.get(c.foto_path) : null} />
                  <span className="flex-1">
                    <span className="block font-bold">{c.nome}</span>
                    <span className="block text-sm text-texto-2">{detalhes.join(" · ")}</span>
                  </span>
                  <ChevronRight className="size-5 text-texto-2" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Link href={verArquivadas ? base : `${base}?arquivadas=1`} className="flex min-h-12 items-center self-center font-bold underline underline-offset-4">
        {verArquivadas ? "Ver crianças ativas" : "Ver arquivadas"}
      </Link>

      <div className="sticky bottom-20 mt-auto pt-2">
        <BotaoLink href={turma ? `${base}/nova?turma=${turma}` : `${base}/nova`}>
          <Plus className="size-5" aria-hidden />
          Nova criança
        </BotaoLink>
      </div>
    </>
  );
}
