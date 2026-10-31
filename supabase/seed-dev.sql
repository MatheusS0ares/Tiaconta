-- seed-dev.sql — dados FICTÍCIOS só para desenvolvimento local (supabase db reset).
-- Nunca rodar em produção. Roda depois de seed.sql (ver supabase/config.toml).
-- Login local: link mágico para qualquer e-mail abaixo; o e-mail chega no
-- Mailpit (http://127.0.0.1:54324).
--
--   gestora@abc.exemplo        gestor       Escolinha ABC
--   ana@abc.exemplo            professora   Berçário I
--   bia@abc.exemplo            professora   Maternal I
--   pai.davi@exemplo.com       responsavel  Davi (Berçário I)
--   mae.lara@exemplo.com       responsavel  Lara e Theo (irmãos, turmas diferentes)
--   gestor@outra.exemplo       gestor       Escola Outra (para testar isolamento)
--   (ana também é professora na Escola Outra, para testar a escolha de escola)

-- ---------------------------------------------------------------- usuários (auth)
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email, '',
  now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
from (values
  ('d0000000-0000-0000-0000-000000000001'::uuid, 'gestora@abc.exemplo'),
  ('d0000000-0000-0000-0000-000000000002'::uuid, 'ana@abc.exemplo'),
  ('d0000000-0000-0000-0000-000000000003'::uuid, 'bia@abc.exemplo'),
  ('d0000000-0000-0000-0000-000000000004'::uuid, 'pai.davi@exemplo.com'),
  ('d0000000-0000-0000-0000-000000000005'::uuid, 'mae.lara@exemplo.com'),
  ('d0000000-0000-0000-0000-000000000006'::uuid, 'gestor@outra.exemplo')
) as u(id, email)
on conflict (id) do nothing;

insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text, 'email',
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       now(), now(), now()
from auth.users u
where u.id::text like 'd0000000-%'
on conflict do nothing;

insert into perfis (user_id, nome, telefone) values
  ('d0000000-0000-0000-0000-000000000001', 'Gestora Exemplo', null),
  ('d0000000-0000-0000-0000-000000000002', 'Ana Exemplo', null),
  ('d0000000-0000-0000-0000-000000000003', 'Bia Exemplo', null),
  ('d0000000-0000-0000-0000-000000000004', 'Pai do Davi', '(61) 90000-0004'),
  ('d0000000-0000-0000-0000-000000000005', 'Mãe da Lara', '(61) 90000-0005'),
  ('d0000000-0000-0000-0000-000000000006', 'Gestor Outra', null)
on conflict (user_id) do nothing;

-- ---------------------------------------------------------------- outra escola
insert into escolas (id, nome, slug, cor_primaria)
values ('e0000000-0000-0000-0000-000000000002', 'Escola Outra (exemplo)', 'escola-outra', '#157A52')
on conflict (slug) do nothing;
select criar_campos_padrao('e0000000-0000-0000-0000-000000000002');

-- ---------------------------------------------------------------- membros
insert into membros (escola_id, user_id, papel)
select e.id, m.user_id, m.papel::papel_membro
from escolas e
join (values
  ('escolinha-abc', 'd0000000-0000-0000-0000-000000000001'::uuid, 'gestor'),
  ('escolinha-abc', 'd0000000-0000-0000-0000-000000000002'::uuid, 'professora'),
  ('escolinha-abc', 'd0000000-0000-0000-0000-000000000003'::uuid, 'professora'),
  ('escolinha-abc', 'd0000000-0000-0000-0000-000000000004'::uuid, 'responsavel'),
  ('escolinha-abc', 'd0000000-0000-0000-0000-000000000005'::uuid, 'responsavel'),
  ('escola-outra',  'd0000000-0000-0000-0000-000000000006'::uuid, 'gestor'),
  ('escola-outra',  'd0000000-0000-0000-0000-000000000002'::uuid, 'professora')
) as m(slug, user_id, papel) on m.slug = e.slug
on conflict do nothing;

-- ---------------------------------------------------------------- turmas
insert into turmas (id, escola_id, nome, faixa)
select t.id, e.id, t.nome, t.faixa::faixa_etaria
from escolas e
join (values
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'Berçário I', 'bercario'),
  ('a0000000-0000-0000-0000-000000000002'::uuid, 'Maternal I', 'maternal')
) as t(id, nome, faixa) on true
where e.slug = 'escolinha-abc'
on conflict do nothing;

insert into turma_professoras (turma_id, escola_id, user_id)
select t.id, t.escola_id, p.user_id
from turmas t
join (values
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'd0000000-0000-0000-0000-000000000002'::uuid),
  ('a0000000-0000-0000-0000-000000000002'::uuid, 'd0000000-0000-0000-0000-000000000003'::uuid)
) as p(turma_id, user_id) on p.turma_id = t.id
on conflict do nothing;

-- ---------------------------------------------------------------- crianças
insert into criancas (id, escola_id, turma_id, nome, data_nascimento, autoriza_imagem)
select c.id, e.id, c.turma_id, c.nome, c.nasc, c.img
from escolas e
join (values
  ('c0000000-0000-0000-0000-000000000001'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'Davi Exemplo',   date '2025-03-10', true),
  ('c0000000-0000-0000-0000-000000000002'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'Theo Exemplo',   date '2025-05-22', false),
  ('c0000000-0000-0000-0000-000000000003'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'Alice Exemplo',  date '2025-01-04', true),
  ('c0000000-0000-0000-0000-000000000004'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'Miguel Exemplo', date '2025-07-15', true),
  ('c0000000-0000-0000-0000-000000000005'::uuid, 'a0000000-0000-0000-0000-000000000002'::uuid, 'Lara Exemplo',   date '2023-09-02', true),
  ('c0000000-0000-0000-0000-000000000006'::uuid, 'a0000000-0000-0000-0000-000000000002'::uuid, 'Helena Exemplo', date '2023-11-19', true),
  ('c0000000-0000-0000-0000-000000000007'::uuid, 'a0000000-0000-0000-0000-000000000002'::uuid, 'Gael Exemplo',   date '2023-06-30', false)
) as c(id, turma_id, nome, nasc, img) on true
where e.slug = 'escolinha-abc'
on conflict do nothing;

insert into responsaveis_criancas (crianca_id, escola_id, user_id, parentesco)
select r.crianca_id, c.escola_id, r.user_id, r.parentesco
from criancas c
join (values
  ('c0000000-0000-0000-0000-000000000001'::uuid, 'd0000000-0000-0000-0000-000000000004'::uuid, 'pai'),
  ('c0000000-0000-0000-0000-000000000005'::uuid, 'd0000000-0000-0000-0000-000000000005'::uuid, 'mãe'),
  ('c0000000-0000-0000-0000-000000000002'::uuid, 'd0000000-0000-0000-0000-000000000005'::uuid, 'mãe')
) as r(crianca_id, user_id, parentesco) on r.crianca_id = c.id
on conflict do nothing;
