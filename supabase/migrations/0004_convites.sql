-- 0004_convites.sql — convite por link (WhatsApp) para professora e responsável + RLS.
--
-- O gestor cria o convite (RLS). Quem recebe o link ainda não é membro, então
-- não enxerga nada da escola: ver_convite() e aceitar_convite() são security
-- definer e validam o token. Isso evita usar a service_role no app.

create table convites (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null references escolas(id) on delete cascade,
  papel papel_membro not null,
  crianca_id uuid,                     -- obrigatório para responsável
  turma_id uuid,                       -- opcional para professora
  parentesco text,
  token text not null unique
    default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  criado_por uuid references auth.users(id) default auth.uid(),
  criado_em timestamptz not null default now(),
  expira_em timestamptz not null default now() + interval '7 days',
  aceito_por uuid references auth.users(id),
  aceito_em timestamptz,
  revogado_em timestamptz,
  constraint convites_papel check (papel in ('professora', 'responsavel')),
  constraint convites_responsavel_tem_crianca check (papel <> 'responsavel' or crianca_id is not null),
  constraint convites_crianca_so_responsavel check (papel = 'responsavel' or crianca_id is null),
  constraint convites_turma_so_professora check (papel = 'professora' or turma_id is null),
  foreign key (crianca_id, escola_id) references criancas(id, escola_id) on delete cascade,
  foreign key (turma_id, escola_id) references turmas(id, escola_id) on delete cascade
);
create index on convites (escola_id, criado_em desc);

-- autor e horário sempre do servidor (regra 5)
create or replace function trg_convite_autoria()
returns trigger language plpgsql as $$
begin
  new.criado_por := coalesce(auth.uid(), new.criado_por);
  new.criado_em := now();
  new.aceito_por := null;
  new.aceito_em := null;
  return new;
end $$;

create trigger convites_autoria
before insert on convites
for each row execute function trg_convite_autoria();

alter table convites enable row level security;

create policy convites_select on convites for select using (fn_e_gestor(escola_id));
create policy convites_insert on convites for insert with check (fn_e_gestor(escola_id));
create policy convites_update on convites for update
  using (fn_e_gestor(escola_id)) with check (fn_e_gestor(escola_id));
create policy convites_delete on convites for delete using (fn_e_gestor(escola_id));

-- ---------------------------------------------------------------- ver convite
-- Dados mínimos para a tela do convite (inclusive antes do login).
create or replace function ver_convite(p_token text)
returns table (
  escola_nome text,
  escola_slug text,
  escola_logo_url text,
  escola_cor_primaria text,
  papel papel_membro,
  crianca_nome text,
  turma_nome text,
  situacao text           -- 'valido' | 'expirado' | 'usado' | 'revogado'
) language sql stable security definer set search_path = public as $$
  select e.nome, e.slug, e.logo_url, e.cor_primaria, c.papel, cr.nome, t.nome,
    case
      when c.revogado_em is not null then 'revogado'
      when c.aceito_em is not null then 'usado'
      when c.expira_em < now() then 'expirado'
      else 'valido'
    end
  from convites c
  join escolas e on e.id = c.escola_id
  left join criancas cr on cr.id = c.crianca_id
  left join turmas t on t.id = c.turma_id
  where c.token = p_token;
$$;

-- ---------------------------------------------------------------- aceitar convite
-- Cria o membro (e o vínculo com a criança ou a turma). Uso único.
-- Retorna o slug da escola.
create or replace function aceitar_convite(p_token text)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  c convites%rowtype;
  v_slug text;
begin
  if v_user is null then
    raise exception 'convite_sem_login' using errcode = 'P0001';
  end if;

  select * into c from convites where token = p_token for update;
  if not found then raise exception 'convite_invalido' using errcode = 'P0001'; end if;
  if c.revogado_em is not null then raise exception 'convite_revogado' using errcode = 'P0001'; end if;
  if c.aceito_em is not null then
    if c.aceito_por = v_user then  -- mesmo usuário tocando de novo: idempotente
      select slug into v_slug from escolas where id = c.escola_id;
      return v_slug;
    end if;
    raise exception 'convite_usado' using errcode = 'P0001';
  end if;
  if c.expira_em < now() then raise exception 'convite_expirado' using errcode = 'P0001'; end if;

  insert into membros (escola_id, user_id, papel)
  values (c.escola_id, v_user, c.papel)
  on conflict (escola_id, user_id, papel) do update set ativo = true;

  if c.papel = 'responsavel' then
    insert into responsaveis_criancas (crianca_id, escola_id, user_id, parentesco)
    values (c.crianca_id, c.escola_id, v_user, c.parentesco)
    on conflict (crianca_id, user_id) do nothing;
  elsif c.turma_id is not null then
    insert into turma_professoras (turma_id, escola_id, user_id)
    values (c.turma_id, c.escola_id, v_user)
    on conflict (turma_id, user_id) do nothing;
  end if;

  update convites set aceito_por = v_user, aceito_em = now() where id = c.id;

  select slug into v_slug from escolas where id = c.escola_id;
  return v_slug;
end $$;

revoke execute on function aceitar_convite(text) from public, anon;
grant execute on function aceitar_convite(text) to authenticated;
grant execute on function ver_convite(text) to anon, authenticated;
