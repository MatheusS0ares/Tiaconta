import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Titulo } from "@/components/ui/Titulo";
import { exigirPapel, clienteDaEscola } from "@/lib/escola";
import { opcoesDoCampo, unidadeDoCampo } from "@/lib/agenda/tipos";
import { FormCampo } from "./FormCampo";

export const metadata: Metadata = { title: "Campo da agenda" };

export default async function EditarCampo({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const escola = await exigirPapel(slug, "gestor");
  const { data: c } = await (await clienteDaEscola())
    .from("agenda_campos")
    .select("id, rotulo, tipo, opcoes, faixas, visivel_responsavel, multiplo, grupo, destaque, pede_visto")
    .eq("id", id)
    .eq("escola_id", escola.id)
    .maybeSingle();
  if (!c) notFound();

  return (
    <>
      <Titulo voltar={`/${slug}/gestao/campos`}>{c.rotulo}</Titulo>
      <FormCampo
        slug={slug}
        campo={{
          id: c.id,
          rotulo: c.rotulo,
          tipo: c.tipo,
          opcoes: opcoesDoCampo(c.opcoes),
          unidade: unidadeDoCampo(c.opcoes),
          faixas: c.faixas ?? [],
          visivel_responsavel: c.visivel_responsavel,
          multiplo: c.multiplo,
          grupo: c.grupo,
          destaque: c.destaque,
          pedeVisto: c.pede_visto,
          destaqueOpcoes: Array.isArray((c.opcoes as { destaque_opcoes?: unknown })?.destaque_opcoes)
            ? ((c.opcoes as { destaque_opcoes: string[] }).destaque_opcoes)
            : [],
          destaqueAcima: typeof (c.opcoes as { destaque_acima?: unknown })?.destaque_acima === "number"
            ? String((c.opcoes as { destaque_acima: number }).destaque_acima).replace(".", ",")
            : "",
        }}
      />
    </>
  );
}
