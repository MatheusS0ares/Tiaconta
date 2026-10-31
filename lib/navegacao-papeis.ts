import type { ItemBarra } from "@/components/ui/BarraInferior";

/** Itens da barra inferior por papel (UX.md: no máximo 4). */
export function itensGestao(slug: string): ItemBarra[] {
  return [
    { href: `/${slug}/gestao`, rotulo: "Painel", icone: "inicio", exato: true },
    { href: `/${slug}/gestao/equipe`, rotulo: "Equipe", icone: "equipe" },
    { href: `/${slug}/perfil?papel=gestor`, rotulo: "Perfil", icone: "perfil" },
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
