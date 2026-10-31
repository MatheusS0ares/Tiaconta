import { CabecalhoTurma } from "@/components/agenda/CabecalhoTurma";
import { Mural } from "@/components/agenda/Mural";

export default async function PaginaMural({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <>
      <CabecalhoTurma slug={slug} />
      <Mural />
    </>
  );
}
