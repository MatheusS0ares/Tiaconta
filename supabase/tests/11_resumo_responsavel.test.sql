-- Etapa 5: configuração do resumo (grupo/destaque/visto) e "Visto" do responsável.
begin;
\ir _fixtures.psql
select plan(13);

-- template padrão já vem configurado (dado, não código)
select results_eq(
  $$ select grupo::text, destaque, pede_visto from agenda_campos
     where escola_id = 'aaaaaaaa-1111-0000-0000-000000000000' and chave = 'trazer' $$,
  $$ values ('trazer', 'atencao', true) $$, 'trazer amanhã: card próprio, destaque de atenção e pede visto');
select is((select opcoes->'destaque_acima' from agenda_campos
           where escola_id = 'aaaaaaaa-1111-0000-0000-000000000000' and chave = 'temperatura'),
  '37.5'::jsonb, 'temperatura destaca acima de 37,5');

select id as c_trazer from agenda_campos where escola_id = 'aaaaaaaa-1111-0000-0000-000000000000' and chave = 'trazer' \gset
select id as c_almoco from agenda_campos where escola_id = 'aaaaaaaa-1111-0000-0000-000000000000' and chave = 'almoco' \gset

-- professora registra "trazer amanhã" para a1 e a2
select testes.entrar('aaaaaaaa-0000-0000-0000-000000000002');
select registrar('ffffffff-0000-0000-0000-000000000001', 'aaaaaaaa-3333-0000-0000-000000000001', current_date, :'c_trazer', '{"itens": ["Fralda"]}');
select registrar('ffffffff-0000-0000-0000-000000000002', 'aaaaaaaa-3333-0000-0000-000000000002', current_date, :'c_trazer', '{"itens": ["Pomada"]}');
select throws_ok($$ insert into agenda_vistos (registro_id, escola_id)
                    values ('ffffffff-0000-0000-0000-000000000001', 'aaaaaaaa-1111-0000-0000-000000000000') $$,
  '42501', null, 'professora não marca visto (é do responsável)');

-- pai A1
select testes.entrar('aaaaaaaa-0000-0000-0000-000000000004');
select lives_ok($$ insert into agenda_vistos (registro_id, escola_id)
                   values ('ffffffff-0000-0000-0000-000000000001', 'aaaaaaaa-1111-0000-0000-000000000000') $$,
  'pai marca Visto no trazer amanhã do filho');
select throws_ok($$ insert into agenda_vistos (registro_id, escola_id)
                    values ('ffffffff-0000-0000-0000-000000000001', 'aaaaaaaa-1111-0000-0000-000000000000') $$,
  '23505', null, 'visto é único por pessoa');
select throws_ok($$ insert into agenda_vistos (registro_id, escola_id)
                    values ('ffffffff-0000-0000-0000-000000000002', 'aaaaaaaa-1111-0000-0000-000000000000') $$,
  '42501', null, 'pai não marca visto no registro de outra criança');
select throws_ok(format($$ insert into agenda_vistos (registro_id, escola_id)
                    select r.id, r.escola_id from agenda_registros r where r.campo_id = %L $$, :'c_almoco'),
  '42501', null, 'pai não marca visto em campo que não pede visto');
select throws_ok($$ insert into agenda_vistos (registro_id, escola_id, user_id)
                    values ('ffffffff-0000-0000-0000-000000000001', 'aaaaaaaa-1111-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000005') $$,
  '23505', null, 'não dá para marcar em nome de outra pessoa (user_id vem do login)');
select is((select count(*)::int from agenda_vistos), 1, 'pai vê o próprio visto');

-- mãe A2 não vê o visto do pai A1
select testes.entrar('aaaaaaaa-0000-0000-0000-000000000005');
select is((select count(*)::int from agenda_vistos), 0, 'outro responsável não vê vistos alheios');

-- equipe vê quem deu visto
select testes.entrar('aaaaaaaa-0000-0000-0000-000000000001');
select is((select count(*)::int from agenda_vistos), 1, 'gestor vê os vistos da escola');

-- outra escola não vê
select testes.entrar('bbbbbbbb-0000-0000-0000-000000000001');
select is((select count(*)::int from agenda_vistos), 0, 'gestor de outra escola não vê vistos');

-- escola que só mostra depois de finalizar: sem visto em dia não finalizado
select testes.sair();
update escolas set agenda_visivel_antes_finalizar = false where id = 'aaaaaaaa-1111-0000-0000-000000000000';
delete from agenda_vistos;
select testes.entrar('aaaaaaaa-0000-0000-0000-000000000004');
select throws_ok($$ insert into agenda_vistos (registro_id, escola_id)
                    values ('ffffffff-0000-0000-0000-000000000001', 'aaaaaaaa-1111-0000-0000-000000000000') $$,
  '42501', null, 'sem visto antes de o dia ficar visível para a família');

select * from finish();
rollback;
