"use client";

import { useActionState } from "react";
import { Campo } from "@/components/ui/Campo";
import { Escolha } from "@/components/ui/Escolha";
import { BotaoEnviar } from "@/components/ui/BotaoEnviar";
import { Aviso } from "@/components/ui/Aviso";
import { FAIXAS } from "@/lib/agenda/tipos";
import { salvarTurma, type EstadoForm } from "./actions";
import { useDestino } from "@/components/ui/useDestino";

type Props = {
  slug: string;
  turma?: { id: string; nome: string; faixa: string; professoras: string[] };
  professoras: { id: string; nome: string }[];
};

export function FormTurma({ slug, turma, professoras }: Props) {
  const [estado, acao] = useActionState<EstadoForm, FormData>(salvarTurma.bind(null, slug, turma?.id ?? null), {});
  const erros = estado.erros ?? {};
  const saindo = useDestino(estado.destino);
  return (
    <form action={acao} className="flex flex-col gap-6">
      <Campo rotulo="Nome da turma" name="nome" defaultValue={turma?.nome} placeholder="Ex.: Berçário I" required erro={erros.nome} />
      <Escolha
        legenda="Faixa etária"
        name="faixa"
        opcoes={FAIXAS.map((f) => ({ valor: f.valor, rotulo: f.rotulo }))}
        padrao={turma?.faixa}
        obrigatorio
        erro={erros.faixa}
      />
      {professoras.length ? (
        <Escolha
          legenda="Professoras da turma"
          name="professoras"
          multipla
          opcoes={professoras.map((p) => ({ valor: p.id, rotulo: p.nome }))}
          padroes={turma?.professoras}
        />
      ) : (
        <p className="text-texto-2">Nenhuma professora na equipe ainda. Convide em Mais → Equipe.</p>
      )}
      {estado.erro ? <Aviso tipo="erro">{estado.erro}</Aviso> : null}
      <div className="sticky bottom-20 bg-fundo pt-2">
        <BotaoEnviar textoEnviando="Salvando…" disabled={saindo}>
          {saindo ? "Salvo!" : turma ? "Salvar turma" : "Criar turma"}
        </BotaoEnviar>
      </div>
    </form>
  );
}
