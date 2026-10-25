# TiaConta

Agenda digital multi-tenant para educação infantil. Piloto: Escolinha ABC.

- `CLAUDE.md` — regras para o Claude Code (leia primeiro)
- `docs/PRD.md` — produto, fases, diferenciais
- `docs/UX.md` — regras de interface (Laws of UX) e checklist de entrega
- `docs/MARCA.md` — marca, Tia, cores, tipografia, tom de voz
- `public/brand/`, `styles/tokens.css`, `components/brand/Logo.tsx` — ativos prontos
- `docs/BENCHMARK-minha-escola.md` — análise do concorrente (visão do responsável)
- `supabase/migrations/` — schema com RLS
- `supabase/seed.sql` — escola piloto + campos padrão da agenda

Primeiro prompt sugerido no Claude Code:
> Leia CLAUDE.md, docs/PRD.md, docs/UX.md e docs/MARCA.md. Inicialize o projeto Next.js 15 com Supabase
> conforme as regras. Como a pasta já tem arquivos, rode o create-next-app numa pasta
> temporária e traga o projeto pra cá sem sobrescrever nada que já existe
> (docs/, supabase/, public/brand/, styles/, components/brand/, CLAUDE.md).
> Depois aplique as migrations localmente e implemente a Fase 1 começando
> pela tela da professora (lista da turma + registro em lote).
