# CLAUDE.md — Agenda Escolar (nome provisório)

App de agenda digital e gestão para creches e escolas de educação infantil.
SaaS multi-tenant. Cliente piloto: Escolinha ABC (Gama-DF, ~54 crianças).
Referência funcional (não copiar): App Minha Escola — ver docs/BENCHMARK-minha-escola.md.

Leia docs/PRD.md antes de implementar qualquer feature.
Leia docs/UX.md antes de criar ou alterar qualquer tela.

## Regras inegociáveis

1. **Multi-tenant sempre.** Toda tabela de negócio tem `escola_id uuid not null`.
   Nunca crie tabela de negócio sem ela. Nunca filtre por escola só no front.
2. **RLS em todas as tabelas.** Toda migration que cria tabela também faz
   `enable row level security` e cria as policies no mesmo arquivo.
   Use as funções helper de `0001_base.sql` (`fn_e_membro`, `fn_tem_papel`,
   `fn_e_responsavel_de`). Não reescreva a lógica de permissão inline.
3. **A `service_role` key nunca vai pro client.** Só em código de servidor
   (server actions/route handlers) e só quando RLS realmente não resolve.
   Acesso normal a dados = cliente Supabase com a sessão do usuário.
4. **Sem Prisma para dados da aplicação.** O Prisma conecta como dono do banco
   e ignora RLS. Schema é versionado em `supabase/migrations/*.sql`
   (Supabase CLI). Tipos TS gerados com `supabase gen types typescript`.
5. **Todo registro tem autor e horário** (`registrado_por`, `registrado_em`).
   É requisito de produto (a diretora precisa ver quem registrou o quê), não detalhe.
6. **Campos da agenda são dados, não código.** Nada de `if (campo === 'sono')`
   espalhado. A UI renderiza a partir de `agenda_campos.tipo`. Cada tipo tem
   um schema zod em `lib/agenda/tipos.ts` que valida `valor` (jsonb).

## Stack

- Next.js 15 (App Router, Server Components, Server Actions), TypeScript strict
- Tailwind CSS
- Supabase: Postgres + Auth + Storage + Realtime
- PWA (manifest + service worker) — sem app nativo no MVP
- Deploy: Vercel
- Validação: zod

## UX

**docs/UX.md é obrigatório.** Toda tela nova ou alterada passa pelo checklist
da seção 7 de docs/UX.md antes de ser dada como pronta. Ao terminar uma tela,
liste quais itens do checklist foram verificados e como.

- Interface 100% em português do Brasil.
- Mobile-first: projetar para 360px de largura. A professora usa o celular
  com uma mão, com criança no colo. Botões grandes, poucos toques.
- Meta: registrar um item para uma criança em ≤ 2 toques; para a turma toda
  (registro em lote) em ≤ 4 toques.
- Pais: tela de "Resumo do dia" carrega rápido em 4G (Server Component,
  imagens via next/image).

## Formato do `valor` por tipo de campo

| tipo         | valor (jsonb)                                         |
|--------------|-------------------------------------------------------|
| opcao        | `{"opcao": "Comeu tudo"}`                             |
| sim_nao      | `{"sim": true}`                                       |
| evento       | `{"hora": "14:30", "opcao": "Xixi", "obs": "..."}`    |
| intervalo    | `{"inicio": "12:10", "fim": "13:40"}`                 |
| quantidade   | `{"quantidade": 180, "hora": "09:00"}` (unidade em `agenda_campos.opcoes.unidade`) |
| texto        | `{"texto": "..."}`                                    |
| checklist    | `{"itens": ["Fralda", "Roupa extra"], "obs": "..."}`  |

Campos com `multiplo = true` (ex.: trocas de fralda, sono) aceitam várias linhas
em `agenda_registros` no mesmo dia.

## Estrutura sugerida

```
app/
  (auth)/login
  (escola)/[slug]/
    professora/      # registro da agenda por turma
    gestao/          # painel da diretora, turmas, crianças, campos
    responsavel/     # resumo do dia, comunicados
lib/
  supabase/          # clients server/browser
  agenda/tipos.ts    # schemas zod por tipo de campo
supabase/
  migrations/
  seed.sql
```

## Comandos

```bash
supabase start                 # banco local
supabase db reset              # aplica migrations + seed
supabase gen types typescript --local > lib/supabase/database.types.ts
npm run dev
```

## Ordem de implementação

Siga as fases do PRD. Não comece comunicados, linha do tempo ou financeiro
antes da Fase 1 estar rodando com a Escolinha ABC.

## Testes

- Toda policy de RLS nova precisa de teste: um usuário de outra escola NÃO
  enxerga o dado; um responsável NÃO enxerga criança que não é dele.
- Use `supabase test db` (pgTAP) em `supabase/tests/`.
