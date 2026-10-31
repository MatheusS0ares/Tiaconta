-- 0007_resumo_responsavel.sql — o que o resumo do responsável precisa saber de cada campo
-- (sempre como dado, nunca pela chave no código — regra 6) + "Visto" no trazer amanhã.
--
-- agenda_campos.grupo     → em qual card do resumo o campo aparece (UX.md §4: ≤ 5 cards)
-- agenda_campos.destaque  → nível quando o valor é exceção: 'atencao' | 'alerta' | null
--   opcoes.destaque_opcoes → (opção/evento) só estas opções contam como exceção
--   opcoes.destaque_acima  → (quantidade) acima deste valor é exceção (ex.: febre)
--   sem condição           → qualquer registro é exceção (ex.: medicação)
-- agenda_campos.pede_visto → o responsável confirma com "Visto" (agenda_vistos)

create type grupo_campo as enum ('dia', 'alimentacao', 'sono', 'cuidados', 'recados', 'trazer');

alter table agenda_campos
  add column grupo grupo_campo not null default 'cuidados',
  add column destaque text check (destaque in ('atencao', 'alerta')),
  add column pede_visto boolean not null default false;

comment on column agenda_campos.grupo is 'Card do resumo do responsável: dia (topo), alimentacao, sono, cuidados, recados, trazer.';
comment on column agenda_campos.destaque is 'Nível de destaque quando o valor é exceção (UX.md §4, Von Restorff). Condições em opcoes.destaque_opcoes / opcoes.destaque_acima.';
comment on column agenda_campos.pede_visto is 'Responsável confirma com o botão "Visto" (ex.: trazer amanhã).';

-- ---------------------------------------------------------------- template padrão (escolas existentes)
update agenda_campos set grupo = 'alimentacao', destaque = 'atencao',
  opcoes = opcoes || '{"destaque_opcoes": ["Comeu pouco", "Recusou"]}'
where chave in ('cafe_manha', 'almoco', 'lanche_tarde', 'jantar');
update agenda_campos set grupo = 'alimentacao' where chave = 'mamadeira';
update agenda_campos set grupo = 'alimentacao', destaque = 'atencao',
  opcoes = opcoes || '{"destaque_opcoes": ["Não quis"]}' where chave = 'agua';
update agenda_campos set grupo = 'sono' where chave = 'sono';
update agenda_campos set grupo = 'cuidados' where chave in ('fralda', 'banheiro');
update agenda_campos set grupo = 'cuidados', destaque = 'alerta' where chave = 'medicacao';
update agenda_campos set grupo = 'cuidados', destaque = 'alerta',
  opcoes = opcoes || '{"destaque_acima": 37.5}' where chave = 'temperatura';
update agenda_campos set grupo = 'dia', destaque = 'atencao',
  opcoes = opcoes || '{"destaque_opcoes": ["😢 Choroso", "🤒 Indisposto"]}' where chave = 'humor';
update agenda_campos set grupo = 'recados' where chave = 'nota';
update agenda_campos set grupo = 'trazer', destaque = 'atencao', pede_visto = true where chave = 'trazer';

