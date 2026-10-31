import type { Metadata } from "next";
import { SetaLink } from "@/components/ui/SetaLink";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, UserPlus } from "lucide-react";
import { Titulo } from "@/components/ui/Titulo";
import { Cartao } from "@/components/ui/Cartao";
import { Aviso } from "@/components/ui/Aviso";
import { BotaoLink } from "@/components/ui/Botao";
import { BotaoConfirmar } from "@/components/ui/BotaoConfirmar";
import { BotaoEnviar } from "@/components/ui/BotaoEnviar";
import { exigirPapel, clienteDaEscola } from "@/lib/escola";
import { urlsAssinadas } from "@/lib/fotos";
import { formatarValidade } from "@/lib/convites";
import { FormCrianca } from "../FormCrianca";
import { FotoCrianca } from "./FotoCrianca";
import { FormDestino } from "@/components/ui/FormDestino";
import { alternarArquivoCrianca, removerFoto, removerResponsavel } from "../actions";

export const metadata: Metadata = { title: "Criança" };

export default async function EditarCrianca({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; id: string }>;
  searchParams: Promise<{ nova?: string }>;
}) {
  const { slug, id } = await params;
  const { nova } = await searchParams;
  const escola = await exigirPapel(slug, "gestor");
  const supabase = await clienteDaEscola();

  const [{ data: crianca }, { data: turmas }, { data: convites }] = await Promise.all([
    supabase
      .from("criancas")
      .select("id, nome, data_nascimento, turma_id, autoriza_imagem, restricoes_alimentares, observacoes_saude, foto_path, ativa, responsaveis_criancas(user_id, parentesco)")
      .eq("id", id)
      .eq("escola_id", escola.id)
      .maybeSingle(),
    supabase.from("turmas").select("id, nome").eq("escola_id", escola.id).eq("ativa", true).order("nome"),
    supabase
      .from("convites")
      .select("id, parentesco, expira_em")
      .eq("crianca_id", id)
      .is("aceito_em", null)
      .is("revogado_em", null)
      .gt("expira_em", new Date().toISOString()),
  ]);
  if (!crianca) notFound();

  const idsResp = crianca.responsaveis_criancas.map((r) => r.user_id);
  const [{ data: perfis }, fotos] = await Promise.all([
    idsResp.length
      ? supabase.from("perfis").select("user_id, nome, telefone").in("user_id", idsResp)
      : Promise.resolve({ data: [] as { user_id: string; nome: string; telefone: string | null }[] }),
    urlsAssinadas(supabase, [crianca.foto_path]),
  ]);
  const perfil = new Map((perfis ?? []).map((p) => [p.user_id, p]));
  const urlFoto = crianca.foto_path ? (fotos.get(crianca.foto_path) ?? null) : null;

  return (
    <>
      <Titulo voltar={`/${slug}/gestao/criancas`} subtitulo={crianca.ativa ? undefined : "Arquivada"}>
        {crianca.nome}
      </Titulo>
      {nova ? <Aviso tipo="sucesso">Criança cadastrada. Agora convide os responsáveis.</Aviso> : null}

      <FotoCrianca slug={slug} id={crianca.id} nome={crianca.nome} url={urlFoto} />
      {urlFoto ? (
        <form action={removerFoto.bind(null, slug, crianca.id)} className="-mt-4">
          <BotaoConfirmar>Remover foto</BotaoConfirmar>
        </form>
      ) : null}

      <section className="flex flex-col gap-3" aria-labelledby="responsaveis">
        <h2 id="responsaveis" className="text-lg font-semibold">
          Responsáveis
        </h2>
        {crianca.responsaveis_criancas.length === 0 && !convites?.length ? (
          <p className="text-texto-2">Nenhum responsável ainda.</p>
        ) : null}
        {crianca.responsaveis_criancas.length ? (
          <Cartao className="p-0">
            <ul className="divide-y divide-neutra">
              {crianca.responsaveis_criancas.map((r) => {
                const p = perfil.get(r.user_id);
                return (
                  <li key={r.user_id} className="flex items-center gap-3 px-4 py-2">
                    <span className="flex-1">
                      <span className="block font-bold">{p?.nome ?? "Sem nome"}</span>
                      <span className="block text-sm text-texto-2">{[r.parentesco, p?.telefone].filter(Boolean).join(" · ")}</span>
                    </span>
                    <form action={removerResponsavel.bind(null, slug, crianca.id, r.user_id)}>
                      <BotaoConfirmar confirmar="Confirmar">Remover</BotaoConfirmar>
                    </form>
                  </li>
                );
              })}
            </ul>
          </Cartao>
        ) : null}
        {convites?.length ? (
          <ul className="flex flex-col gap-2">
            {convites.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/${slug}/gestao/equipe/convite/${c.id}`}
                  className="flex min-h-14 items-center gap-3 rounded-tc border border-neutra px-4"
                >
                  <Clock className="size-5 text-atencao" aria-hidden />
                  <span className="flex-1 text-sm">
                    <span className="block font-bold">Convite {c.parentesco ? `(${c.parentesco})` : ""} aguardando</span>
                    vale até {formatarValidade(c.expira_em)}
                  </span>
                  <SetaLink className="size-5 text-texto-2" />
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
        {crianca.ativa && crianca.turma_id ? (
          <BotaoLink
            variante="secundaria"
            href={`/${slug}/gestao/equipe/convidar?papel=responsavel&turma=${crianca.turma_id}&crianca=${crianca.id}`}
          >
            <UserPlus className="size-5" aria-hidden />
            Convidar responsável
          </BotaoLink>
        ) : null}
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="dados">
        <h2 id="dados" className="text-lg font-semibold">
          Dados
        </h2>
        <FormCrianca slug={slug} crianca={crianca} turmas={turmas ?? []} />
      </section>

      <section className="border-t border-neutra pt-4">
        <FormDestino acao={alternarArquivoCrianca.bind(null, slug, crianca.id, !crianca.ativa)}>
          {crianca.ativa ? (
            <BotaoConfirmar>Arquivar criança</BotaoConfirmar>
          ) : (
            <BotaoEnviar variante="secundaria">Reativar criança</BotaoEnviar>
          )}
        </FormDestino>
      </section>
    </>
  );
}
