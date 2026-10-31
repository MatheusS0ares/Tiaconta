-- Responsável só enxerga o próprio filho (e só o que é visível para a família).
begin;
\ir _fixtures.psql
select plan(14);

select testes.entrar('aaaaaaaa-0000-0000-0000-000000000004'); -- pai da criança a1

select results_eq($$ select id from criancas $$,
  $$ values ('aaaaaaaa-3333-0000-0000-000000000001'::uuid) $$, 'pai vê só o próprio filho');
select is((select count(*)::int from responsaveis_criancas), 1, 'pai vê só o próprio vínculo');
select results_eq($$ select crianca_id from agenda_dias $$,
  $$ values ('aaaaaaaa-3333-0000-0000-000000000001'::uuid) $$, 'pai vê só o dia do próprio filho');
select results_eq(
  $$ select c.chave from agenda_registros r join agenda_campos c on c.id = r.campo_id $$,
  $$ values ('almoco') $$, 'pai vê só registros do filho, sem campos ocultos (medicação)');
select is((select count(*)::int from turmas), 1, 'pai vê só a turma do filho');
select is((select count(*)::int from turmas where escola_id = 'bbbbbbbb-1111-0000-0000-000000000000'), 0, 'pai não vê turmas de outra escola');
select is((select count(*)::int from criancas where escola_id = 'bbbbbbbb-1111-0000-0000-000000000000'), 0, 'pai não vê crianças de outra escola');

-- leitura: pode marcar a do próprio filho, não a de outra criança
select lives_ok(
  $$ insert into agenda_leituras (agenda_dia_id, escola_id)
     select id, escola_id from agenda_dias where crianca_id = 'aaaaaaaa-3333-0000-0000-000000000001' $$,
  'pai confirma leitura do dia do filho');
select testes.sair();
select id as dia_a2 from agenda_dias where crianca_id = 'aaaaaaaa-3333-0000-0000-000000000002' \gset
select testes.entrar('aaaaaaaa-0000-0000-0000-000000000004');
select throws_ok(
  format($$ insert into agenda_leituras (agenda_dia_id, escola_id) values (%L, %L) $$,
    :'dia_a2', 'aaaaaaaa-1111-0000-0000-000000000000'),
  '42501', null, 'pai não confirma leitura de criança que não é dele');

-- outro responsável enxerga só o filho dele
select testes.entrar('aaaaaaaa-0000-0000-0000-000000000005');
select results_eq($$ select id from criancas $$,
  $$ values ('aaaaaaaa-3333-0000-0000-000000000002'::uuid) $$, 'mãe da a2 vê só a a2');
select is((select count(*)::int from agenda_leituras), 0, 'mãe da a2 não vê leituras de outros pais');

-- escola que só mostra a agenda depois de finalizada
select testes.sair();
update escolas set agenda_visivel_antes_finalizar = false where id = 'aaaaaaaa-1111-0000-0000-000000000000';
select testes.entrar('aaaaaaaa-0000-0000-0000-000000000004');
select is((select count(*)::int from agenda_dias), 0, 'dia em rascunho fica oculto quando a escola exige finalizar');
select is((select count(*)::int from agenda_registros), 0, 'registros em rascunho ficam ocultos quando a escola exige finalizar');

select testes.sair();
update agenda_dias set status = 'finalizado' where crianca_id = 'aaaaaaaa-3333-0000-0000-000000000001';
select testes.entrar('aaaaaaaa-0000-0000-0000-000000000004');
select is((select count(*)::int from agenda_dias), 1, 'dia finalizado aparece para o pai');

select * from finish();
rollback;
