import { FluxoLote } from "@/components/agenda/FluxoLote";

export default async function Lote({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <FluxoLote slug={slug} />;
}
