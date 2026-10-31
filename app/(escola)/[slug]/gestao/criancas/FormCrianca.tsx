"use client";

import { useActionState } from "react";
import { Campo } from "@/components/ui/Campo";
import { AreaTexto } from "@/components/ui/AreaTexto";
import { Escolha } from "@/components/ui/Escolha";
import { Interruptor } from "@/components/ui/Interruptor";
import { BotaoEnviar } from "@/components/ui/BotaoEnviar";
import { Aviso } from "@/components/ui/Aviso";
import { salvarCrianca, type EstadoForm } from "./actions";

type Crianca = {
  id: string;
  nome: string;
  data_nascimento: string | null;
  turma_id: string | null;
  autoriza_imagem: boolean;
  restricoes_alimentares: string | null;
  observacoes_saude: string | null;
};

export function FormCrianca({
  slug,
  crianca,
  turmas,
  turmaPadrao,
}: {
  slug: string;
  crianca?: Crianca;
  turmas: { id: string; nome: string }[];
  turmaPadrao?: string;
}) {
  const [estado, acao] = useActionState<EstadoForm, FormData>(salvarCrianca.bind(null, slug, crianca?.id ?? null), {});
  const erros = estado.erros ?? {};
  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <form action={acao} className="flex flex-col gap-6">
      <Campo rotulo="Nome" name="nome" defaultValue={crianca?.nome} autoComplete="off" required erro={erros.nome} />
      <Campo
        rotulo="Data de nascimento"
        name="data_nascimento"
        type="date"
        max={hoje}
        defaultValue={crianca?.data_nascimento ?? ""}
        erro={erros.data_nascimento}
      />
      <Escolha
        legenda="Turma"
        name="turma_id"
        opcoes={turmas.map((t) => ({ valor: t.id, rotulo: t.nome }))}
        padrao={crianca?.turma_id ?? turmaPadrao}
        obrigatorio
        erro={erros.turma_id}
      />
      <div className="rounded-tc border-2 border-neutra px-4">
        <Interruptor
          name="autoriza_imagem"
          defaultChecked={crianca?.autoriza_imagem ?? false}
          rotulo="Autoriza uso de imagem"
          descricao="A família autorizou a criança aparecer em fotos da turma."
        />
      </div>
      <AreaTexto
        rotulo="Restrições alimentares"
        name="restricoes_alimentares"
        defaultValue={crianca?.restricoes_alimentares ?? ""}
        placeholder="Ex.: sem lactose"
        erro={erros.restricoes_alimentares}
      />
      <AreaTexto
        rotulo="Saúde (alergias, medicação contínua)"
        name="observacoes_saude"
        defaultValue={crianca?.observacoes_saude ?? ""}
        erro={erros.observacoes_saude}
      />
      {estado.erro ? <Aviso tipo="erro">{estado.erro}</Aviso> : null}
      {estado.ok ? <Aviso tipo="sucesso">Dados salvos.</Aviso> : null}
      <div className="sticky bottom-20 bg-fundo pt-2">
        <BotaoEnviar textoEnviando="Salvando…">{crianca ? "Salvar" : "Cadastrar criança"}</BotaoEnviar>
      </div>
    </form>
  );
}
