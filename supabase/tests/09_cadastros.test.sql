-- Cadastros da gestão (turmas, crianças, campos, vínculos): só o gestor escreve.
begin;
\ir _fixtures.psql
select plan(14);

-- gestor A
select testes.entrar('aaaaaaaa-0000-0000-0000-000000000001');
select lives_ok($$ insert into turmas (escola_id, nome, faixa) values ('aaaaaaaa-1111-0000-0000-000000000000', 'Nova', 'maternal') $$,
  'gestor cria turma');
select results_eq(
  $$ with u as (update turmas set ativa = false where nome = 'Nova' returning 1) select count(*)::int from u $$,
  $$ values (1) $$, 'gestor arquiva turma');
select lives_ok($$ insert into turma_professoras (turma_id, escola_id, user_id)
  values ('aaaaaaaa-2222-0000-0000-000000000001', 'aaaaaaaa-1111-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000003') $$,
  'gestor vincula professora à turma');
select results_eq(
  $$ with u as (update criancas set autoriza_imagem = true, observacoes_saude = 'Alergia a leite'
                where id = 'aaaaaaaa-3333-0000-0000-000000000003' returning 1) select count(*)::int from u $$,
  $$ values (1) $$, 'gestor edita criança (autorização de imagem e saúde)');
select results_eq(
  $$ with u as (update agenda_campos set ativo = false, ordem = 999
                where escola_id = 'aaaaaaaa-1111-0000-0000-000000000000' and chave = 'jantar' returning 1)
     select count(*)::int from u $$,
  $$ values (1) $$, 'gestor desliga e reordena campo da agenda');
select results_eq(
  $$ with u as (delete from responsaveis_criancas
                where crianca_id = 'aaaaaaaa-3333-0000-0000-000000000002' returning 1) select count(*)::int from u $$,
  $$ values (1) $$, 'gestor remove vínculo de responsável');
select results_eq(
  $$ with u as (update membros set ativo = false
                where user_id = 'aaaaaaaa-0000-0000-0000-000000000005' and escola_id = 'aaaaaaaa-1111-0000-0000-000000000000' returning 1)
     select count(*)::int from u $$,
  $$ values (1) $$, 'gestor desativa membro');

-- professora A
select testes.entrar('aaaaaaaa-0000-0000-0000-000000000002');
select throws_ok($$ insert into turmas (escola_id, nome, faixa) values ('aaaaaaaa-1111-0000-0000-000000000000', 'X', 'maternal') $$,
  '42501', null, 'professora não cria turma');
select results_eq(
  $$ with u as (update criancas set nome = 'X' returning 1) select count(*)::int from u $$,
  $$ values (0) $$, 'professora não edita criança');
select results_eq(
  $$ with u as (update agenda_campos set ativo = false returning 1) select count(*)::int from u $$,
  $$ values (0) $$, 'professora não altera campos da agenda');
select results_eq(
  $$ with u as (delete from responsaveis_criancas returning 1) select count(*)::int from u $$,
  $$ values (0) $$, 'professora não remove vínculos');

-- gestor B na escola A
select testes.entrar('bbbbbbbb-0000-0000-0000-000000000001');
select results_eq(
  $$ with u as (update agenda_campos set rotulo = 'X' where escola_id = 'aaaaaaaa-1111-0000-0000-000000000000' returning 1)
     select count(*)::int from u $$,
  $$ values (0) $$, 'gestor B não altera campos da escola A');
select throws_ok(
  $$ insert into turma_professoras (turma_id, escola_id, user_id)
     values ('aaaaaaaa-2222-0000-0000-000000000001', 'aaaaaaaa-1111-0000-0000-000000000000', 'bbbbbbbb-0000-0000-0000-000000000002') $$,
  '42501', null, 'gestor B não vincula professora em turma da escola A');
select throws_ok(
  $$ insert into criancas (escola_id, turma_id, nome)
     values ('bbbbbbbb-1111-0000-0000-000000000000', 'aaaaaaaa-2222-0000-0000-000000000001', 'Cruzada') $$,
  '23503', null, 'criança da escola B não entra em turma da escola A');

select * from finish();
rollback;
