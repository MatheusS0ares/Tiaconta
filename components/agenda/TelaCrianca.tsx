"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, CircleCheck, Info, Plus, Trash2, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { classesBotao } from "@/components/ui/Botao";
import { componentesDoTipo } from "@/components/agenda/campos";
import { horaDe } from "@/lib/agenda/data";
import { diaEditavel, statusDa, type CampoDia } from "@/lib/agenda/modelo";
import { useAgenda } from "./AgendaProvider";
import { StatusCrianca } from "./StatusCrianca";

/** Entradas que aparecem já abertas: um toque registra (UX.md: ≤ 2 toques). */
const SEMPRE_ABERTA = new Set(["opcao", "sim_nao", "evento"]);

export function TelaCrianca({ slug, criancaId }: { slug: string; criancaId: string }) {
  const { estado, acoes } = useAgenda();
  const [confirmarFinalizar, setConfirmarFinalizar] = useState(false);
  const crianca = estado.criancas.find((c) => c.id === criancaId);
  if (!crianca) notFound();

  const voltar = `/${slug}/professora/turma/${estado.turma.id}`;
  const status = statusDa(estado, crianca.id);
  const dia = estado.dias[crianca.id];
  const editavel = diaEditavel(estado, crianca.id);
  const faltou = !!dia?.faltou;
  const primeiroNome = crianca.nome.split(" ")[0];

  return (
    <>
      <div className="flex items-center gap-2">
        <Link href={voltar} aria-label="Voltar para a turma" className="-ml-3 flex size-12 shrink-0 items-center justify-center rounded-full">
          <ChevronLeft className="size-7" aria-hidden />
        </Link>
        <Avatar nome={crianca.nome} url={crianca.fotoUrl} tamanho={48} />
        <div className="flex-1">
          <h1 className="text-xl font-semibold leading-tight">{crianca.nome}</h1>
          <StatusCrianca status={status} />
        </div>
      </div>

      {crianca.restricoes || crianca.saude ? (
        <div className="flex gap-3 rounded-tc bg-superficie p-3 text-sm">
          <Info className="size-5 shrink-0" aria-hidden />
          <div>
            {crianca.restricoes ? <p><strong>Alimentação:</strong> {crianca.restricoes}</p> : null}
            {crianca.saude ? <p><strong>Saúde:</strong> {crianca.saude}</p> : null}
          </div>
        </div>
      ) : null}

      {status === "finalizado" ? (
        <p role="status" className="flex items-center gap-2 rounded-tc border-2 border-sucesso p-3 font-semibold text-sucesso">
          <CircleCheck className="size-5 shrink-0" aria-hidden />
          Finalizado{dia?.finalizadoEm ? ` às ${horaDe(dia.finalizadoEm)}` : ""}
          {dia?.finalizadoPor && estado.nomes[dia.finalizadoPor] ? ` por ${estado.nomes[dia.finalizadoPor]}` : ""}.
        </p>
      ) : null}

      {editavel ? (
        <label className="flex min-h-14 cursor-pointer items-center gap-4 rounded-tc border-2 border-neutra px-4">
          <span className="flex-1 font-bold">Faltou hoje</span>
          <input type="checkbox" role="switch" checked={faltou} onChange={(e) => acoes.falta(crianca.id, e.target.checked)} className="peer sr-only" />
          <span
            aria-hidden
            className="relative h-8 w-14 shrink-0 rounded-full bg-neutra transition-colors duration-150 after:absolute after:left-1 after:top-1 after:size-6 after:rounded-full after:bg-fundo after:shadow after:transition-transform after:duration-150 peer-checked:bg-texto peer-checked:after:translate-x-6 peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-texto"
          />
        </label>
      ) : null}

      {faltou ? (
        <p className="text-texto-2">{primeiroNome} faltou. Desligue &quot;Faltou hoje&quot; se chegou mais tarde.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {estado.campos.map((campo) => (
            <CartaoCampo key={campo.id} campo={campo} criancaId={crianca.id} editavel={editavel} />
          ))}
        </ul>
      )}

      {editavel && status !== "finalizado" ? (
        <div className="sticky bottom-20 mt-auto bg-fundo pt-2">
          {confirmarFinalizar ? (
            <div className="flex gap-3">
              <button type="button" onClick={() => setConfirmarFinalizar(false)} className={classesBotao("secundaria", true, "flex-1")}>
                Voltar
              </button>
              <Link
                href={voltar}
                onClick={() => acoes.finalizar(crianca.id)}
                className={classesBotao("primaria", true, "flex-1")}
              >
                Confirmar
              </Link>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmarFinalizar(true)} className={classesBotao(status === "pendente" ? "secundaria" : "primaria")}>
              <CircleCheck className="size-5" aria-hidden />
              Finalizar dia de {primeiroNome}
            </button>
          )}
        </div>
      ) : null}
    </>
  );
}

