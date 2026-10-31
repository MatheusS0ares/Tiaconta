"use client";

import { useState } from "react";
import { classesBotao } from "@/components/ui/Botao";
import { horaDe } from "@/lib/agenda/data";
import { useAgenda } from "./AgendaProvider";

/** Mural da turma: igual para todas as famílias (o recado individual fica na criança). */
export function Mural() {
  const { estado, acoes } = useAgenda();
  const [texto, setTexto] = useState(estado.mural.texto);
  const mudou = texto.trim() !== estado.mural.texto.trim();
  const autor = estado.mural.autor ? estado.nomes[estado.mural.autor] : null;

  return (
    <form
      className="flex flex-1 flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        acoes.salvarMural(texto);
      }}
    >
      <label htmlFor="mural" className="font-bold">
        O que a turma fez hoje
      </label>
      <textarea
        id="mural"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={8}
        maxLength={4000}
        placeholder="Ex.: Hoje fizemos pintura com as mãos e brincamos no parquinho."
        className="w-full rounded-tc border-2 border-neutra bg-fundo px-4 py-3 text-base focus:border-texto focus:outline-none"
      />
      <p className="text-sm text-texto-2">
        Todas as famílias da turma veem este texto. Recado só para uma família: abra a criança.
        {estado.mural.atualizadoEm ? ` Atualizado às ${horaDe(estado.mural.atualizadoEm)}${autor ? ` por ${autor}` : ""}.` : ""}
      </p>
      <div className="sticky bottom-20 mt-auto bg-fundo pt-2">
        <button type="submit" disabled={!mudou} className={classesBotao("primaria")}>
          Salvar mural
        </button>
      </div>
    </form>
  );
}
