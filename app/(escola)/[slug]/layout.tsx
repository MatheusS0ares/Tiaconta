import Image from "next/image";
import { redirect } from "next/navigation";
import { escolaAtual } from "@/lib/escola";
import { precisaBoasVindas } from "@/lib/auth/sessao";
import { estiloCorEscola } from "@/lib/cor";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const escola = await escolaAtual((await params).slug);
  return { title: { default: escola.nome, template: `%s · ${escola.nome}` } };
}

/** Layout do tenant: aplica a cor da escola (--escola-primaria) e mostra o logo. */
export default async function LayoutEscola({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const escola = await escolaAtual(slug);
  if (await precisaBoasVindas()) redirect(`/boas-vindas?next=/${slug}`);

  return (
    <div style={estiloCorEscola(escola.cor_primaria)} className="flex min-h-dvh flex-col bg-fundo">
      <header className="sticky top-0 z-10 border-b border-neutra bg-fundo/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-xl items-center gap-3 px-4">
          {escola.logo_url ? (
            <Image src={escola.logo_url} alt="" width={36} height={36} className="size-9 rounded-full object-cover" />
          ) : (
            <span aria-hidden className="size-3 rounded-full bg-primaria" />
          )}
          <span className="truncate font-marca text-lg font-semibold">{escola.nome}</span>
        </div>
      </header>
      {children}
    </div>
  );
}
