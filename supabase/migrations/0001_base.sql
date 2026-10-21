-- 0001_base.sql — tenants, membros, turmas, crianças, responsáveis + RLS

create extension if not exists pgcrypto;

create type papel_membro as enum ('gestor', 'professora', 'responsavel');
create type faixa_etaria as enum ('bercario', 'maternal', 'pre_escola', 'fundamental');

-- ---------------------------------------------------------------- escolas
create table escolas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique,
  logo_url text,
  cor_primaria text default '#2563eb',
  modulos jsonb not null default '{"agenda": true, "comunicados": false, "linha_do_tempo": false}',
  agenda_visivel_antes_finalizar boolean not null default true,
  criado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------- perfis
create table perfis (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  telefone text,
  criado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------- membros
create table membros (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null references escolas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  papel papel_membro not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  unique (escola_id, user_id, papel)
);
create index on membros (user_id);

-- ---------------------------------------------------------------- turmas
create table turmas (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null references escolas(id) on delete cascade,
  nome text not null,
  faixa faixa_etaria not null,
  ano_letivo int not null default extract(year from now())::int,
  ativa boolean not null default true,
  unique (id, escola_id)
);
create index on turmas (escola_id);

create table turma_professoras (
  turma_id uuid not null,
  escola_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (turma_id, user_id),
  foreign key (turma_id, escola_id) references turmas(id, escola_id) on delete cascade
);

-- ---------------------------------------------------------------- crianças
create table criancas (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null references escolas(id) on delete cascade,
  turma_id uuid,
  nome text not null,
  data_nascimento date,
  foto_path text,                       -- storage privado
  autoriza_imagem boolean not null default false,
  restricoes_alimentares text,
  observacoes_saude text,
  ativa boolean not null default true,
  unique (id, escola_id),
  foreign key (turma_id, escola_id) references turmas(id, escola_id)
);
create index on criancas (escola_id, turma_id);

create table responsaveis_criancas (
  crianca_id uuid not null,
  escola_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  parentesco text,
  primary key (crianca_id, user_id),
  foreign key (crianca_id, escola_id) references criancas(id, escola_id) on delete cascade
);
create index on responsaveis_criancas (user_id);

-- ---------------------------------------------------------------- helpers RLS
-- security definer evita recursão de RLS em membros
create or replace function fn_e_membro(p_escola uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from membros
    where escola_id = p_escola and user_id = auth.uid() and ativo
  );
$$;

create or replace function fn_tem_papel(p_escola uuid, p_papeis papel_membro[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from membros
    where escola_id = p_escola and user_id = auth.uid() and ativo
      and papel = any (p_papeis)
  );
$$;

create or replace function fn_e_equipe(p_escola uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select fn_tem_papel(p_escola, array['gestor', 'professora']::papel_membro[]);
$$;

create or replace function fn_e_gestor(p_escola uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select fn_tem_papel(p_escola, array['gestor']::papel_membro[]);
$$;

create or replace function fn_e_responsavel_de(p_crianca uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from responsaveis_criancas
    where crianca_id = p_crianca and user_id = auth.uid()
  );
$$;

create or replace function fn_e_responsavel_na_turma(p_turma uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from responsaveis_criancas r
    join criancas c on c.id = r.crianca_id
    where c.turma_id = p_turma and r.user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------- RLS
alter table escolas enable row level security;
alter table perfis enable row level security;
alter table membros enable row level security;
alter table turmas enable row level security;
alter table turma_professoras enable row level security;
alter table criancas enable row level security;
alter table responsaveis_criancas enable row level security;

-- escolas
create policy escolas_select on escolas for select using (fn_e_membro(id));
create policy escolas_update on escolas for update using (fn_e_gestor(id)) with check (fn_e_gestor(id));

-- perfis: o próprio usuário, ou alguém que compartilha escola com ele
create policy perfis_select on perfis for select using (
  user_id = auth.uid()
  or exists (
    select 1 from membros m
    where m.user_id = perfis.user_id and fn_e_membro(m.escola_id)
  )
);
create policy perfis_upsert on perfis for insert with check (user_id = auth.uid());
create policy perfis_update on perfis for update using (user_id = auth.uid());

-- membros
create policy membros_select on membros for select using (user_id = auth.uid() or fn_e_equipe(escola_id));
create policy membros_write on membros for all using (fn_e_gestor(escola_id)) with check (fn_e_gestor(escola_id));

-- turmas
create policy turmas_select on turmas for select using (fn_e_equipe(escola_id) or fn_e_responsavel_na_turma(id));
create policy turmas_write on turmas for all using (fn_e_gestor(escola_id)) with check (fn_e_gestor(escola_id));

-- turma_professoras
create policy tp_select on turma_professoras for select using (fn_e_equipe(escola_id));
create policy tp_write on turma_professoras for all using (fn_e_gestor(escola_id)) with check (fn_e_gestor(escola_id));

-- crianças
create policy criancas_select on criancas for select using (fn_e_equipe(escola_id) or fn_e_responsavel_de(id));
create policy criancas_write on criancas for all using (fn_e_gestor(escola_id)) with check (fn_e_gestor(escola_id));

-- responsáveis
create policy rc_select on responsaveis_criancas for select using (user_id = auth.uid() or fn_e_equipe(escola_id));
create policy rc_write on responsaveis_criancas for all using (fn_e_gestor(escola_id)) with check (fn_e_gestor(escola_id));