-- ---------------------------------------------------------------- template padrão (escolas novas)
create or replace function criar_campos_padrao(p_escola uuid)
returns void language sql security invoker as $$
  insert into agenda_campos (escola_id, chave, rotulo, tipo, opcoes, multiplo, faixas, ordem, grupo, destaque, pede_visto) values
  (p_escola, 'cafe_manha',   'Café da manhã',  'opcao',      '{"opcoes": ["Comeu tudo","Comeu bem","Comeu pouco","Recusou","Não ofertado"], "destaque_opcoes": ["Comeu pouco","Recusou"]}', false, null, 10, 'alimentacao', 'atencao', false),
  (p_escola, 'almoco',       'Almoço',         'opcao',      '{"opcoes": ["Comeu tudo","Comeu bem","Comeu pouco","Recusou","Não ofertado"], "destaque_opcoes": ["Comeu pouco","Recusou"]}', false, null, 20, 'alimentacao', 'atencao', false),
  (p_escola, 'lanche_tarde', 'Lanche da tarde','opcao',      '{"opcoes": ["Comeu tudo","Comeu bem","Comeu pouco","Recusou","Não ofertado"], "destaque_opcoes": ["Comeu pouco","Recusou"]}', false, null, 30, 'alimentacao', 'atencao', false),
  (p_escola, 'jantar',       'Jantar',         'opcao',      '{"opcoes": ["Comeu tudo","Comeu bem","Comeu pouco","Recusou","Não ofertado"], "destaque_opcoes": ["Comeu pouco","Recusou"]}', false, null, 40, 'alimentacao', 'atencao', false),
  (p_escola, 'mamadeira',    'Mamadeira',      'quantidade', '{"unidade": "ml"}', true, '{bercario}', 50, 'alimentacao', null, false),
  (p_escola, 'agua',         'Água',           'opcao',      '{"opcoes": ["Bebeu bem","Bebeu pouco","Não quis"], "destaque_opcoes": ["Não quis"]}', false, null, 60, 'alimentacao', 'atencao', false),
  (p_escola, 'sono',         'Sono',           'intervalo',  '{}', true, null, 70, 'sono', null, false),
  (p_escola, 'fralda',       'Troca de fralda','evento',     '{"opcoes": ["Xixi","Cocô","Xixi e cocô"]}', true, '{bercario,maternal}', 80, 'cuidados', null, false),
  (p_escola, 'banheiro',     'Banheiro',       'evento',     '{"opcoes": ["Xixi","Cocô"]}', true, '{pre_escola,fundamental}', 90, 'cuidados', null, false),
  (p_escola, 'medicacao',    'Medicação',      'evento',     '{}', true, null, 100, 'cuidados', 'alerta', false),
  (p_escola, 'temperatura',  'Temperatura',    'quantidade', '{"unidade": "°C", "destaque_acima": 37.5}', true, null, 110, 'cuidados', 'alerta', false),
  (p_escola, 'humor',        'Como foi o dia', 'opcao',      '{"opcoes": ["😄 Muito bem","🙂 Bem","😐 Normal","😢 Choroso","🤒 Indisposto"], "destaque_opcoes": ["😢 Choroso","🤒 Indisposto"]}', false, null, 120, 'dia', 'atencao', false),
  (p_escola, 'nota',         'Recado para a família', 'texto', '{}', false, null, 130, 'recados', null, false),
  (p_escola, 'trazer',       'Trazer amanhã',  'checklist',  '{"opcoes": ["Fralda","Roupa extra","Lenço umedecido","Pomada","Agasalho","Toalha"]}', false, null, 140, 'trazer', 'atencao', true)
  on conflict (escola_id, chave) do nothing;
$$;

-- ---------------------------------------------------------------- "Visto" do responsável
alter table agenda_registros add constraint agenda_registros_id_escola_key unique (id, escola_id);

-- Registro que o responsável pode ver: dia visível para ele e campo visível à família.
create or replace function fn_registro_visivel_responsavel(p_registro uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from agenda_registros r
    join agenda_campos c on c.id = r.campo_id
    where r.id = p_registro and c.visivel_responsavel and fn_dia_visivel_responsavel(r.agenda_dia_id)
  );
$$;

create or replace function fn_registro_pede_visto(p_registro uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from agenda_registros r join agenda_campos c on c.id = r.campo_id
    where r.id = p_registro and c.pede_visto
  );
$$;

create table agenda_vistos (
  registro_id uuid not null,
  escola_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  visto_em timestamptz not null default now(),
  primary key (registro_id, user_id),
  foreign key (registro_id, escola_id) references agenda_registros(id, escola_id) on delete cascade
);

-- quem e quando: sempre do servidor (regra 5)
create or replace function trg_visto_autoria()
returns trigger language plpgsql as $$
begin
  new.user_id := coalesce(auth.uid(), new.user_id);
  new.visto_em := now();
  return new;
end $$;

create trigger agenda_vistos_autoria
before insert on agenda_vistos
for each row execute function trg_visto_autoria();

alter table agenda_vistos enable row level security;

create policy vistos_select on agenda_vistos for select
  using (user_id = auth.uid() or fn_e_equipe(escola_id));
create policy vistos_insert on agenda_vistos for insert
  with check (
    user_id = auth.uid()
    and fn_registro_visivel_responsavel(registro_id)
    and fn_registro_pede_visto(registro_id)
  );
