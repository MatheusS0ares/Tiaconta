import type { Metadata } from "next";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = { title: "Termo de uso e privacidade" };

// TODO(jurídico): texto-resumo baseado no PRD §8. Substituir pelo termo revisado
// por advogado antes do uso com famílias reais.
export default function Privacidade() {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 bg-fundo px-4 pb-12 pt-6">
      <Logo size={40} />
      <h1 className="text-2xl font-semibold">Termo de uso e privacidade</h1>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">O que é registrado</h2>
        <p>
          A equipe da escola registra a rotina da criança: alimentação, sono, higiene, recados e, quando a escola usar,
          informações de saúde como febre e medicação. Cada registro guarda quem registrou e quando.
        </p>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Quem vê</h2>
        <p>
          Só a equipe da escola e os responsáveis vinculados àquela criança. Outros pais não veem os dados do seu filho.
          Cada escola só enxerga os próprios dados.
        </p>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Fotos</h2>
        <p>
          Fotos ficam em armazenamento privado e só aparecem para quem tem acesso. Crianças sem autorização de imagem não
          aparecem em publicações da turma.
        </p>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Seus direitos</h2>
        <p>
          Você pode pedir à escola para corrigir ou excluir os dados ao fim do vínculo. Dados de crianças são tratados como
          sensíveis, conforme a LGPD.
        </p>
      </section>
    </main>
  );
}
