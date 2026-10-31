import { SearchX } from "lucide-react";
import { EstadoVazio } from "@/components/ui/EstadoVazio";
import { BotaoLink } from "@/components/ui/Botao";

export default function NaoEncontrado() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4 py-8">
      <EstadoVazio icone={SearchX} titulo="Não encontramos esta página" principal>
        <p>O endereço pode estar errado ou você não tem acesso a ele.</p>
      </EstadoVazio>
      <BotaoLink href="/" variante="marca">
        Ir para o início
      </BotaoLink>
    </main>
  );
}
