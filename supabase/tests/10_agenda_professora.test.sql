-- Etapa 4: professora da turma, registro individual/lote idempotentes, validação, falta, finalização, mural.
begin;
\ir _fixtures.psql
select plan(30);

select id as c_almoco from agenda_campos where escola_id = 'aaaaaaaa-1111-0000-0000-000000000000' and chave = 'almoco' \gset
select id as c_lanche from agenda_campos where escola_id = 'aaaaaaaa-1111-0000-0000-000000000000' and chave = 'lanche_tarde' \gset
select id as c_sono from agenda_campos where escola_id = 'aaaaaaaa-1111-0000-0000-000000000000' and chave = 'sono' \gset
select id as c_fralda from agenda_campos where escola_id = 'aaaaaaaa-1111-0000-0000-000000000000' and chave = 'fralda' \gset
select id as c_nota from agenda_campos where escola_id = 'aaaaaaaa-1111-0000-0000-000000000000' and chave = 'nota' \gset
select id as c_trazer from agenda_campos where escola_id = 'aaaaaaaa-1111-0000-0000-000000000000' and chave = 'trazer' \gset

-- ---------------------------------------------------------------- professora fora da turma
select testes.entrar('aaaaaaaa-0000-0000-0000-000000000003'); -- prof A2 (sem turma)
select throws_ok(format($$ select registrar_em_lote('aaaaaaaa-2222-0000-0000-000000000001', current_date, %L, '{"opcao":"Comeu tudo"}') $$, :'c_lanche'),
  '42501', null, 'professora de fora da turma não registra em lote');
select throws_ok(format($$ select registrar(gen_random_uuid(), 'aaaaaaaa-3333-0000-0000-000000000001', current_date, %L, '{"texto":"oi"}') $$, :'c_nota'),
  '42501', null, 'professora de fora da turma não registra individual');
select throws_ok($$ select salvar_mural('aaaaaaaa-2222-0000-0000-000000000001', current_date, 'x') $$,
  '42501', null, 'professora de fora da turma não escreve no mural');
select throws_ok($$ select finalizar_dia_turma('aaaaaaaa-2222-0000-0000-000000000001', current_date) $$,
  '42501', null, 'professora de fora da turma não finaliza a turma');
select is((select count(*)::int from agenda_registros where escola_id = 'aaaaaaaa-1111-0000-0000-000000000000'), 4,
  'professora de fora da turma ainda LÊ a agenda da escola');

-- ---------------------------------------------------------------- registro individual
select testes.entrar('aaaaaaaa-0000-0000-0000-000000000002'); -- prof A (da turma)
select is(registrar('dddddddd-0000-0000-0000-000000000001', 'aaaaaaaa-3333-0000-0000-000000000001', current_date, :'c_fralda', '{"hora":"09:15","opcao":"Xixi"}'),
  'dddddddd-0000-0000-0000-000000000001'::uuid, 'registrar devolve o id gerado no cliente');
select is(registrar('dddddddd-0000-0000-0000-000000000001', 'aaaaaaaa-3333-0000-0000-000000000001', current_date, :'c_fralda', '{"hora":"09:15","opcao":"Xixi"}'),
  'dddddddd-0000-0000-0000-000000000001'::uuid, 'reenviar o mesmo id (fila offline) não falha');
select is((select count(*)::int from agenda_registros where campo_id = :'c_fralda'), 1, 'reenvio não duplica');
select lives_ok(format($$ select registrar(gen_random_uuid(), 'aaaaaaaa-3333-0000-0000-000000000001', current_date, %L, '{"hora":"11:00","opcao":"Cocô"}') $$, :'c_fralda'),
  'campo múltiplo aceita outra troca');
select is((select count(*)::int from agenda_registros where campo_id = :'c_fralda'), 2, 'campo múltiplo guarda as duas trocas');

-- exceção sobre o lote (campo de valor único): atualiza a linha existente
select registrar(gen_random_uuid(), 'aaaaaaaa-3333-0000-0000-000000000001', current_date, :'c_almoco', '{"opcao":"Recusou"}');
select results_eq(format($$ select valor->>'opcao', lote_id is null from agenda_registros r join agenda_dias d on d.id = r.agenda_dia_id
                            where d.crianca_id = 'aaaaaaaa-3333-0000-0000-000000000001' and r.campo_id = %L $$, :'c_almoco'),
  $$ values ('Recusou', true) $$, 'exceção substitui o valor do lote na mesma linha');

-- ---------------------------------------------------------------- validação do valor
select throws_ok(format($$ select registrar(gen_random_uuid(), 'aaaaaaaa-3333-0000-0000-000000000002', current_date, %L, '{"opcao":"Inventado"}') $$, :'c_lanche'),
  '22023', 'valor_invalido', 'opção fora da lista é recusada');
