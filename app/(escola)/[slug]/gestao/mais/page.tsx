import type { Metadata } from "next";
import { ListChecks, UserRound, Users } from "lucide-react";
import { Titulo } from "@/components/ui/Titulo";
import { ListaLinks } from "@/components/ui/ListaLinks";

export const metadata: Metadata = { title: "Mais" };

export default async function Mais({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <>
      <Titulo>Mais</Titulo>
      <ListaLinks
        itens={[
          { href: `/${slug}/gestao/equipe`, rotulo: "Equipe e convites", descricao: "Professoras, gestão e convites", icone: Users },
          { href: `/${slug}/gestao/campos`, rotulo: "Campos da agenda", descricao: "O que a professora registra", icone: ListChecks },
          { href: `/${slug}/perfil?papel=gestor`, rotulo: "Perfil", descricao: "Seus dados e sair", icone: UserRound },
        ]}
      />
    </>
  );
}
