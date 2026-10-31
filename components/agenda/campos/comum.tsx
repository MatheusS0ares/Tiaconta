"use client";

import { useState, type ReactNode } from "react";
import { normalizarHora } from "@/lib/agenda/hora";
import { horaAgora } from "@/lib/agenda/data";

const chipBase =
  "flex min-h-12 items-center justify-center rounded-full border-2 px-4 font-semibold transition-colors duration-150 disabled:opacity-50 active:scale-[0.97]";

/** Chip tocável. `marcado` usa a cor da ação principal da escola. */
export function Chip({
  marcado,
  children,
  onClick,
  desabilitado,
  rotuloAcessivel,
}: {
  marcado?: boolean;
  children: ReactNode;
  onClick: () => void;
  desabilitado?: boolean;
  rotuloAcessivel?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={marcado}
      aria-label={rotuloAcessivel}
      disabled={desabilitado}
      onClick={onClick}
      className={`${chipBase} ${marcado ? "border-primaria bg-primaria text-primaria-texto" : "border-neutra bg-fundo text-texto"}`}
    >
      {children}
    </button>
  );
}

export function GrupoChips({ children, rotulo }: { children: ReactNode; rotulo: string }) {
  return (
    <div role="group" aria-label={rotulo} className="flex flex-wrap gap-2">
      {children}
    </div>
  );
}

/** Campo de hora tolerante (Postel): aceita "9h30", mostra "09:30" ao sair. Começa com a hora atual. */
export function useHora(inicial?: string | null) {
  const [texto, setTexto] = useState(inicial ?? horaAgora());
  return { texto, setTexto, valida: normalizarHora(texto) };
}

export function CampoHora({
  rotulo,
  hora,
  id,
  opcional,
}: {
  rotulo: string;
  hora: ReturnType<typeof useHora>;
  id: string;
  opcional?: boolean;
}) {
  const invalida = hora.texto.trim() !== "" && !hora.valida;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-bold">
        {rotulo}
      </label>
      <input
        id={id}
        value={hora.texto}
        onChange={(e) => hora.setTexto(e.target.value)}
        onBlur={() => hora.valida && hora.setTexto(hora.valida)}
        inputMode="text"
        autoComplete="off"
        placeholder={opcional ? "—" : "09:00"}
        aria-invalid={invalida || undefined}
        className={`min-h-12 w-28 rounded-tc border-2 bg-fundo px-3 text-center text-lg tabular-nums focus:outline-none ${invalida ? "border-alerta" : "border-neutra focus:border-texto"}`}
      />
    </div>
  );
}

export function BotaoRegistrar({ children = "Registrar", onClick, desabilitado }: { children?: ReactNode; onClick: () => void; desabilitado?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desabilitado}
      className="min-h-12 flex-1 rounded-tc bg-primaria px-5 font-bold text-primaria-texto disabled:opacity-50 active:scale-[0.98]"
    >
      {children}
    </button>
  );
}

export function ErroCampo({ erro }: { erro?: string | null }) {
  return erro ? (
    <p role="alert" className="text-sm font-semibold text-alerta">
      {erro}
    </p>
  ) : null;
}

export function CampoObs({ valor, onChange, id }: { valor: string; onChange: (v: string) => void; id: string }) {
  const [aberto, setAberto] = useState(valor !== "");
  if (!aberto) {
    return (
      <button type="button" onClick={() => setAberto(true)} className="min-h-12 self-start text-sm font-bold underline underline-offset-4">
        + Observação
      </button>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-bold">
        Observação
      </label>
      <input
        id={id}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        maxLength={500}
        className="min-h-12 rounded-tc border-2 border-neutra bg-fundo px-3 text-base focus:border-texto focus:outline-none"
      />
    </div>
  );
}
