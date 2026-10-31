import type { Metadata } from "next";
import { SetaLink } from "@/components/ui/SetaLink";
import Link from "next/link";
import { Baby, GraduationCap, School } from "lucide-react";
import { Titulo } from "@/components/ui/Titulo";
import { Escolha } from "@/components/ui/Escolha";
import { EstadoVazio } from "@/components/ui/EstadoVazio";
import { BotaoLink } from "@/components/ui/Botao";
import { exigirPapel, clienteDaEscola } from "@/lib/escola";
import { PARENTESCOS } from "@/lib/convites";
import { FormConvite } from "./FormConvite";

export const metadata: Metadata = { title: "Convidar" };

const linha =
  "flex min-h-16 items-center gap-4 rounded-tc border border-neutra bg-fundo px-4 font-bold";

export default async function Convidar({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ papel?: string; turma?: string; crianca?: string }>;
}) {
  const { slug } = await params;
  const { papel, turma, crianca: criancaPadrao } = await searchParams;
  const escola = await exigirPapel(slug, "gestor");
  const supabase = await clienteDaEscola();
  const base = `/${slug}/gestao/equipe/convidar`;

  // Passo 1: quem convidar
  if (papel !== "professora" && papel !== "responsavel") {
    return (
      <>
        <Titulo voltar={`/${slug}/gestao/equipe`}>Quem você quer convidar?</Titulo>
        <ul className="flex flex-col gap-3">
          <li>
            <Link href={`${base}?papel=professora`} className={linha}>
              <GraduationCap className="size-7" aria-hidden />
              <span className="flex-1">Professora</span>
              <SetaLink className="size-6 text-texto-2" />
            </Link>
          </li>
          <li>
            <Link href={`${base}?papel=responsavel`} className={linha}>
              <Baby className="size-7" aria-hidden />
              <span className="flex-1">Responsável por uma criança</span>
              <SetaLink className="size-6 text-texto-2" />
            </Link>
          </li>
        </ul>
      </>
    );
  }

  const { data: turmas, error } = await supabase
    .from("turmas")
    .select("id, nome")
    .eq("escola_id", escola.id)
    .eq("ativa", true)
    .order("nome");
  if (error) throw error;

  if (papel === "professora") {
    return (
      <>
        <Titulo voltar={base}>Convidar professora</Titulo>
        <FormConvite slug={slug} papel="professora">
          {turmas.length ? (
            <Escolha
              legenda="Turma (opcional)"
              name="turma_id"
              opcoes={[...turmas.map((t) => ({ valor: t.id, rotulo: t.nome })), { valor: "", rotulo: "Depois" }]}
            />
          ) : null}
          <p className="text-texto-2">Você vai receber um link para mandar no WhatsApp. Ele vale por 7 dias e só pode ser usado uma vez.</p>
        </FormConvite>
      </>
    );
  }

  // Responsável — passo 2: turma da criança
  const turmaEscolhida = turmas.find((t) => t.id === turma);
  if (!turmaEscolhida) {
    return (
      <>
        <Titulo voltar={base}>Em qual turma está a criança?</Titulo>
        {turmas.length === 0 ? (
          <EstadoVazio icone={School} titulo="Nenhuma turma cadastrada">
            <p>Cadastre as turmas e as crianças antes de convidar os responsáveis.</p>
          </EstadoVazio>
        ) : (
          <ul className="flex flex-col gap-3">
            {turmas.map((t) => (
              <li key={t.id}>
                <Link href={`${base}?papel=responsavel&turma=${t.id}`} className={linha}>
                  <span className="flex-1">{t.nome}</span>
                  <SetaLink className="size-6 text-texto-2" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </>
    );
  }

  // Responsável — passo 3: criança e parentesco
  const { data: criancas, error: erroCriancas } = await supabase
    .from("criancas")
    .select("id, nome")
    .eq("escola_id", escola.id)
    .eq("turma_id", turmaEscolhida.id)
    .eq("ativa", true)
    .order("nome");
  if (erroCriancas) throw erroCriancas;

  return (
    <>
      <Titulo voltar={`${base}?papel=responsavel`} subtitulo={turmaEscolhida.nome}>
        Convidar responsável
      </Titulo>
      {criancas.length === 0 ? (
        <>
          <EstadoVazio icone={Baby} titulo="Nenhuma criança nesta turma">
            <p>Cadastre as crianças da turma para poder convidar os responsáveis.</p>
          </EstadoVazio>
          <BotaoLink href={`${base}?papel=responsavel`} variante="secundaria">
            Escolher outra turma
          </BotaoLink>
        </>
      ) : (
        <FormConvite slug={slug} papel="responsavel">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-3 font-bold">Criança</legend>
            {criancas.map((c) => (
              <label
                key={c.id}
                className="flex min-h-14 cursor-pointer items-center gap-3 rounded-tc border-2 border-neutra px-4 font-semibold has-[:checked]:border-primaria"
              >
                <input
                  type="radio"
                  name="crianca_id"
                  value={c.id}
                  required
                  defaultChecked={c.id === criancaPadrao}
                  className="size-5 accent-[var(--escola-primaria)]"
                />
                {c.nome}
              </label>
            ))}
          </fieldset>
          <Escolha
            legenda="Parentesco (opcional)"
            name="parentesco"
            opcoes={PARENTESCOS.map((p) => ({ valor: p, rotulo: p }))}
          />
        </FormConvite>
      )}
    </>
  );
}
