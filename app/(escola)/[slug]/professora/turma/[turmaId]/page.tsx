import { CabecalhoTurma } from "@/components/agenda/CabecalhoTurma";
import { ListaTurma } from "@/components/agenda/ListaTurma";

export default async function TelaTurma({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <>
      <CabecalhoTurma slug={slug} />
      <ListaTurma slug={slug} />
    </>
  );
}
