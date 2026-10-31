import type { ComponentProps } from "react";

type Props = ComponentProps<"input"> & { rotulo: string; erro?: string; dica?: string };

/** Input com rótulo visível. text-base (16px) evita zoom automático no iOS. */
export function Campo({ rotulo, erro, dica, id, name, className = "", ...props }: Props) {
  const idCampo = id ?? name;
  const idAjuda = erro || dica ? `${idCampo}-ajuda` : undefined;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={idCampo} className="font-bold">
        {rotulo}
      </label>
      <input
        id={idCampo}
        name={name}
        aria-invalid={erro ? true : undefined}
        aria-describedby={idAjuda}
        className={
          "min-h-12 w-full rounded-tc border-2 bg-fundo px-4 text-base text-texto " +
          "placeholder:text-texto-2 focus:border-texto focus:outline-none " +
          (erro ? "border-alerta " : "border-neutra ") +
          className
        }
        {...props}
      />
      {erro ? (
        <p id={idAjuda} className="text-sm font-semibold text-alerta">
          {erro}
        </p>
      ) : dica ? (
        <p id={idAjuda} className="text-sm text-texto-2">
          {dica}
        </p>
      ) : null}
    </div>
  );
}
