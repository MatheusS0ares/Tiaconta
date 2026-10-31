import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { obterUsuario } from "@/lib/auth/sessao";
import { caminhoSeguro } from "@/lib/navegacao";
import { FormLogin } from "./FormLogin";

export const metadata: Metadata = { title: "Entrar" };

export default async function PaginaLogin({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; erro?: string }>;
}) {
  const { next: nextBruto, erro } = await searchParams;
  const next = caminhoSeguro(nextBruto);
  if (await obterUsuario()) redirect(next);

  return (
    <main className="flex min-h-dvh flex-col bg-superficie px-4 pb-8 pt-12">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col">
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo size={64} />
          <p className="text-lg text-texto-2">O dia do seu filho na escola, contado com carinho.</p>
        </div>
        {/* formulário na metade inferior: zona do polegar */}
        <div className="mt-auto pt-10">
          <FormLogin
            next={next}
            erroInicial={erro === "link" ? "Esse link expirou ou já foi usado. Peça um novo abaixo." : undefined}
          />
          <p className="mt-6 text-center text-sm text-texto-2">
            Sem senha: você recebe um link e um código no e-mail.
          </p>
        </div>
      </div>
    </main>
  );
}
