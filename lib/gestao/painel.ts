import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { textoDoValor } from "@/lib/agenda/exibir";

/**
 * Dados do painel da gestora para um dia (RLS: o gestor vê a escola toda).
 * Tudo é fato (quem, o quê, quando) — sem ranking nem rótulo (UX.md §5).
 */

export type TurmaPainel = {
  id: string;
  nome: string;
  total: number;
  finalizadas: number;
  faltas: number;
  pendentes: number; // sem nenhum registro e sem falta
  finalizadaEm: string | null;
  finalizadaPor: string | null;
  finalizada: boolean;
};

export type Evento = {
  quando: string;
  quem: string | null;
  tipo: "registro" | "edicao" | "finalizacao" | "mural";
  crianca: string | null;
  turmaId: string;
  criancaId: string | null;
  texto: string;
};

export type FamiliaPainel = {
  criancaId: string;
  crianca: string;
  turma: string;
  turmaId: string;
  situacao: "lido" | "nao_lido" | "nao_liberado" | "sem_responsavel" | "sem_registro";
  lidoEm: string | null;
  lidoPor: string | null;
  vistoTrazer: boolean | null; // null = não houve "trazer amanhã"
};

export type Painel = {
  data: string;
  turmas: TurmaPainel[];
  eventos: Evento[];
  faltas: { criancaId: string; crianca: string; turma: string; turmaId: string }[];
  familias: FamiliaPainel[];
  nomes: Record<string, string>;
  professoras: { id: string; nome: string; registros: number; ultimo: string | null }[];
};

