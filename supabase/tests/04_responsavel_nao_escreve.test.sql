-- Responsável não escreve na agenda (nem em cadastros da escola).
begin;
\ir _fixtures.psql
select plan(11);

select id as dia_a1 from agenda_dias
where crianca_id = 'aaaaaaaa-3333-0000-0000-000000000001' and data = current_date \gset
select id as campo_nota from agenda_campos
where escola_id = 'aaaaaaaa-1111-0000-0000-000000000000' and chave = 'nota' \gset

select testes.entrar('aaaaaaaa-0000-0000-0000-000000000004'); -- pai da a1

select throws_ok(
  format($$ insert into agenda_registros (escola_id, agenda_dia_id, campo_id, valor)
            values ('aaaaaaaa-1111-0000-0000-000000000000', %L, %L, '{"texto": "x"}') $$,
         :'dia_a1', :'campo_nota'),
  '42501', null, 'pai não insere registro na agenda do filho');
select results_eq(
  format($$ with u as (update agenda_registros set valor = '{"opcao": "Recusou"}'
                       where agenda_dia_id = %L returning 1)
            select count(*)::int from u $$, :'dia_a1'),
  $$ values (0) $$, 'pai não altera registro');
select results_eq(
  format($$ with u as (delete from agenda_registros where agenda_dia_id = %L returning 1)
            select count(*)::int from u $$, :'dia_a1'),
  $$ values (0) $$, 'pai não apaga registro');
select throws_ok(
  $$ insert into agenda_dias (escola_id, crianca_id, data)
     values ('aaaaaaaa-1111-0000-0000-000000000000', 'aaaaaaaa-3333-0000-0000-000000000001', current_date + 1) $$,
  '42501', null, 'pai não cria dia de agenda');
select results_eq(
  format($$ with u as (update agenda_dias set status = 'finalizado' where id = %L returning 1)
            select count(*)::int from u $$, :'dia_a1'),
  $$ values (0) $$, 'pai não finaliza o dia');
select throws_ok(
  $$ insert into turma_dias (escola_id, turma_id, data, mural)
     values ('aaaaaaaa-1111-0000-0000-000000000000', 'aaaaaaaa-2222-0000-0000-000000000001', current_date + 1, 'x') $$,
  '42501', null, 'pai não escreve no mural da turma');
select results_eq(
  $$ with u as (update turma_dias set mural = 'pai' returning 1) select count(*)::int from u $$,
  $$ values (0) $$, 'pai não altera o mural');
select throws_ok(
  format($$ select registrar_em_lote('aaaaaaaa-2222-0000-0000-000000000001', current_date + 1, %L, '{"texto": "x"}') $$,
         :'campo_nota'),
  '42501', null, 'pai não usa o registro em lote');
select results_eq(
  $$ with u as (update criancas set nome = 'Outro nome' returning 1) select count(*)::int from u $$,
  $$ values (0) $$, 'pai não altera cadastro da criança');
select throws_ok(
  $$ insert into responsaveis_criancas (crianca_id, escola_id, user_id)
     values ('aaaaaaaa-3333-0000-0000-000000000002', 'aaaaaaaa-1111-0000-0000-000000000000',
             'aaaaaaaa-0000-0000-0000-000000000004') $$,
  '42501', null, 'pai não se vincula a outra criança');

select testes.sair();
select is((select count(*)::int from agenda_registros where agenda_dia_id = :'dia_a1'), 2,
  'registros do dia continuam os mesmos (almoço + medicação)');

select * from finish();
rollback;
