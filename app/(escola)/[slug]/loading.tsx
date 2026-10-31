import { EsqueletoLista } from "@/components/ui/Esqueleto";
import { Esqueleto } from "@/components/ui/Esqueleto";

export default function Carregando() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 pt-6">
      <Esqueleto className="h-8 w-1/2" />
      <EsqueletoLista />
    </div>
  );
}
