-- Isolamento entre escolas: membro da escola B não enxerga nem altera nada da escola A.
begin;
\ir _fixtures.psql
select plan(17);

select testes.entrar('bbbbbbbb-0000-0000-0000-000000000001'); -- gestor da escola B

select is((select count(*)::int from escolas), 1, 'gestor B vê só a própria escola');
select is((select count(*)::int from escolas where id = 'aaaaaaaa-1111-0000-0000-000000000000'), 0, 'gestor B não vê a escola A');
select is((select count(*)::int from membros where escola_id = 'aaaaaaaa-1111-0000-0000-000000000000'), 0, 'gestor B não vê membros de A');
select is((select count(*)::int from turmas where escola_id = 'aaaaaaaa-1111-0000-0000-000000000000'), 0, 'gestor B não vê turmas de A');
select is((select count(*)::int from criancas where escola_id = 'aaaaaaaa-1111-0000-0000-000000000000'), 0, 'gestor B não vê crianças de A');
select is((select count(*)::int from responsaveis_criancas where escola_id = 'aaaaaaaa-1111-0000-0000-000000000000'), 0, 'gestor B não vê vínculos de A');
select is((select count(*)::int from agenda_campos where escola_id = 'aaaaaaaa-1111-0000-0000-000000000000'), 0, 'gestor B não vê campos de A');
select is((select count(*)::int from agenda_dias where escola_id = 'aaaaaaaa-1111-0000-0000-000000000000'), 0, 'gestor B não vê dias de A');
select is((select count(*)::int from agenda_registros where escola_id = 'aaaaaaaa-1111-0000-0000-000000000000'), 0, 'gestor B não vê registros de A');
select is((select count(*)::int from turma_dias where escola_id = 'aaaaaaaa-1111-0000-0000-000000000000'), 0, 'gestor B não vê mural de A');
select is((select count(*)::int from perfis p join membros m on m.user_id = p.user_id
           where m.escola_id = 'aaaaaaaa-1111-0000-0000-000000000000'), 0, 'gestor B não vê perfis de A');

select throws_ok(
  $$ insert into criancas (escola_id, turma_id, nome)
     values ('aaaaaaaa-1111-0000-0000-000000000000', 'aaaaaaaa-2222-0000-0000-000000000001', 'Intrusa') $$,
  '42501', null, 'gestor B não cria criança na escola A');

select throws_ok(
  $$ insert into membros (escola_id, user_id, papel)
     values ('aaaaaaaa-1111-0000-0000-000000000000', 'bbbbbbbb-0000-0000-0000-000000000001', 'gestor') $$,
  '42501', null, 'gestor B não se adiciona como membro da escola A');

select results_eq(
  $$ with u as (update criancas set nome = 'Alterada'
                where escola_id = 'aaaaaaaa-1111-0000-0000-000000000000' returning 1)
     select count(*)::int from u $$,
  $$ values (0) $$, 'gestor B não altera crianças de A');

select throws_ok(
  $$ select registrar_em_lote('aaaaaaaa-2222-0000-0000-000000000001', current_date,
       (select id from agenda_campos where escola_id = 'bbbbbbbb-1111-0000-0000-000000000000' and chave = 'almoco'),
       '{"opcao": "Recusou"}') $$,
  'P0001', 'Turma não encontrada', 'gestor B não registra em lote na turma de A');

-- professora da escola B também não enxerga A
select testes.entrar('bbbbbbbb-0000-0000-0000-000000000002');
select is((select count(*)::int from criancas where escola_id = 'aaaaaaaa-1111-0000-0000-000000000000'), 0, 'professora B não vê crianças de A');

-- e o caminho inverso: gestor A não enxerga B
select testes.entrar('aaaaaaaa-0000-0000-0000-000000000001');
select is((select count(*)::int from agenda_registros where escola_id = 'bbbbbbbb-1111-0000-0000-000000000000'), 0, 'gestor A não vê registros de B');

select * from finish();
rollback;
