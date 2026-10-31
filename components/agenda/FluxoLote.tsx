"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronLeft, Users } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { classesBotao } from "@/components/ui/Botao";
import { componentesDoTipo, REGISTRO_IMEDIATO } from "@/components/agenda/campos";
import { textoDoValor } from "@/lib/agenda/exibir";
import type { CampoDia } from "@/lib/agenda/modelo";
import { useAgenda } from "./AgendaProvider";

const VISIVEIS = 5; // UX.md, Hick: no máximo 5 opções visíveis

/**
 * Registro em lote: campo → valor → quem (todos por padrão) → registrar.
 * Meta UX.md: turma toda em ≤ 4 toques.
 */
export function FluxoLote() {
  const { estado, acoes, base: voltarLista } = useAgenda();
  const router = useRouter();
  const [campo, setCampo] = useState<CampoDia | null>(null);
  const [valor, setValor] = useState<unknown>(null);
  const [verTodos, setVerTodos] = useState(false);
  const [desmarcadas, setDesmarcadas] = useState<string[]>([]);

  // Campos que ainda faltam para alguém vêm primeiro (o próximo da rotina).
  const campos = useMemo(() => {
    const presentes = estado.criancas.filter((c) => !estado.dias[c.id]?.faltou && estado.dias[c.id]?.status !== "finalizado");
    const falta = (cp: CampoDia) =>
      cp.multiplo || presentes.some((c) => !estado.registros.some((r) => r.criancaId === c.id && r.campoId === cp.id));
    const usaveis = estado.campos.filter((c) => c.tipo !== "texto"); // recado é individual
    return [...usaveis.filter(falta), ...usaveis.filter((c) => !falta(c))];
  }, [estado]);

  // Quem recebe: presentes, não finalizados e (campo de valor único) sem valor ainda.
  const elegiveis = useMemo(() => {
    if (!campo) return [];
    return estado.criancas.map((c) => {
      const d = estado.dias[c.id];
      const motivo = d?.faltou
        ? "faltou"
        : d?.status === "finalizado"
          ? "finalizado"
          : !campo.multiplo && estado.registros.some((r) => r.criancaId === c.id && r.campoId === campo.id)
            ? "já registrado"
            : null;
      return { crianca: c, motivo };
    });
  }, [campo, estado]);
  const escolhidas = elegiveis.filter((e) => !e.motivo && !desmarcadas.includes(e.crianca.id));

  if (!campo) {
    const lista = verTodos ? campos : campos.slice(0, VISIVEIS);
    return (
      <>
        <Cabecalho titulo="Registrar para a turma" voltar={voltarLista} />
        <p className="font-bold">O que você quer registrar?</p>
        <ul className="grid grid-cols-2 gap-2">
          {lista.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setCampo(c)}
                className="flex min-h-16 w-full items-center justify-center rounded-tc border-2 border-neutra px-3 text-center font-bold active:bg-superficie"
              >
                {c.rotulo}
              </button>
            </li>
          ))}
        </ul>
        {campos.length > VISIVEIS ? (
          <button type="button" onClick={() => setVerTodos(!verTodos)} className="min-h-12 self-center font-bold underline underline-offset-4">
            {verTodos ? "Ver menos" : `Ver todos os campos (${campos.length})`}
          </button>
        ) : null}
      </>
    );
  }

  const { Entrada } = componentesDoTipo(campo.tipo);
  if (valor === null) {
    return (
      <>
        <Cabecalho titulo={campo.rotulo} voltarAcao={() => setCampo(null)} />
        <p className="font-bold">Para a turma toda:</p>
        <Entrada campo={campo} onRegistrar={(v) => setValor(v)} />
        {REGISTRO_IMEDIATO.includes(campo.tipo) ? null : (
          <p className="text-sm text-texto-2">Depois você escolhe quem fica de fora.</p>
        )}
      </>
    );
  }

  return (
    <>
      <Cabecalho titulo={campo.rotulo} voltarAcao={() => setValor(null)} />
      <p className="text-lg">
        <strong>{textoDoValor(campo.tipo, campo.opcoes, valor)}</strong> para:
      </p>
      <ul className="flex flex-col gap-2">
        {elegiveis.map(({ crianca, motivo }) => {
          const marcada = !motivo && !desmarcadas.includes(crianca.id);
          return (
            <li key={crianca.id}>
              <label className={`flex min-h-14 items-center gap-3 rounded-tc border-2 px-3 ${marcada ? "border-primaria" : "border-neutra"} ${motivo ? "opacity-60" : "cursor-pointer"}`}>
                <input
                  type="checkbox"
                  checked={marcada}
                  disabled={!!motivo}
                  onChange={() =>
                    setDesmarcadas(desmarcadas.includes(crianca.id) ? desmarcadas.filter((d) => d !== crianca.id) : [...desmarcadas, crianca.id])
                  }
                  className="size-5 accent-[var(--escola-primaria)]"
                />
                <Avatar nome={crianca.nome} url={crianca.fotoUrl} tamanho={36} />
                <span className="flex-1 font-semibold">{crianca.nome}</span>
                {motivo ? <span className="text-sm text-texto-2">{motivo}</span> : null}
              </label>
            </li>
          );
        })}
      </ul>
      <div className="sticky bottom-20 mt-auto bg-fundo pt-2">
        <button
          type="button"
          disabled={escolhidas.length === 0}
          onClick={() => {
            const fora = estado.criancas.map((c) => c.id).filter((id) => !escolhidas.some((e) => e.crianca.id === id));
            acoes.lote(campo, valor, fora);
            router.push(voltarLista);
          }}
          className={classesBotao("primaria")}
        >
          <Users className="size-5" aria-hidden />
          Registrar para {escolhidas.length} {escolhidas.length === 1 ? "criança" : "crianças"}
        </button>
      </div>
    </>
  );
}

function Cabecalho({ titulo, voltar, voltarAcao }: { titulo: string; voltar?: string; voltarAcao?: () => void }) {
  const icone = <ChevronLeft className="size-7" aria-hidden />;
  const classe = "-ml-3 flex size-12 shrink-0 items-center justify-center rounded-full";
  return (
    <div className="flex items-center gap-1">
      {voltar ? (
        <Link href={voltar} aria-label="Voltar" className={classe}>
          {icone}
        </Link>
      ) : (
        <button type="button" onClick={voltarAcao} aria-label="Voltar" className={classe}>
          {icone}
        </button>
      )}
      <h1 className="text-2xl font-semibold leading-tight">{titulo}</h1>
    </div>
  );
}
