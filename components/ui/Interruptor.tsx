import type { ComponentProps, ReactNode } from "react";

/**
 * Liga/desliga com rótulo (checkbox nativo com role=switch).
 * A linha inteira é o alvo de toque (≥ 48px).
 */
export function Interruptor({
  rotulo,
  descricao,
  className = "",
  ...props
}: Omit<ComponentProps<"input">, "type"> & { rotulo: ReactNode; descricao?: ReactNode }) {
  return (
    <label className={`flex min-h-14 cursor-pointer items-center gap-4 ${className}`}>
      <span className="flex-1">
        <span className="block font-bold">{rotulo}</span>
        {descricao ? <span className="block text-sm text-texto-2">{descricao}</span> : null}
      </span>
      <input type="checkbox" role="switch" className="peer sr-only" {...props} />
      <span
        aria-hidden
        className={
          "relative h-8 w-14 shrink-0 rounded-full bg-neutra transition-colors duration-150 " +
          "after:absolute after:left-1 after:top-1 after:size-6 after:rounded-full after:bg-fundo after:shadow after:transition-transform after:duration-150 " +
          "peer-checked:bg-texto peer-checked:after:translate-x-6 " +
          "peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-texto"
        }
      />
    </label>
  );
}