select throws_ok(format($$ select registrar(gen_random_uuid(), 'aaaaaaaa-3333-0000-0000-000000000002', current_date, %L, '{"hora":"25:00","opcao":"Xixi"}') $$, :'c_fralda'),
  '22023', 'valor_invalido', 'hora inválida é recusada');
select throws_ok(format($$ select registrar(gen_random_uuid(), 'aaaaaaaa-3333-0000-0000-000000000002', current_date, %L, '{"texto":""}') $$, :'c_nota'),
  '22023', 'valor_invalido', 'texto vazio é recusado');
select throws_ok(format($$ select registrar(gen_random_uuid(), 'aaaaaaaa-3333-0000-0000-000000000002', current_date, %L, '{"itens":["Bicicleta"]}') $$, :'c_trazer'),
  '22023', 'valor_invalido', 'item fora do checklist é recusado');
select lives_ok(format($$ select registrar(gen_random_uuid(), 'aaaaaaaa-3333-0000-0000-000000000002', current_date, %L, '{"inicio":"12:10","fim":null}') $$, :'c_sono'),
  'sono sem horário de fim ("ainda dormindo") é aceito');

-- ---------------------------------------------------------------- lote
select registrar(gen_random_uuid(), 'aaaaaaaa-3333-0000-0000-000000000002', current_date, :'c_lanche', '{"opcao":"Comeu pouco"}');
select is(registrar_em_lote('aaaaaaaa-2222-0000-0000-000000000001', current_date, :'c_lanche', '{"opcao":"Comeu tudo"}', '{}', 'eeeeeeee-0000-0000-0000-000000000001'),
  2, 'lote não sobrescreve a exceção já registrada (2 de 3)');
select is(registrar_em_lote('aaaaaaaa-2222-0000-0000-000000000001', current_date, :'c_lanche', '{"opcao":"Comeu tudo"}', '{}', 'eeeeeeee-0000-0000-0000-000000000001'),
  2, 'reenviar o mesmo lote é idempotente');
select is((select count(*)::int from agenda_registros where campo_id = :'c_lanche'), 3, 'sem duplicar registros');
select results_eq($$ with u as (delete from agenda_registros where lote_id = 'eeeeeeee-0000-0000-0000-000000000001' returning 1) select count(*)::int from u $$,
  $$ values (2) $$, 'desfazer o lote apaga só o que ele criou');
select results_eq(format($$ select valor->>'opcao' from agenda_registros where campo_id = %L $$, :'c_lanche'),
  $$ values ('Comeu pouco') $$, 'a exceção continua depois de desfazer o lote');

-- ---------------------------------------------------------------- falta
select lives_ok($$ select definir_falta('aaaaaaaa-3333-0000-0000-000000000003', current_date, true) $$, 'professora marca falta');
select is(registrar_em_lote('aaaaaaaa-2222-0000-0000-000000000001', current_date, :'c_sono', '{"inicio":"13:00","fim":"14:30"}'),
  2, 'lote pula a criança que faltou');

-- ---------------------------------------------------------------- mural
select lives_ok($$ select salvar_mural('aaaaaaaa-2222-0000-0000-000000000001', current_date, 'Hoje teve pintura!') $$, 'professora salva o mural');
select testes.sair();
select is((select autor from turma_dias where turma_id = 'aaaaaaaa-2222-0000-0000-000000000001' and data = current_date),
  'aaaaaaaa-0000-0000-0000-000000000002'::uuid, 'mural guarda a autora');
update escolas set agenda_visivel_antes_finalizar = false where id = 'aaaaaaaa-1111-0000-0000-000000000000';
select testes.entrar('aaaaaaaa-0000-0000-0000-000000000004'); -- pai A1
select is((select count(*)::int from turma_dias), 0, 'pai não vê o mural antes de finalizar (escola exige)');

-- ---------------------------------------------------------------- finalizar turma
select testes.entrar('aaaaaaaa-0000-0000-0000-000000000002');
select is(finalizar_dia_turma('aaaaaaaa-2222-0000-0000-000000000001', current_date), 3, 'finalizar a turma finaliza as 3 crianças (inclusive a falta)');
select throws_ok(format($$ select registrar(gen_random_uuid(), 'aaaaaaaa-3333-0000-0000-000000000001', current_date, %L, '{"opcao":"Comeu bem"}') $$, :'c_almoco'),
  'P0001', 'dia_finalizado', 'depois de finalizar, registrar avisa que o dia está fechado');
select testes.entrar('aaaaaaaa-0000-0000-0000-000000000004');
select is((select count(*)::int from turma_dias), 1, 'pai vê o mural depois que o dia do filho é finalizado');

-- gestor registra em qualquer turma e corrige dia finalizado
select testes.entrar('aaaaaaaa-0000-0000-0000-000000000001');
select lives_ok(format($$ select registrar(gen_random_uuid(), 'aaaaaaaa-3333-0000-0000-000000000001', current_date, %L, '{"opcao":"Comeu bem"}') $$, :'c_almoco'),
  'gestor corrige registro em dia finalizado');

select * from finish();
rollback;
