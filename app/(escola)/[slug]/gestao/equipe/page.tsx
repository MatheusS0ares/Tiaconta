import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Clock, UserPlus, Users } from "lucide-react";
import { Titulo } from "@/components/ui/Titulo";
import { Cartao } from "@/components/ui/Cartao";
import { EstadoVazio } from "@/components/ui/EstadoVazio";
import { BotaoLink } from "@/components/ui/Botao";
import { exigirPapel, clienteDaEscola } from "@/lib/escola";
import { formatarValidade } from "@/lib/convites";
import { NOME_DO_PAPEL } from "@/lib/auth/papeis";

export const metadata: Metadata = { title: "Equipe" };

export default async function Equipe({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const escola = await exigirPapel(slug, "gestor");
  const supabase = await clienteDaEscola();
  const agora = new Date().toISOString();

  const [convites, membros, perfis] = await Promise.all([
    supabase
      .from("convites")
      .select("id, papel, parentesco, expira_em, criancas(nome), turmas(nome)")
      .eq("escola_id", escola.id)
      .is("aceito_em", null)
      .is("revogado_em", null)
      .gt("expira_em", agora)
      .order("criado_em", { ascending: false }),
    supabase
      .from("membros")
      .select("user_id, papel")
      .eq("escola_id", escola.id)
      .eq("ativo", true)
      .in("papel", ["gestor", "professora"]),
    supabase.from("perfis").select("user_id, nome"),
  ]);
  if (convites.error || membros.error || perfis.error) throw convites.error ?? membros.error ?? perfis.error;

  const nomes = new Map(perfis.data.map((p) => [p.user_id, p.nome]));
  const equipe = [...new Map(membros.data.map((m) => [m.user_id, m])).values()]
    .map((m) => ({
      ...m,
      nome: nomes.get(m.user_id) ?? "Sem nome",
      papeis: membros.data.filter((x) => x.user_id === m.user_id).map((x) => NOME_DO_PAPEL[x.papel]),
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  return (
    <>
      <Titulo voltar={`/${slug}/gestao/mais`}>Equipe</Titulo>

      {convites.data.length > 0 ? (
        <section className="flex flex-col gap-3" aria-labelledby="pendentes">
          <h2 id="pendentes" className="text-lg font-semibold">
            Convites aguardando
          </h2>
          <ul className="flex flex-col gap-2">
            {convites.data.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/${slug}/gestao/equipe/convite/${c.id}`}
                  className="flex min-h-16 items-center gap-3 rounded-tc border border-neutra px-4"
                >
                  <Clock className="size-5 shrink-0 text-atencao" aria-hidden />
                  <span className="flex-1">
                    <span className="block font-bold">
                      {c.papel === "responsavel" ? `Responsável · ${c.criancas?.nome}` : `Professora${c.turmas ? " · " + c.turmas.nome : ""}`}
                    </span>
                    <span className="block text-sm text-texto-2">Aguardando · vale até {formatarValidade(c.expira_em)}</span>
                  </span>
                  <ChevronRight className="size-5 text-texto-2" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="flex flex-col gap-3" aria-labelledby="equipe">
        <h2 id="equipe" className="text-lg font-semibold">
          Equipe da escola
        </h2>
        {equipe.length === 0 ? (
          <EstadoVazio icone={Users} titulo="Ninguém na equipe ainda">
            <p>Toque em &quot;Convidar&quot; para chamar as professoras.</p>
          </EstadoVazio>
        ) : (
          <Cartao className="p-0">
            <ul className="divide-y divide-neutra">
              {equipe.map((m) => (
                <li key={m.user_id} className="flex min-h-14 flex-col justify-center px-4 py-2">
                  <span className="font-bold">{m.nome}</span>
                  <span className="text-sm text-texto-2">{m.papeis.join(" · ")}</span>
                </li>
              ))}
            </ul>
          </Cartao>
        )}
      </section>

      <div className="sticky bottom-20 mt-auto pt-2">
        <BotaoLink href={`/${slug}/gestao/equipe/convidar`}>
          <UserPlus className="size-5" aria-hidden />
          Convidar
        </BotaoLink>
      </div>
    </>
  );
}
