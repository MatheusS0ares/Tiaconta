import { TelaCrianca } from "@/components/agenda/TelaCrianca";

export default async function Crianca({ params }: { params: Promise<{ slug: string; criancaId: string }> }) {
  const { slug, criancaId } = await params;
  return <TelaCrianca slug={slug} criancaId={criancaId} />;
}
