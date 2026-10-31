-- Fotos das crianças: bucket privado; vê só equipe e responsável da criança; só gestor envia.
begin;
\ir _fixtures.psql
select plan(16);

-- A Storage API liga esta flag antes de apagar; aqui fazemos o mesmo para
-- que só o RLS decida quem pode apagar.
select set_config('storage.allow_delete_query', 'true', true);

select ok(not (select public from storage.buckets where id = 'criancas-fotos'), 'bucket criancas-fotos é privado');

insert into storage.objects (bucket_id, name) values
  ('criancas-fotos', 'aaaaaaaa-1111-0000-0000-000000000000/aaaaaaaa-3333-0000-0000-000000000001/a1.jpg'),
  ('criancas-fotos', 'aaaaaaaa-1111-0000-0000-000000000000/aaaaaaaa-3333-0000-0000-000000000002/a2.jpg'),
  ('criancas-fotos', 'bbbbbbbb-1111-0000-0000-000000000000/bbbbbbbb-3333-0000-0000-000000000001/b1.jpg'),
  -- caminho forjado: pasta da escola A com criança da escola B
  ('criancas-fotos', 'aaaaaaaa-1111-0000-0000-000000000000/bbbbbbbb-3333-0000-0000-000000000001/forjada.jpg');

select testes.entrar('aaaaaaaa-0000-0000-0000-000000000004'); -- pai A1
select set_eq($$ select name from storage.objects where bucket_id = 'criancas-fotos' $$,
  array['aaaaaaaa-1111-0000-0000-000000000000/aaaaaaaa-3333-0000-0000-000000000001/a1.jpg'],
  'pai vê só a foto do próprio filho');

select testes.entrar('aaaaaaaa-0000-0000-0000-000000000002'); -- professora A
select set_eq($$ select name from storage.objects where bucket_id = 'criancas-fotos' $$,
  array['aaaaaaaa-1111-0000-0000-000000000000/aaaaaaaa-3333-0000-0000-000000000001/a1.jpg',
        'aaaaaaaa-1111-0000-0000-000000000000/aaaaaaaa-3333-0000-0000-000000000002/a2.jpg'],
  'professora vê as fotos da escola (e não a forjada)');
select throws_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('criancas-fotos', 'aaaaaaaa-1111-0000-0000-000000000000/aaaaaaaa-3333-0000-0000-000000000003/x.jpg') $$,
  '42501', null, 'professora não envia foto');

select testes.entrar('bbbbbbbb-0000-0000-0000-000000000001'); -- gestor B
select set_eq($$ select name from storage.objects where bucket_id = 'criancas-fotos' $$,
  array['bbbbbbbb-1111-0000-0000-000000000000/bbbbbbbb-3333-0000-0000-000000000001/b1.jpg'],
  'gestor B vê só fotos da escola B');
select throws_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('criancas-fotos', 'aaaaaaaa-1111-0000-0000-000000000000/aaaaaaaa-3333-0000-0000-000000000003/x.jpg') $$,
  '42501', null, 'gestor B não envia foto para a escola A');
select results_eq(
  $$ with u as (delete from storage.objects where name like 'aaaaaaaa-1111%' returning 1) select count(*)::int from u $$,
  $$ values (0) $$, 'gestor B não apaga fotos da escola A');

select testes.entrar('aaaaaaaa-0000-0000-0000-000000000001'); -- gestor A
select lives_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('criancas-fotos', 'aaaaaaaa-1111-0000-0000-000000000000/aaaaaaaa-3333-0000-0000-000000000003/a3.jpg') $$,
  'gestor A envia foto de criança da escola A');
select throws_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('criancas-fotos', 'aaaaaaaa-1111-0000-0000-000000000000/bbbbbbbb-3333-0000-0000-000000000001/y.jpg') $$,
  '42501', null, 'gestor A não grava foto de criança de outra escola na própria pasta');
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('criancas-fotos', 'qualquer/coisa.jpg') $$,
  '42501', null, 'caminho fora do padrão é recusado');
select throws_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('criancas-fotos', 'aaaaaaaa-1111-0000-0000-000000000000/aaaaaaaa-3333-0000-0000-000000000003/sub/z.jpg') $$,
  '42501', null, 'subpastas extras são recusadas');
select results_eq(
  $$ with u as (delete from storage.objects
                where name = 'aaaaaaaa-1111-0000-0000-000000000000/aaaaaaaa-3333-0000-0000-000000000002/a2.jpg' returning 1)
     select count(*)::int from u $$,
  $$ values (1) $$, 'gestor A apaga foto da escola A');

select testes.entrar('aaaaaaaa-0000-0000-0000-000000000004'); -- pai A1
select throws_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('criancas-fotos', 'aaaaaaaa-1111-0000-0000-000000000000/aaaaaaaa-3333-0000-0000-000000000001/novo.jpg') $$,
  '42501', null, 'pai não envia foto');
select results_eq(
  $$ with u as (delete from storage.objects where bucket_id = 'criancas-fotos' returning 1) select count(*)::int from u $$,
  $$ values (0) $$, 'pai não apaga foto');
select results_eq(
  $$ with u as (update storage.objects set name = name || '.bak' where bucket_id = 'criancas-fotos' returning 1)
     select count(*)::int from u $$,
  $$ values (0) $$, 'pai não renomeia foto');

select testes.sair();
set local role anon;
select is((select count(*)::int from storage.objects where bucket_id = 'criancas-fotos'), 0, 'anônimo não vê nenhuma foto');
reset role;

select * from finish();
rollback;
