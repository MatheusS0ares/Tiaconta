# Agenda Escolar (nome provisório)

Agenda digital multi-tenant para educação infantil. Piloto: Escolinha ABC.

- `CLAUDE.md` — regras para o Claude Code (leia primeiro)
- `docs/PRD.md` — produto, fases, diferenciais
- `docs/UX.md` — regras de interface (Laws of UX) e checklist de entrega
- `docs/BENCHMARK-minha-escola.md` — análise do concorrente (visão do responsável)
- `supabase/migrations/` — schema com RLS
- `supabase/seed.sql` — escola piloto + campos padrão da agenda

Primeiro prompt sugerido no Claude Code:
> Leia CLAUDE.md e docs/PRD.md. Inicialize o projeto Next.js 15 com Supabase
> conforme as regras, aplique as migrations localmente e implemente a Fase 1
> começando pela tela da professora (lista da turma + registro em lote).
