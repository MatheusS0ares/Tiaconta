-- 0002_agenda.sql — agenda diária configurável, mural da turma, leitura + RLS

create type tipo_campo as enum (
  'opcao', 'sim_nao', 'evento', 'intervalo', 'quantidade', 'texto', 'checklist'
);
create type status_dia as enum ('rascunho', 'finalizado');

-- ---------------------------------------------------------------- campos
-- Cada escola define seus campos. faixas = null → vale para todas as faixas.
create table agenda_campos (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null references escolas(id) on delete cascade,
  chave text not null,
  rotulo text not null,
  tipo tipo_campo not null,
  opcoes jsonb not null default '{}',      -- ex.: {"opcoes": [...]} ou {"unidade": "ml"}
  multiplo boolean not null default false, -- várias entradas no mesmo dia
  faixas faixa_etaria[],
  visivel_responsavel boolean not null default true,
  ordem int not null default 0,
  ativo boolean not null default true,
  unique (escola_id, chave),
  unique (id, escola_id)
);

-- ---------------------------------------------------------------- mural da turma
create table turma_dias (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null,
  turma_id uuid not null,
  data date not null,
  mural text,
  autor uuid references auth.users(id) default auth.uid(),
  atualizado_em timestamptz not null default now(),
  unique (turma_id, data),
  foreign key (turma_id, escola_id) references turmas(id, escola_id) on delete cascade
);

-- ---------------------------------------------------------------- dia da criança
create table agenda_dias (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null,
  crianca_id uuid not null,
  data date not null,
  faltou boolean not null default false,
  status status_dia not null default 'rascunho',
  finalizado_por uuid references auth.users(id),
  finalizado_em timestamptz,
  criado_em timestamptz not null default now(),
  unique (crianca_id, data),
  unique (id, escola_id),
  foreign key (crianca_id, escola_id) references criancas(id, escola_id) on delete cascade
);
create index on agenda_dias (escola_id, data);

-- ---------------------------------------------------------------- registros
create table agenda_registros (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null,
  agenda_dia_id uuid not null,
  campo_id uuid not null,
  valor jsonb not null,
  registrado_por uuid references auth.users(id) default auth.uid(),
  registrado_em timestamptz not null default now(),
  atualizado_por uuid references auth.users(id),
  atualizado_em timestamptz,
  foreign key (agenda_dia_id, escola_id) references agenda_dias(id, escola_id) on delete cascade,
  foreign key (campo_id, escola_id) references agenda_campos(id, escola_id)
);
create index on agenda_registros (agenda_dia_id);
create index on agenda_registros (escola_id, registrado_por, registrado_em); -- painel da equipe

-- ---------------------------------------------------------------- leitura pelo responsável
create table agenda_leituras (
  agenda_dia_id uuid not null,
  escola_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  lido_em timestamptz not null default now(),
  primary key (agenda_dia_id, user_id),
  foreign key (agenda_dia_id, escola_id) references agenda_dias(id, escola_id) on delete cascade
);

-- ---------------------------------------------------------------- triggers de auditoria
create or replace function trg_registro_auditoria()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    new.registrado_por := coalesce(auth.uid(), new.registrado_por);
    new.registrado_em := now();
  else
    new.registrado_por := old.registrado_por;   -- autor original é imutável
    new.registrado_em := old.registrado_em;
    new.atualizado_por := auth.uid();
    new.atualizado_em := now();
  end if;
  return new;
end $$;

create trigger agenda_registros_auditoria
before insert or update on agenda_registros
for each row execute function trg_registro_auditoria();

create or replace function trg_dia_finalizacao()
returns trigger language plpgsql as $$
begin
  if new.status = 'finalizado' and old.status is distinct from 'finalizado' then
    new.finalizado_por := auth.uid();
    new.finalizado_em := now();
  elsif new.status = 'rascunho' then
    new.finalizado_por := null;
    new.finalizado_em := null;
  end if;
  return new;
end $$;

create trigger agenda_dias_finalizacao
before update on agenda_dias
for each row execute function trg_dia_finalizacao();

-- ---------------------------------------------------------------- helpers
create or replace function fn_dia_editavel(p_dia uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from agenda_dias d
    where d.id = p_dia
      and (d.status = 'rascunho' or fn_e_gestor(d.escola_id))
  );
$$;

create or replace function fn_dia_visivel_responsavel(p_dia uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from agenda_dias d
    join escolas e on e.id = d.escola_id
    where d.id = p_dia
      and fn_e_responsavel_de(d.crianca_id)
      and (d.status = 'finalizado' or e.agenda_visivel_antes_finalizar)
  );
$$;

-- ---------------------------------------------------------------- RLS
alter table agenda_campos enable row level security;
alter table turma_dias enable row level security;
alter table agenda_dias enable row level security;
alter table agenda_registros enable row level security;
alter table agenda_leituras enable row level security;

-- campos: todos os membros leem, gestor configura
create policy campos_select on agenda_campos for select using (fn_e_membro(escola_id));
create policy campos_write on agenda_campos for all using (fn_e_gestor(escola_id)) with check (fn_e_gestor(escola_id));

-- mural da turma
create policy td_select on turma_dias for select using (fn_e_equipe(escola_id) or fn_e_responsavel_na_turma(turma_id));
create policy td_write on turma_dias for all using (fn_e_equipe(escola_id)) with check (fn_e_equipe(escola_id));

