import { TelaCrianca } from "@/components/agenda/TelaCrianca";

export default async function Crianca({ params }: { params: Promise<{ criancaId: string }> }) {
  const { criancaId } = await params;
  return <TelaCrianca criancaId={criancaId} />;
}
