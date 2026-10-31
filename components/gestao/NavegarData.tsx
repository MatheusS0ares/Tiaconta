import Link from "next/link";
import { SetaLink } from "@/components/ui/SetaLink";
import { ChevronLeft } from "lucide-react";
import { formatarDataLonga, hoje, somarDias } from "@/lib/agenda/data";

/** Troca o dia do painel/detalhes: ‹ ontem · hoje › (nunca futuro). */
export function NavegarData({ href, data }: { href: (data: string) => string; data: string }) {
  const eHoje = data === hoje();
  return (
    <div className="flex items-center justify-between rounded-tc bg-superficie px-1">
      <Link href={href(somarDias(data, -1))} aria-label="Dia anterior" className="flex size-12 items-center justify-center rounded-full">
        <ChevronLeft className="size-6" aria-hidden />
      </Link>
      <p className="text-center font-semibold first-letter:uppercase">
        {eHoje ? "Hoje · " : ""}
        {formatarDataLonga(data)}
      </p>
      {eHoje ? (
        <span className="size-12" aria-hidden />
      ) : (
        <Link href={href(somarDias(data, 1))} aria-label="Próximo dia" className="flex size-12 items-center justify-center rounded-full">
          <SetaLink className="size-6" />
        </Link>
      )}
    </div>
  );
}