function CartaoCampo({ campo, criancaId, editavel }: { campo: CampoDia; criancaId: string; editavel: boolean }) {
  const { estado, acoes } = useAgenda();
  const { Entrada, Exibicao } = componentesDoTipo(campo.tipo);
  const registros = estado.registros.filter((r) => r.criancaId === criancaId && r.campoId === campo.id);
  const [aberto, setAberto] = useState(false);

  // Campo de valor único: a entrada edita o registro existente.
  // Sono (intervalo) aberto: a entrada oferece "Acordou agora" para ele.
  const atual = campo.multiplo
    ? campo.tipo === "intervalo"
      ? [...registros].reverse().find((r) => (r.valor as { fim?: string | null })?.fim == null) ?? null
      : null
    : (registros[0] ?? null);
  const listar = campo.multiplo || !SEMPRE_ABERTA.has(campo.tipo);
  // Registro em aberto num campo múltiplo (ex.: sono sem fim) mantém a entrada visível.
  const mostrarEntrada = editavel && (SEMPRE_ABERTA.has(campo.tipo) || aberto || (campo.multiplo && atual !== null));

  return (
    <li className="flex flex-col gap-3 rounded-tc border border-neutra p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{campo.rotulo}</h2>
        {editavel && !SEMPRE_ABERTA.has(campo.tipo) ? (
          <button
            type="button"
            onClick={() => setAberto(!aberto)}
            aria-expanded={aberto}
            className="flex min-h-12 items-center gap-1 rounded-tc px-2 font-bold"
          >
            {aberto ? <X className="size-5" aria-hidden /> : <Plus className="size-5" aria-hidden />}
            {aberto ? "Fechar" : registros.length && !campo.multiplo ? "Editar" : "Registrar"}
          </button>
        ) : null}
      </div>

      {listar && registros.length ? (
        <ul className="flex flex-col gap-1">
          {registros.map((r) => (
            <li key={r.id} className="flex items-center gap-2">
              <Exibicao campo={campo} valor={r.valor} className="flex-1" />
              <span className="text-xs text-texto-2">
                {r.pendente ? "enviando…" : estado.nomes[r.registradoPor ?? ""] ?? ""}
              </span>
              {editavel && campo.multiplo ? (
                <button
                  type="button"
                  aria-label={`Apagar registro de ${campo.rotulo}`}
                  onClick={() => acoes.remover(r.id)}
                  className="flex size-12 items-center justify-center rounded-full text-texto-2"
                >
                  <Trash2 className="size-5" aria-hidden />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : !editavel && registros.length === 0 ? (
        <p className="text-sm text-texto-2">Sem registro.</p>
      ) : null}

      {!editavel && !listar && registros[0] ? <Exibicao campo={campo} valor={registros[0].valor} /> : null}

      {mostrarEntrada ? (
        <Entrada
          key={atual?.id ?? "novo"}
          campo={campo}
          atual={atual}
          onRegistrar={(valor, idExistente) => {
            acoes.registrar(criancaId, campo, valor, idExistente);
            if (!SEMPRE_ABERTA.has(campo.tipo)) setAberto(false);
          }}
        />
      ) : null}
    </li>
  );
}
