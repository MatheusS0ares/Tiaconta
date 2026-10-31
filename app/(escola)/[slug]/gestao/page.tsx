import type { Metadata } from "next";
import { SetaLink } from "@/components/ui/SetaLink";
import Link from "next/link";
import { BookOpenCheck, CircleCheck, Clock, PencilLine, UserX } from "lucide-react";
import { Titulo } from "@/components/ui/Titulo";
import { NavegarData } from "@/components/gestao/NavegarData";
import { exigirPapel, clienteDaEscola } from "@/lib/escola";
import { carregarPainel } from "@/lib/gestao/painel";
import { dataDoPainel } from "@/lib/gestao/data-painel";
import { horaDe } from "@/lib/agenda/data";

export const metadata: Metadata = { title: "Painel" };

/** Painel da gestora: 4 indicadores (UX.md §5: no máximo 5), detalhe a um toque. */
export default async function Painel({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ data?: string }>;
}) {
  const { slug } = await params;
  const data = dataDoPainel((await searchParams).data);
  const escola = await exigirPapel(slug, "gestor");
  const p = await carregarPainel(await clienteDaEscola(), escola.id, data);
  const q = `?data=${data}`;

  const turmasFinalizadas = p.turmas.filter((t) => t.finalizada).length;
  const pendentes = p.turmas.filter((t) => !t.finalizada && t.total > 0);
  const registros = p.eventos.filter((e) => e.tipo === "registro");
  const quemRegistrou = [...new Set(registros.map((e) => e.quem).filter(Boolean))]
    .map((id) => p.nomes[id!]?.split(" ")[0])
    .filter(Boolean)
    .sort((a, b) => a!.localeCompare(b!, "pt-BR")); // ordem alfabética: fato, não ranking
  const liberadas = p.familias.filter((f) => f.situacao === "lido" || f.situacao === "nao_lido");
  const lidas = liberadas.filter((f) => f.situacao === "lido").length;
  const ultimo = registros[0];

  const indicadores = [
    {
      href: `/${slug}/gestao/dia${q}`,
      Icone: pendentes.length ? Clock : CircleCheck,
      cor: pendentes.length ? "text-atencao" : "text-sucesso",
      titulo: "Turmas finalizadas",
      valor: `${turmasFinalizadas} de ${p.turmas.length}`,
      detalhe: pendentes.length ? `Pendente: ${pendentes.map((t) => t.nome).join(", ")}` : p.turmas.length ? "Todas finalizadas" : "Nenhuma turma",
    },
    {
      href: `/${slug}/gestao/atividade${q}`,
      Icone: PencilLine,
      cor: "text-texto",
      titulo: "Registros da equipe",
      valor: String(registros.length),
      detalhe: registros.length
        ? `${quemRegistrou.join(", ")} · último às ${horaDe(ultimo!.quando)}`
        : "Nenhum registro ainda",
    },
    {
      href: `/${slug}/gestao/faltas${q}`,
      Icone: UserX,
      cor: "text-texto",
      titulo: "Faltas",
      valor: String(p.faltas.length),
      detalhe: p.faltas.length ? p.faltas.slice(0, 3).map((f) => f.crianca.split(" ")[0]).join(", ") + (p.faltas.length > 3 ? "…" : "") : "Nenhuma falta",
    },
    {
      href: `/${slug}/gestao/leituras${q}`,
      Icone: BookOpenCheck,
      cor: "text-texto",
      titulo: "Famílias que leram",
      valor: liberadas.length ? `${lidas} de ${liberadas.length}` : "—",
      detalhe: liberadas.length ? "dias já liberados para a família" : "Nenhum dia liberado ainda",
    },
  ];

  return (
    <>
      <Titulo>Painel</Titulo>
      <NavegarData data={data} href={(d) => `/${slug}/gestao?data=${d}`} />
      <ul className="flex flex-col gap-3">
        {indicadores.map(({ href, Icone, cor, titulo, valor, detalhe }) => (
          <li key={titulo}>
            <Link href={href} className="flex min-h-24 items-center gap-4 rounded-tc border border-neutra p-4">
              <Icone className={`size-7 shrink-0 ${cor}`} aria-hidden />
              <span className="flex-1">
                <span className="block text-sm font-bold text-texto-2">{titulo}</span>
                <span className="block font-marca text-3xl font-semibold leading-tight">{valor}</span>
                <span className="block text-sm text-texto-2">{detalhe}</span>
              </span>
              <SetaLink className="size-5 shrink-0 text-texto-2" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
