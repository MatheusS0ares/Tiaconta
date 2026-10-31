-- Professora não edita dia finalizado; gestor pode corrigir; finalização tem autor e horário.
begin;
\ir _fixtures.psql
select plan(13);

select id as campo_almoco from agenda_campos
where escola_id = 'aaaaaaaa-1111-0000-0000-000000000000' and chave = 'almoco' \gset
select id as campo_nota from agenda_campos
where escola_id = 'aaaaaaaa-1111-0000-0000-000000000000' and chave = 'nota' \gset
select id as dia_a1 from agenda_dias
where crianca_id = 'aaaaaaaa-3333-0000-0000-000000000001' and data = current_date \gset

select testes.entrar('aaaaaaaa-0000-0000-0000-000000000002'); -- professora A

select results_eq(
  format($$ with u as (update agenda_dias set status = 'finalizado' where id = %L returning 1)
            select count(*)::int from u $$, :'dia_a1'),
  $$ values (1) $$, 'professora finaliza o dia da criança');

select testes.sair();
select is((select finalizado_por from agenda_dias where id = :'dia_a1'),
  'aaaaaaaa-0000-0000-0000-000000000002'::uuid, 'finalizado_por = professora que finalizou');
select isnt((select finalizado_em from agenda_dias where id = :'dia_a1'), null, 'finalizado_em preenchido');

select testes.entrar('aaaaaaaa-0000-0000-0000-000000000002');
select results_eq(
  format($$ with u as (update agenda_registros set valor = '{"opcao": "Recusou"}'
                       where agenda_dia_id = %L returning 1)
            select count(*)::int from u $$, :'dia_a1'),
  $$ values (0) $$, 'professora não altera registro de dia finalizado');
select throws_ok(
  format($$ insert into agenda_registros (escola_id, agenda_dia_id, campo_id, valor)
            values ('aaaaaaaa-1111-0000-0000-000000000000', %L, %L, '{"texto": "depois"}') $$,
         :'dia_a1', :'campo_nota'),
  '42501', null, 'professora não insere registro em dia finalizado');
select results_eq(
  format($$ with u as (delete from agenda_registros where agenda_dia_id = %L returning 1)
            select count(*)::int from u $$, :'dia_a1'),
  $$ values (0) $$, 'professora não apaga registro de dia finalizado');
select results_eq(
  format($$ with u as (update agenda_dias set status = 'rascunho' where id = %L returning 1)
            select count(*)::int from u $$, :'dia_a1'),
  $$ values (0) $$, 'professora não reabre dia finalizado');
select results_eq(
  format($$ with u as (update agenda_dias set faltou = true where id = %L returning 1)
            select count(*)::int from u $$, :'dia_a1'),
  $$ values (0) $$, 'professora não marca falta em dia finalizado');
select is(
  registrar_em_lote('aaaaaaaa-2222-0000-0000-000000000001', current_date, :'campo_nota', '{"texto": "lote"}'),
  2, 'lote ignora a criança com dia finalizado (registra só nas outras 2)');

select testes.sair();
select is((select valor->>'opcao' from agenda_registros where agenda_dia_id = :'dia_a1' and campo_id = :'campo_almoco'),
  'Comeu tudo', 'valor do dia finalizado continua intacto');

-- gestor pode corrigir e reabrir
select testes.entrar('aaaaaaaa-0000-0000-0000-000000000001');
select results_eq(
  format($$ with u as (update agenda_registros set valor = '{"opcao": "Comeu bem"}'
                       where agenda_dia_id = %L and campo_id = %L returning 1)
            select count(*)::int from u $$, :'dia_a1', :'campo_almoco'),
  $$ values (1) $$, 'gestor corrige registro de dia finalizado');
select results_eq(
  format($$ with u as (update agenda_dias set status = 'rascunho' where id = %L returning 1)
            select count(*)::int from u $$, :'dia_a1'),
  $$ values (1) $$, 'gestor reabre o dia');
select testes.sair();
select is((select finalizado_por from agenda_dias where id = :'dia_a1'), null, 'reabrir limpa finalizado_por');

select * from finish();
rollback;
