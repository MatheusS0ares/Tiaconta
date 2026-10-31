import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { exigirUsuario, meuPerfil, minhasEscolas, precisaBoasVindas } from "@/lib/auth/sessao";
import { caminhoSeguro } from "@/lib/navegacao";
import { FormBoasVindas } from "./FormBoasVindas";

export const metadata: Metadata = { title: "Boas-vindas" };

export default async function BoasVindas({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = caminhoSeguro((await searchParams).next);
  await exigirUsuario("/boas-vindas");
  if (!(await precisaBoasVindas())) redirect(next);

  const [perfil, escolas] = await Promise.all([meuPerfil(), minhasEscolas()]);
  const pedirConsentimento = escolas.some((e) => e.papeis.includes("responsavel")) && !perfil?.consentimento_em;

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col gap-6 bg-fundo px-4 pb-8 pt-6">
      <Logo size={40} />
      <div>
        <h1 className="text-2xl font-semibold">Que bom ter você aqui!</h1>
        <p className="mt-1 text-texto-2">Só falta isso para começar.</p>
      </div>
      <FormBoasVindas
        next={next}
        nome={perfil?.nome}
        telefone={perfil?.telefone ?? undefined}
        pedirConsentimento={pedirConsentimento}
      />
    </main>
  );
}
