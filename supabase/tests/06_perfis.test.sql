-- Perfis: responsável vê a equipe, nunca outros pais; outra escola não vê ninguém.
begin;
\ir _fixtures.psql
select plan(9);

select testes.entrar('aaaaaaaa-0000-0000-0000-000000000004'); -- pai A1
select set_eq($$ select nome from perfis $$,
  array['Pai A1', 'Gestor A', 'Prof A', 'Prof A2'], 'pai vê o próprio perfil e a equipe da escola');
select is((select count(*)::int from perfis where nome = 'Mãe A2'), 0, 'pai não vê perfil de outro responsável');
select is((select count(*)::int from perfis where nome like '% B'), 0, 'pai não vê perfis de outra escola');

select testes.entrar('aaaaaaaa-0000-0000-0000-000000000002'); -- professora A
select set_eq($$ select nome from perfis $$,
  array['Gestor A', 'Prof A', 'Prof A2', 'Pai A1', 'Mãe A2'], 'professora vê todos da própria escola');

select testes.entrar('bbbbbbbb-0000-0000-0000-000000000001'); -- gestor B
select set_eq($$ select nome from perfis $$, array['Gestor B', 'Prof B'], 'gestor B vê só a escola B');

-- consentimento e edição do próprio perfil
select testes.entrar('aaaaaaaa-0000-0000-0000-000000000004');
select results_eq(
  $$ with u as (update perfis set consentimento_em = now() where user_id = auth.uid() returning 1)
     select count(*)::int from u $$,
  $$ values (1) $$, 'pai registra o próprio consentimento');
select results_eq(
  $$ with u as (update perfis set nome = 'hackeado' where nome = 'Prof A' returning 1)
     select count(*)::int from u $$,
  $$ values (0) $$, 'pai não altera perfil de outra pessoa');
select throws_ok(
  $$ update perfis set user_id = 'aaaaaaaa-0000-0000-0000-000000000005' where user_id = auth.uid() $$,
  '42501', null, 'pai não transfere o próprio perfil para outro usuário');
select throws_ok(
  $$ insert into perfis (user_id, nome) values ('aaaaaaaa-0000-0000-0000-000000000005', 'falso') $$,
  '42501', null, 'ninguém cria perfil em nome de outro usuário');

select * from finish();
rollback;
