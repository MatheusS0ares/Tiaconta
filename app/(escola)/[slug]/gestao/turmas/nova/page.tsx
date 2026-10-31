import type { Metadata } from "next";
import { Titulo } from "@/components/ui/Titulo";
import { exigirPapel, clienteDaEscola } from "@/lib/escola";
import { professorasDaEscola } from "@/lib/gestao";
import { FormTurma } from "../FormTurma";

export const metadata: Metadata = { title: "Nova turma" };

export default async function NovaTurma({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const escola = await exigirPapel(slug, "gestor");
  const professoras = await professorasDaEscola(await clienteDaEscola(), escola.id);
  return (
    <>
      <Titulo voltar={`/${slug}/gestao/turmas`}>Nova turma</Titulo>
      <FormTurma slug={slug} professoras={professoras} />
    </>
  );
}
