"use client";

import { useActionState, useState } from "react";
import { Plus, X } from "lucide-react";
import { Campo } from "@/components/ui/Campo";
import { Escolha } from "@/components/ui/Escolha";
import { Interruptor } from "@/components/ui/Interruptor";
import { BotaoEnviar } from "@/components/ui/BotaoEnviar";
import { Aviso } from "@/components/ui/Aviso";
import { FAIXAS, MAX_OPCOES, NOME_TIPO, TIPOS_COM_OPCOES, type TipoCampo } from "@/lib/agenda/tipos";
import { salvarCampo, type EstadoForm } from "../actions";

type Props = {
  slug: string;
  campo: {
    id: string;
    rotulo: string;
    tipo: TipoCampo;
    opcoes: string[];
    unidade: string;
    faixas: string[];
    visivel_responsavel: boolean;
    multiplo: boolean;
  };
};

export function FormCampo({ slug, campo }: Props) {
  const [estado, acao] = useActionState<EstadoForm, FormData>(salvarCampo.bind(null, slug, campo.id), {});
  const erros = estado.erros ?? {};
  const [opcoes, setOpcoes] = useState(campo.opcoes.length ? campo.opcoes : [""]);
  const max = MAX_OPCOES[campo.tipo] ?? 0;
  const temOpcoes = TIPOS_COM_OPCOES.includes(campo.tipo);

  return (
    <form action={acao} className="flex flex-col gap-6">
      <Campo rotulo="Nome do campo" name="rotulo" defaultValue={campo.rotulo} required erro={erros.rotulo} />
      <p className="-mt-3 text-sm text-texto-2">Tipo: {NOME_TIPO[campo.tipo]}</p>

      {temOpcoes ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-3 font-bold">
            Opções{" "}
            <span className="font-normal text-texto-2">
              ({opcoes.filter((o) => o.trim()).length} de {max})
            </span>
          </legend>
          {opcoes.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                name="opcoes"
                value={o}
                aria-label={`Opção ${i + 1}`}
                maxLength={30}
                onChange={(e) => setOpcoes(opcoes.map((x, k) => (k === i ? e.target.value : x)))}
                className="min-h-12 flex-1 rounded-tc border-2 border-neutra bg-fundo px-4 text-base focus:border-texto focus:outline-none"
              />
              <button
                type="button"
                aria-label={`Remover opção ${o || i + 1}`}
                onClick={() => setOpcoes(opcoes.length > 1 ? opcoes.filter((_, k) => k !== i) : [""])}
                className="flex size-12 shrink-0 items-center justify-center rounded-full text-texto-2 active:bg-superficie"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
          ))}
          {opcoes.length < max ? (
            <button
              type="button"
              onClick={() => setOpcoes([...opcoes, ""])}
              className="flex min-h-12 items-center gap-2 self-start font-bold underline underline-offset-4"
            >
              <Plus className="size-5" aria-hidden />
              Adicionar opção
            </button>
          ) : null}
          {erros.opcoes ? <p className="text-sm font-semibold text-alerta">{erros.opcoes}</p> : null}
        </fieldset>
      ) : null}

      {campo.tipo === "quantidade" ? (
        <Campo rotulo="Unidade" name="unidade" defaultValue={campo.unidade} placeholder="ml, °C, g…" maxLength={10} erro={erros.unidade} />
      ) : null}

      <Escolha
        legenda={
          <>
            Faixas etárias <span className="font-normal text-texto-2">(nenhuma marcada = todas)</span>
          </>
        }
        name="faixas"
        multipla
        opcoes={FAIXAS.map((f) => ({ valor: f.valor, rotulo: f.rotulo }))}
        padroes={campo.faixas}
      />

      <div className="divide-y divide-neutra rounded-tc border-2 border-neutra px-4">
        <Interruptor
          name="visivel_responsavel"
          defaultChecked={campo.visivel_responsavel}
          rotulo="A família vê este campo"
          descricao="Desligado: só a equipe da escola vê."
        />
        <Interruptor
          name="multiplo"
          defaultChecked={campo.multiplo}
          rotulo="Registrar várias vezes no dia"
          descricao="Ex.: trocas de fralda, mamadeiras."
        />
      </div>

      {estado.erro ? <Aviso tipo="erro">{estado.erro}</Aviso> : null}
      <div className="sticky bottom-20 bg-fundo pt-2">
        <BotaoEnviar textoEnviando="Salvando…">Salvar campo</BotaoEnviar>
      </div>
    </form>
  );
}
