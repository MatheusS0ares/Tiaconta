import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Titulo } from "@/components/ui/Titulo";
import { Cartao } from "@/components/ui/Cartao";
import { Aviso } from "@/components/ui/Aviso";
import { BotaoCopiar } from "@/components/ui/BotaoCopiar";
import { classesBotao } from "@/components/ui/Botao";
import { exigirPapel, clienteDaEscola } from "@/lib/escola";
import { formatarValidade, linkDoConvite, linkWhatsApp, mensagemDoConvite } from "@/lib/convites";
import { revogarConvite } from "../../actions";
import { FormDestino } from "@/components/ui/FormDestino";

export const metadata: Metadata = { title: "Convite" };

export default async function Convite({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const escola = await exigirPapel(slug, "gestor");
  const supabase = await clienteDaEscola();
  const { data: c } = await supabase
    .from("convites")
    .select("id, token, papel, parentesco, expira_em, aceito_em, revogado_em, criancas(nome), turmas(nome)")
    .eq("id", id)
    .eq("escola_id", escola.id)
    .maybeSingle();
  if (!c) notFound();

  const link = linkDoConvite(c.token);
  const mensagem = mensagemDoConvite({
    escola: escola.nome,
    papel: c.papel,
    crianca: c.criancas?.nome,
    turma: c.turmas?.nome,
    link,
  });
  const pendente = !c.aceito_em && !c.revogado_em && new Date(c.expira_em) > new Date();
  const para =
    c.papel === "responsavel"
      ? `${c.parentesco ? c.parentesco + " de " : "Responsável por "}${c.criancas?.nome}`
      : `Professora${c.turmas ? " · " + c.turmas.nome : ""}`;

  return (
    <>
      <Titulo voltar={`/${slug}/gestao/equipe`}>Convite</Titulo>
      <Cartao className="flex flex-col gap-2">
        <p className="font-bold">{para}</p>
        <p className="text-texto-2">
          {c.aceito_em
            ? "Convite aceito."
            : c.revogado_em
              ? "Convite cancelado."
              : pendente
                ? `Vale até ${formatarValidade(c.expira_em)}, para uma pessoa.`
                : "Convite vencido."}
        </p>
        {pendente ? (
          <FormDestino acao={revogarConvite.bind(null, slug, c.id)}>
            <button type="submit" className="min-h-12 font-bold text-alerta underline underline-offset-4">
              Cancelar convite
            </button>
          </FormDestino>
        ) : null}
      </Cartao>

      {pendente ? (
        <>
          <div className="flex flex-col gap-2">
            <p className="font-bold">Mensagem</p>
            <p className="rounded-tc bg-superficie p-4 break-words">{mensagem}</p>
          </div>
          <div className="sticky bottom-20 mt-auto flex flex-col gap-3 bg-fundo pt-2">
            <BotaoCopiar texto={link} />
            <a href={linkWhatsApp(mensagem)} target="_blank" rel="noopener noreferrer" className={classesBotao("primaria")}>
              <MessageCircle className="size-5" aria-hidden />
              Enviar pelo WhatsApp
            </a>
          </div>
        </>
      ) : (
        <Aviso>Para convidar de novo, crie um novo convite.</Aviso>
      )}
    </>
  );
}
