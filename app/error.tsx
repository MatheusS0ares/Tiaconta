"use client";

import { CloudOff } from "lucide-react";
import { EstadoVazio } from "@/components/ui/EstadoVazio";
import { Botao } from "@/components/ui/Botao";

export default function Erro({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4 py-8">
      <EstadoVazio icone={CloudOff} titulo="Algo deu errado" principal>
        <p>Pode ser a internet. Confira a conexão e tente de novo.</p>
      </EstadoVazio>
      <Botao variante="marca" onClick={reset}>
        Tentar de novo
      </Botao>
    </main>
  );
}
