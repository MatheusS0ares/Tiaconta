import { BarraInferior, type ItemBarra } from "./BarraInferior";

/** Conteúdo da área de um papel com espaço para a barra inferior fixa. */
export function AreaPapel({ itens, children }: { itens: ItemBarra[]; children: React.ReactNode }) {
  return (
    <>
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 pb-28 pt-6">{children}</main>
      <BarraInferior itens={itens} />
    </>
  );
}
