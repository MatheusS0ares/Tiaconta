import { exigirPapel } from "@/lib/escola";
import { AreaPapel } from "@/components/ui/AreaPapel";
import { itensGestao } from "@/lib/navegacao-papeis";

export default async function LayoutGestao({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await exigirPapel(slug, "gestor");
  return <AreaPapel itens={itensGestao(slug)}>{children}</AreaPapel>;
}
