import { exigirPapel } from "@/lib/escola";
import { AreaPapel } from "@/components/ui/AreaPapel";
import { itensResponsavel } from "@/lib/navegacao-papeis";

export default async function LayoutResponsavel({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await exigirPapel(slug, "responsavel");
  return <AreaPapel itens={itensResponsavel(slug)}>{children}</AreaPapel>;
}
