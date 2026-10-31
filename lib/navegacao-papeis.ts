import type { ItemBarra } from "@/components/ui/BarraInferior";

/** Itens da barra inferior por papel (UX.md: no máximo 4). */
export function itensGestao(slug: string): ItemBarra[] {
  return [
    { href: `/${slug}/gestao`, rotulo: "Painel", icone: "inicio", exato: true },
    { href: `/${slug}/gestao/turmas`, rotulo: "Turmas", icone: "turma" },
    { href: `/${slug}/gestao/criancas`, rotulo: "Crianças", icone: "criancas" },
    {
      href: `/${slug}/gestao/mais`,
      rotulo: "Mais",
      icone: "mais",
      ativoEm: [`/${slug}/gestao/equipe`, `/${slug}/gestao/campos`, `/${slug}/perfil`],
    },
  ];
}

export function itensProfessora(slug: string): ItemBarra[] {
  return [
    { href: `/${slug}/professora`, rotulo: "Turmas", icone: "turma" },
    { href: `/${slug}/perfil?papel=professora`, rotulo: "Perfil", icone: "perfil" },
  ];
}

export function itensResponsavel(slug: string): ItemBarra[] {
  return [
    { href: `/${slug}/responsavel`, rotulo: "Hoje", icone: "inicio" },
    { href: `/${slug}/perfil?papel=responsavel`, rotulo: "Perfil", icone: "perfil" },
  ];
}
