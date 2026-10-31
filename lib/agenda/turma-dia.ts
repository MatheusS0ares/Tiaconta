import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { urlsAssinadas } from "@/lib/fotos";
import type { TurmaDia } from "./modelo";

/**
 * Carrega o dia de uma turma (RLS vale). Retorna null se a turma não existir
 * para o usuário ou se ele não puder registrar nela.
 */
export async function carregarTurmaDia(
  supabase: SupabaseClient<Database>,
  o: { escolaId: string; turmaId: string; data: string; usuarioId: string; eGestor: boolean },
): Promise<TurmaDia | null> {
  const [turmaR, podeR] = await Promise.all([
    supabase.from("turmas").select("id, nome, faixa").eq("id", o.turmaId).eq("escola_id", o.escolaId).eq("ativa", true).maybeSingle(),
    supabase.rpc("fn_pode_registrar_turma", { p_turma: o.turmaId }),
  ]);
  const turma = turmaR.data;
  if (!turma || !podeR.data) return null;

  const [criancasR, camposR, muralR] = await Promise.all([
    supabase
      .from("criancas")
      .select("id, nome, foto_path, restricoes_alimentares, observacoes_saude")
      .eq("turma_id", turma.id)
      .eq("ativa", true)
      .order("nome"),
    supabase
      .from("agenda_campos")
      .select("id, rotulo, tipo, opcoes, multiplo, faixas")
      .eq("escola_id", o.escolaId)
      .eq("ativo", true)
      .order("ordem")
      .order("rotulo"),
    supabase.from("turma_dias").select("mural, autor, atualizado_em").eq("turma_id", turma.id).eq("data", o.data).maybeSingle(),
  ]);
  if (criancasR.error) throw criancasR.error;
  if (camposR.error) throw camposR.error;
  const criancas = criancasR.data;
  const ids = criancas.map((c) => c.id);

  const [diasR, fotos] = await Promise.all([
    ids.length
      ? supabase
          .from("agenda_dias")
          .select("id, crianca_id, status, faltou, finalizado_por, finalizado_em, agenda_registros(id, campo_id, valor, registrado_por, registrado_em, lote_id)")
          .in("crianca_id", ids)
          .eq("data", o.data)
      : Promise.resolve({ data: [], error: null }),
    urlsAssinadas(supabase, criancas.map((c) => c.foto_path)),
  ]);
  if (diasR.error) throw diasR.error;

  const dias: TurmaDia["dias"] = {};
  const registros: TurmaDia["registros"] = [];
  for (const d of diasR.data ?? []) {
    dias[d.crianca_id] = { status: d.status, faltou: d.faltou, finalizadoPor: d.finalizado_por, finalizadoEm: d.finalizado_em };
    for (const r of d.agenda_registros) {
      registros.push({
        id: r.id,
        criancaId: d.crianca_id,
        campoId: r.campo_id,
        valor: r.valor,
        registradoPor: r.registrado_por,
        registradoEm: r.registrado_em,
        loteId: r.lote_id,
      });
    }
  }
  registros.sort((a, b) => a.registradoEm.localeCompare(b.registradoEm));

  const autores = new Set<string>([
    ...registros.map((r) => r.registradoPor),
    ...Object.values(dias).map((d) => d.finalizadoPor),
    muralR.data?.autor ?? null,
  ].filter((x): x is string => !!x));
  const { data: perfis } = autores.size
    ? await supabase.from("perfis").select("user_id, nome").in("user_id", [...autores])
    : { data: [] as { user_id: string; nome: string }[] };

  return {
    turma,
    data: o.data,
    usuarioId: o.usuarioId,
    eGestor: o.eGestor,
    criancas: criancas.map((c) => ({
      id: c.id,
      nome: c.nome,
      fotoUrl: c.foto_path ? (fotos.get(c.foto_path) ?? null) : null,
      restricoes: c.restricoes_alimentares,
      saude: c.observacoes_saude,
    })),
    campos: camposR.data
      .filter((c) => !c.faixas?.length || c.faixas.includes(turma.faixa))
      .map((c) => ({ id: c.id, rotulo: c.rotulo, tipo: c.tipo, opcoes: c.opcoes, multiplo: c.multiplo })),
    dias,
    registros,
    mural: { texto: muralR.data?.mural ?? "", autor: muralR.data?.autor ?? null, atualizadoEm: muralR.data?.atualizado_em ?? null },
    nomes: Object.fromEntries((perfis ?? []).map((p) => [p.user_id, p.nome.split(" ")[0]!])),
    versao: Date.now(),
  };
}
