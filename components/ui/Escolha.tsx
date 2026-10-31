import type { ReactNode } from "react";

/**
 * Escolha única em chips (UX.md: opções como botões, nunca dropdown).
 * Radios nativos estilizados: funcionam sem JS e com leitor de tela.
 */
export function Escolha({
  legenda,
  name,
  opcoes,
  padrao,
  obrigatorio,
  multipla,
  padroes,
  erro,
}: {
  legenda: ReactNode;
  name: string;
  opcoes: { valor: string; rotulo: string }[];
  padrao?: string;
  obrigatorio?: boolean;
  /** várias opções (checkbox) em vez de uma (radio) */
  multipla?: boolean;
  padroes?: string[];
  erro?: string;
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 font-bold">{legenda}</legend>
      <div className="flex flex-wrap gap-2">
        {opcoes.map((o) => (
          <label
            key={o.valor}
            className={
              "flex min-h-12 cursor-pointer items-center rounded-full border-2 border-neutra px-4 font-semibold " +
              "has-[:checked]:border-primaria has-[:checked]:bg-primaria has-[:checked]:text-primaria-texto " +
              "has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-texto"
            }
          >
            <input
              type={multipla ? "checkbox" : "radio"}
              name={name}
              value={o.valor}
              defaultChecked={multipla ? padroes?.includes(o.valor) : padrao === o.valor}
              required={!multipla && obrigatorio}
              className="sr-only"
            />
            {o.rotulo}
          </label>
        ))}
      </div>
      {erro ? <p className="text-sm font-semibold text-alerta">{erro}</p> : null}
    </fieldset>
  );
}
