import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { urlsAssinadas } from "@/lib/fotos";
import { textoDoValor } from "./exibir";
import { limitarDestaques, nivelExcecao, type NivelDestaque } from "./excecao";
import type { TipoCampo } from "./tipos";

export type Grupo = Database["public"]["Enums"]["grupo_campo"];

export type ItemResumo = {
  campoId: string;
  rotulo: string;
  tipo: TipoCampo;
  grupo: Grupo;
  ordem: number;
  textos: string[]; // um por registro (campos múltiplos têm vários)
  nivel: NivelDestaque | null;
  destacado: boolean;
  pedeVisto: boolean;
  registroId: string | null; // para o "Visto"
  visto: boolean;
};

export type Resumo = {
  crianca: { id: string; nome: string; fotoUrl: string | null; turma: string | null };
  data: string;
  dia: { id: string; status: "rascunho" | "finalizado"; faltou: boolean; finalizadoEm: string | null; finalizadoPor: string | null } | null;
  itens: ItemResumo[];
  mural: string | null;
};

/**
 * Resumo do dia da criança para o responsável. Tudo passa pelo RLS: se a escola
 * só mostra depois de finalizar, o dia em rascunho simplesmente não vem.
 */
export async function carregarResumo(
  supabase: SupabaseClient<Database>,
  o: { escolaId: string; criancaId: string; data: string; usuarioId: string },
): Promise<Resumo | null> {
  const { data: crianca } = await supabase
    .from("criancas")
    .select("id, nome, foto_path, turma_id, turmas(nome)")
    .eq("id", o.criancaId)
    .eq("escola_id", o.escolaId)
    .maybeSingle();
  if (!crianca) return null;

  const [diaR, camposR, muralR, fotos] = await Promise.all([
    supabase
      .from("agenda_dias")
      .select("id, status, faltou, finalizado_em, finalizado_por, agenda_registros(id, campo_id, valor, registrado_em, agenda_vistos(user_id))")
      .eq("crianca_id", crianca.id)
      .eq("data", o.data)
      .maybeSingle(),
    supabase
      .from("agenda_campos")
      .select("id, rotulo, tipo, opcoes, ordem, grupo, destaque, pede_visto, visivel_responsavel")
      .eq("escola_id", o.escolaId)
      .eq("visivel_responsavel", true),
    crianca.turma_id
      ? supabase.from("turma_dias").select("mural").eq("turma_id", crianca.turma_id).eq("data", o.data).maybeSingle()
      : Promise.resolve({ data: null }),
    urlsAssinadas(supabase, [crianca.foto_path]),
  ]);

  const dia = diaR.data;
  const campos = new Map((camposR.data ?? []).map((c) => [c.id, c]));
  const porCampo = new Map<string, NonNullable<typeof dia>["agenda_registros"]>();
  for (const r of [...(dia?.agenda_registros ?? [])].sort((a, b) => a.registrado_em.localeCompare(b.registrado_em))) {
    if (!campos.has(r.campo_id)) continue;
    porCampo.set(r.campo_id, [...(porCampo.get(r.campo_id) ?? []), r]);
  }

  const itens: ItemResumo[] = [...porCampo.entries()].map(([campoId, regs]) => {
    const c = campos.get(campoId)!;
    const niveis = regs.map((r) => nivelExcecao({ tipo: c.tipo, opcoes: c.opcoes, destaque: c.destaque }, r.valor));
    const ultimo = regs.at(-1)!;
    return {
      campoId,
      rotulo: c.rotulo,
      tipo: c.tipo,
      grupo: c.grupo,
      ordem: c.ordem,
      textos: regs.map((r) => textoDoValor(c.tipo, c.opcoes, r.valor)),
      nivel: niveis.includes("alerta") ? "alerta" : niveis.includes("atencao") ? "atencao" : null,
      destacado: false,
      pedeVisto: c.pede_visto,
      registroId: ultimo.id,
      visto: ultimo.agenda_vistos.some((v) => v.user_id === o.usuarioId),
    };
  });
  itens.sort((a, b) => a.ordem - b.ordem);
  const destaques = limitarDestaques(itens);
  for (const i of itens) i.destacado = destaques.has(i);

  return {
    crianca: {
      id: crianca.id,
      nome: crianca.nome,
      fotoUrl: crianca.foto_path ? (fotos.get(crianca.foto_path) ?? null) : null,
      turma: crianca.turmas?.nome ?? null,
    },
    data: o.data,
    dia: dia
      ? { id: dia.id, status: dia.status, faltou: dia.faltou, finalizadoEm: dia.finalizado_em, finalizadoPor: dia.finalizado_por }
      : null,
    itens,
    mural: muralR.data?.mural ?? null,
  };
}