-- dias
create policy dias_select on agenda_dias for select using (fn_e_equipe(escola_id) or fn_dia_visivel_responsavel(id));
create policy dias_insert on agenda_dias for insert with check (fn_e_equipe(escola_id));
create policy dias_update on agenda_dias for update
  using (fn_e_equipe(escola_id) and (status = 'rascunho' or fn_e_gestor(escola_id)))
  with check (fn_e_equipe(escola_id));
create policy dias_delete on agenda_dias for delete using (fn_e_gestor(escola_id));

-- registros: responsável só vê campos visíveis; edição bloqueada após finalizar (exceto gestor)
create policy reg_select on agenda_registros for select using (
  fn_e_equipe(escola_id)
  or (
    fn_dia_visivel_responsavel(agenda_dia_id)
    and exists (select 1 from agenda_campos c where c.id = campo_id and c.visivel_responsavel)
  )
);
create policy reg_insert on agenda_registros for insert
  with check (fn_e_equipe(escola_id) and fn_dia_editavel(agenda_dia_id));
create policy reg_update on agenda_registros for update
  using (fn_e_equipe(escola_id) and fn_dia_editavel(agenda_dia_id))
  with check (fn_e_equipe(escola_id));
create policy reg_delete on agenda_registros for delete
  using (fn_e_equipe(escola_id) and fn_dia_editavel(agenda_dia_id));

-- leituras: responsável marca a própria; equipe vê quem leu
create policy leit_select on agenda_leituras for select using (user_id = auth.uid() or fn_e_equipe(escola_id));
create policy leit_insert on agenda_leituras for insert
  with check (user_id = auth.uid() and fn_dia_visivel_responsavel(agenda_dia_id));

-- ---------------------------------------------------------------- registro em lote
-- "Almoço: todos comeram tudo" com exceções. Roda com as permissões de quem chama (RLS vale).
create or replace function registrar_em_lote(
  p_turma uuid,
  p_data date,
  p_campo uuid,
  p_valor jsonb,
  p_exceto uuid[] default '{}'
) returns int language plpgsql security invoker as $$
declare
  v_escola uuid;
  v_total int := 0;
  r record;
  v_dia uuid;
begin
  select escola_id into v_escola from turmas where id = p_turma;
  if v_escola is null then raise exception 'Turma não encontrada'; end if;

  for r in
    select c.id from criancas c
    where c.turma_id = p_turma and c.ativa and not (c.id = any (p_exceto))
  loop
    insert into agenda_dias (escola_id, crianca_id, data)
    values (v_escola, r.id, p_data)
    on conflict (crianca_id, data) do nothing;

    select id into v_dia from agenda_dias
    where crianca_id = r.id and data = p_data and not faltou and status = 'rascunho';

    if v_dia is not null then
      insert into agenda_registros (escola_id, agenda_dia_id, campo_id, valor)
      values (v_escola, v_dia, p_campo, p_valor);
      v_total := v_total + 1;
    end if;
  end loop;

  return v_total;
end $$;

-- ---------------------------------------------------------------- template padrão (berçário/infantil)
create or replace function criar_campos_padrao(p_escola uuid)
returns void language sql security invoker as $$
  insert into agenda_campos (escola_id, chave, rotulo, tipo, opcoes, multiplo, faixas, ordem) values
  (p_escola, 'cafe_manha',   'Café da manhã',  'opcao',      '{"opcoes": ["Comeu tudo","Comeu bem","Comeu pouco","Recusou","Não ofertado"]}', false, null, 10),
  (p_escola, 'almoco',       'Almoço',         'opcao',      '{"opcoes": ["Comeu tudo","Comeu bem","Comeu pouco","Recusou","Não ofertado"]}', false, null, 20),
  (p_escola, 'lanche_tarde', 'Lanche da tarde','opcao',      '{"opcoes": ["Comeu tudo","Comeu bem","Comeu pouco","Recusou","Não ofertado"]}', false, null, 30),
  (p_escola, 'jantar',       'Jantar',         'opcao',      '{"opcoes": ["Comeu tudo","Comeu bem","Comeu pouco","Recusou","Não ofertado"]}', false, null, 40),
  (p_escola, 'mamadeira',    'Mamadeira',      'quantidade', '{"unidade": "ml"}', true, '{bercario}', 50),
  (p_escola, 'agua',         'Água',           'opcao',      '{"opcoes": ["Bebeu bem","Bebeu pouco","Não quis"]}', false, null, 60),
  (p_escola, 'sono',         'Sono',           'intervalo',  '{}', true, null, 70),
  (p_escola, 'fralda',       'Troca de fralda','evento',     '{"opcoes": ["Xixi","Cocô","Xixi e cocô"]}', true, '{bercario,maternal}', 80),
  (p_escola, 'banheiro',     'Banheiro',       'evento',     '{"opcoes": ["Xixi","Cocô"]}', true, '{pre_escola,fundamental}', 90),
  (p_escola, 'medicacao',    'Medicação',      'evento',     '{}', true, null, 100),
  (p_escola, 'temperatura',  'Temperatura',    'quantidade', '{"unidade": "°C"}', true, null, 110),
  (p_escola, 'humor',        'Como foi o dia', 'opcao',      '{"opcoes": ["😄 Muito bem","🙂 Bem","😐 Normal","😢 Choroso","🤒 Indisposto"]}', false, null, 120),
  (p_escola, 'nota',         'Recado para a família', 'texto', '{}', false, null, 130),
  (p_escola, 'trazer',       'Trazer amanhã',  'checklist',  '{"opcoes": ["Fralda","Roupa extra","Lenço umedecido","Pomada","Agasalho","Toalha"]}', false, null, 140)
  on conflict (escola_id, chave) do nothing;
$$;
