-- Convites: só o gestor da escola cria/vê; aceite cria membro e vínculo; uso único.
begin;
\ir _fixtures.psql
select plan(22);

insert into auth.users (id, email, aud, role) values
  ('cccccccc-0000-0000-0000-000000000001', 'nova_mae@teste', 'authenticated', 'authenticated'),
  ('cccccccc-0000-0000-0000-000000000002', 'nova_prof@teste', 'authenticated', 'authenticated'),
  ('cccccccc-0000-0000-0000-000000000003', 'curioso@teste', 'authenticated', 'authenticated');

-- gestor A cria convites
select testes.entrar('aaaaaaaa-0000-0000-0000-000000000001');
select lives_ok(
  $$ insert into convites (escola_id, papel, crianca_id, parentesco, token)
     values ('aaaaaaaa-1111-0000-0000-000000000000', 'responsavel', 'aaaaaaaa-3333-0000-0000-000000000003', 'mãe', 'tok-resp') $$,
  'gestor cria convite de responsável');
select lives_ok(
  $$ insert into convites (escola_id, papel, turma_id, token)
     values ('aaaaaaaa-1111-0000-0000-000000000000', 'professora', 'aaaaaaaa-2222-0000-0000-000000000001', 'tok-prof') $$,
  'gestor cria convite de professora com turma');
select is((select criado_por from convites where token = 'tok-resp'),
  'aaaaaaaa-0000-0000-0000-000000000001'::uuid, 'criado_por = gestor logado');
select throws_ok(
  $$ insert into convites (escola_id, papel, token) values ('aaaaaaaa-1111-0000-0000-000000000000', 'responsavel', 'x') $$,
  '23514', null, 'convite de responsável exige criança');
select throws_ok(
  $$ insert into convites (escola_id, papel, token) values ('aaaaaaaa-1111-0000-0000-000000000000', 'gestor', 'x') $$,
  '23514', null, 'não existe convite de gestor');
select throws_ok(
  $$ insert into convites (escola_id, papel, crianca_id, token)
     values ('aaaaaaaa-1111-0000-0000-000000000000', 'responsavel', 'bbbbbbbb-3333-0000-0000-000000000001', 'x') $$,
  '23503', null, 'não convida responsável para criança de outra escola');

-- outros papéis/escolas não criam nem veem
select testes.entrar('aaaaaaaa-0000-0000-0000-000000000002'); -- professora A
select is((select count(*)::int from convites), 0, 'professora não vê convites');
select throws_ok(
  $$ insert into convites (escola_id, papel, token) values ('aaaaaaaa-1111-0000-0000-000000000000', 'professora', 'x') $$,
  '42501', null, 'professora não cria convite');
select testes.entrar('aaaaaaaa-0000-0000-0000-000000000004'); -- pai A1
select throws_ok(
  $$ insert into convites (escola_id, papel, crianca_id, token)
     values ('aaaaaaaa-1111-0000-0000-000000000000', 'responsavel', 'aaaaaaaa-3333-0000-0000-000000000002', 'x') $$,
  '42501', null, 'responsável não cria convite');
select testes.entrar('bbbbbbbb-0000-0000-0000-000000000001'); -- gestor B
select is((select count(*)::int from convites), 0, 'gestor de outra escola não vê convites de A');
select throws_ok(
  $$ insert into convites (escola_id, papel, token) values ('aaaaaaaa-1111-0000-0000-000000000000', 'professora', 'x') $$,
  '42501', null, 'gestor B não cria convite na escola A');

-- ver_convite: dados mínimos, mesmo sem login
select testes.sair();
set local role anon;
select results_eq($$ select escola_slug, papel::text, crianca_nome, situacao from ver_convite('tok-resp') $$,
  $$ values ('teste-escola-a', 'responsavel', 'Criança A3', 'valido') $$, 'ver_convite mostra escola e criança');
select throws_ok($$ select aceitar_convite('tok-resp') $$, '42501', null, 'anônimo não aceita convite');
reset role;

-- nova mãe aceita
select testes.entrar('cccccccc-0000-0000-0000-000000000001');
select is((select count(*)::int from criancas), 0, 'antes de aceitar, não vê nenhuma criança');
select is(aceitar_convite('tok-resp'), 'teste-escola-a', 'aceitar devolve o slug da escola');
select results_eq($$ select id from criancas $$,
  $$ values ('aaaaaaaa-3333-0000-0000-000000000003'::uuid) $$, 'depois de aceitar, vê só a criança do convite');
select is(aceitar_convite('tok-resp'), 'teste-escola-a', 'tocar de novo no mesmo convite é idempotente');

-- outra pessoa tenta reusar o link
select testes.entrar('cccccccc-0000-0000-0000-000000000003');
select throws_ok($$ select aceitar_convite('tok-resp') $$, 'P0001', 'convite_usado', 'convite é de uso único');
select is((select count(*)::int from criancas), 0, 'quem reusa o link não ganha acesso');
select throws_ok($$ select aceitar_convite('nao-existe') $$, 'P0001', 'convite_invalido', 'token inexistente é rejeitado');

-- professora aceita: vira membro e é vinculada à turma
select testes.entrar('cccccccc-0000-0000-0000-000000000002');
select is(aceitar_convite('tok-prof'), 'teste-escola-a', 'professora aceita convite');
select testes.sair();
select ok(exists(select 1 from turma_professoras where user_id = 'cccccccc-0000-0000-0000-000000000002'
  and turma_id = 'aaaaaaaa-2222-0000-0000-000000000001'), 'professora vinculada à turma do convite');

select * from finish();
rollback;
