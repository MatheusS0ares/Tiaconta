import { Esqueleto, EsqueletoLista } from "./Esqueleto";

/** Skeleton dentro da área de um papel (a barra inferior continua visível). */
export function CarregandoArea() {
  return (
    <>
      <Esqueleto className="h-8 w-1/2" />
      <EsqueletoLista />
    </>
  );
}
