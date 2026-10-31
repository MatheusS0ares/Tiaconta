import { exigirPapel } from "@/lib/escola";
import { AreaPapel } from "@/components/ui/AreaPapel";
import { itensProfessora } from "@/lib/navegacao-papeis";

export default async function LayoutProfessora({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await exigirPapel(slug, "professora");
  return <AreaPapel itens={itensProfessora(slug)}>{children}</AreaPapel>;
}
