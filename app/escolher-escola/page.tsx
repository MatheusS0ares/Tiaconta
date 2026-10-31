import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, School } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { EstadoVazio } from "@/components/ui/EstadoVazio";
import { Botao } from "@/components/ui/Botao";
import { exigirUsuario, minhasEscolas } from "@/lib/auth/sessao";
import { NOME_DO_PAPEL, ORDEM_PAPEIS } from "@/lib/auth/papeis";

export const metadata: Metadata = { title: "Escolha a escola" };

export default async function EscolherEscola() {
  const usuario = await exigirUsuario("/escolher-escola");
  const escolas = await minhasEscolas();

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col gap-6 bg-fundo px-4 pb-8 pt-6">
      <Logo size={40} />
      {escolas.length === 0 ? (
        <>
          <EstadoVazio icone={School} titulo="Você ainda não está em nenhuma escola" principal>
            <p>Peça para a escola enviar o link de convite pelo WhatsApp. Ao abrir o link, você entra direto.</p>
            <p className="text-sm">Entrou como {usuario.email}</p>
          </EstadoVazio>
          <form action="/sair" method="post" className="mt-auto">
            <Botao type="submit" variante="secundaria">
              Entrar com outro e-mail
            </Botao>
          </form>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-semibold">Qual escola você quer abrir?</h1>
          <ul className="flex flex-col gap-3">
            {escolas.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/${e.slug}`}
                  className="flex min-h-20 items-center gap-4 rounded-tc border border-neutra bg-fundo p-4"
                >
                  {e.logo_url ? (
                    <Image src={e.logo_url} alt="" width={48} height={48} className="size-12 rounded-full object-cover" />
                  ) : (
                    <span className="flex size-12 items-center justify-center rounded-full bg-superficie">
                      <School className="size-6" aria-hidden />
                    </span>
                  )}
                  <span className="flex-1">
                    <span className="block font-bold">{e.nome}</span>
                    <span className="block text-sm text-texto-2">
                      {ORDEM_PAPEIS.filter((p) => e.papeis.includes(p)).map((p) => NOME_DO_PAPEL[p]).join(" · ")}
                    </span>
                  </span>
                  <ChevronRight className="size-6 text-texto-2" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