export async function carregarPainel(supabase: SupabaseClient<Database>, escolaId: string, data: string): Promise<Painel> {
  const [escolaR, turmasR, criancasR, camposR, diasR, muraisR, profsR, rcR] = await Promise.all([
    supabase.from("escolas").select("agenda_visivel_antes_finalizar").eq("id", escolaId).single(),
    supabase.from("turmas").select("id, nome").eq("escola_id", escolaId).eq("ativa", true).order("nome"),
    supabase.from("criancas").select("id, nome, turma_id").eq("escola_id", escolaId).eq("ativa", true).order("nome"),
    supabase.from("agenda_campos").select("id, rotulo, tipo, opcoes, pede_visto").eq("escola_id", escolaId),
    supabase
      .from("agenda_dias")
      .select(
        "id, crianca_id, status, faltou, finalizado_por, finalizado_em, " +
          "agenda_registros(id, campo_id, valor, registrado_por, registrado_em, atualizado_por, atualizado_em, agenda_vistos(user_id)), " +
          "agenda_leituras(user_id, lido_em)",
      )
      .eq("escola_id", escolaId)
      .eq("data", data),
    supabase.from("turma_dias").select("turma_id, autor, atualizado_em, mural").eq("escola_id", escolaId).eq("data", data),
    supabase.from("membros").select("user_id").eq("escola_id", escolaId).eq("papel", "professora").eq("ativo", true),
    supabase.from("responsaveis_criancas").select("crianca_id, user_id").eq("escola_id", escolaId),
  ]);
  for (const r of [turmasR, criancasR, camposR, diasR]) if (r.error) throw r.error;

  type Dia = {
    id: string;
    crianca_id: string;
    status: "rascunho" | "finalizado";
    faltou: boolean;
    finalizado_por: string | null;
    finalizado_em: string | null;
    agenda_registros: {
      id: string;
      campo_id: string;
      valor: unknown;
      registrado_por: string | null;
      registrado_em: string;
      atualizado_por: string | null;
      atualizado_em: string | null;
      agenda_vistos: { user_id: string }[];
    }[];
    agenda_leituras: { user_id: string; lido_em: string }[];
  };
  const dias = new Map(((diasR.data ?? []) as unknown as Dia[]).map((d) => [d.crianca_id, d]));
  const campos = new Map((camposR.data ?? []).map((c) => [c.id, c]));
  const turmas = turmasR.data ?? [];
  const nomeTurma = new Map(turmas.map((t) => [t.id, t.nome]));
  const criancas = (criancasR.data ?? []).filter((c) => c.turma_id && nomeTurma.has(c.turma_id));
  const responsaveis = new Map<string, string[]>();
  for (const r of rcR.data ?? []) responsaveis.set(r.crianca_id, [...(responsaveis.get(r.crianca_id) ?? []), r.user_id]);
  const visivelAntes = escolaR.data?.agenda_visivel_antes_finalizar ?? true;

  // ---- turmas
  const turmasPainel: TurmaPainel[] = turmas.map((t) => {
    const daTurma = criancas.filter((c) => c.turma_id === t.id);
    const ds = daTurma.map((c) => dias.get(c.id));
    const finalizacoes = ds.filter((d) => d?.status === "finalizado" && d.finalizado_em).sort((a, b) => b!.finalizado_em!.localeCompare(a!.finalizado_em!));
    const finalizadas = ds.filter((d) => d?.status === "finalizado").length;
    return {
      id: t.id,
      nome: t.nome,
      total: daTurma.length,
      finalizadas,
      faltas: ds.filter((d) => d?.faltou).length,
      pendentes: ds.filter((d) => !d || (!d.faltou && d.status !== "finalizado" && d.agenda_registros.length === 0)).length,
      finalizadaEm: finalizacoes[0]?.finalizado_em ?? null,
      finalizadaPor: finalizacoes[0]?.finalizado_por ?? null,
      finalizada: daTurma.length > 0 && finalizadas === daTurma.length,
    };
  });

  // ---- eventos (atividade da equipe)
  const eventos: Evento[] = [];
  for (const c of criancas) {
    const d = dias.get(c.id);
    if (!d) continue;
    for (const r of d.agenda_registros) {
      const campo = campos.get(r.campo_id);
      if (!campo) continue;
      const texto = `${campo.rotulo}: ${textoDoValor(campo.tipo, campo.opcoes, r.valor)}`;
      // Sem histórico de valores: o registro original não mostra o valor atual (seria enganoso).
      const original = r.atualizado_em ? `${campo.rotulo} (valor editado depois)` : texto;
      eventos.push({ quando: r.registrado_em, quem: r.registrado_por, tipo: "registro", crianca: c.nome, criancaId: c.id, turmaId: c.turma_id!, texto: original });
      if (r.atualizado_em && r.atualizado_por) {
        eventos.push({ quando: r.atualizado_em, quem: r.atualizado_por, tipo: "edicao", crianca: c.nome, criancaId: c.id, turmaId: c.turma_id!, texto: `editou ${texto}` });
      }
    }
    if (d.status === "finalizado" && d.finalizado_em) {
      eventos.push({ quando: d.finalizado_em, quem: d.finalizado_por, tipo: "finalizacao", crianca: c.nome, criancaId: c.id, turmaId: c.turma_id!, texto: d.faltou ? "finalizou o dia (falta)" : "finalizou o dia" });
    }
  }
  for (const m of muraisR.data ?? []) {
    if (m.mural) eventos.push({ quando: m.atualizado_em, quem: m.autor, tipo: "mural", crianca: null, criancaId: null, turmaId: m.turma_id, texto: `mural da ${nomeTurma.get(m.turma_id) ?? "turma"}` });
  }
  eventos.sort((a, b) => b.quando.localeCompare(a.quando));

  // ---- faltas
  const faltas = criancas
    .filter((c) => dias.get(c.id)?.faltou)
    .map((c) => ({ criancaId: c.id, crianca: c.nome, turma: nomeTurma.get(c.turma_id!)!, turmaId: c.turma_id! }));

  // ---- leituras dos pais
  const familias: FamiliaPainel[] = criancas.map((c) => {
    const d = dias.get(c.id);
    const resp = responsaveis.get(c.id) ?? [];
    const leitura = d?.agenda_leituras.filter((l) => resp.includes(l.user_id)).sort((a, b) => a.lido_em.localeCompare(b.lido_em))[0];
    const trazer = d?.agenda_registros.find((r) => campos.get(r.campo_id)?.pede_visto);
    const situacao: FamiliaPainel["situacao"] = !resp.length
      ? "sem_responsavel"
      : !d
        ? "sem_registro"
        : !(d.status === "finalizado" || visivelAntes)
          ? "nao_liberado"
          : leitura
            ? "lido"
            : "nao_lido";
    return {
      criancaId: c.id,
      crianca: c.nome,
      turma: nomeTurma.get(c.turma_id!)!,
      turmaId: c.turma_id!,
      situacao,
      lidoEm: leitura?.lido_em ?? null,
      lidoPor: leitura?.user_id ?? null,
      vistoTrazer: trazer ? trazer.agenda_vistos.some((v) => resp.includes(v.user_id)) : null,
    };
  });

  // ---- nomes (equipe e responsáveis que leram)
  const ids = new Set<string>([
    ...eventos.map((e) => e.quem),
    ...turmasPainel.map((t) => t.finalizadaPor),
    ...familias.map((f) => f.lidoPor),
    ...(profsR.data ?? []).map((p) => p.user_id),
  ].filter((x): x is string => !!x));
  const { data: perfis } = ids.size ? await supabase.from("perfis").select("user_id, nome").in("user_id", [...ids]) : { data: [] };
  const nomes = Object.fromEntries((perfis ?? []).map((p) => [p.user_id, p.nome]));

  const professoras = (profsR.data ?? [])
    .map((p) => {
      const meus = eventos.filter((e) => e.quem === p.user_id && e.tipo === "registro");
      return { id: p.user_id, nome: nomes[p.user_id] ?? "Sem nome", registros: meus.length, ultimo: meus[0]?.quando ?? null };
    })
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")); // ordem alfabética, nunca ranking

  return { data, turmas: turmasPainel, eventos, faltas, familias, nomes, professoras };
}
