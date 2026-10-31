-- Etapa 6: o painel lê leituras, vistos e registros — só a gestão (e equipe) da própria escola.
begin;
\ir _fixtures.psql
select plan(7);

select id as dia_a1 from agenda_dias where crianca_id = 'aaaaaaaa-3333-0000-0000-000000000001' and data = current_date \gset
select testes.entrar('aaaaaaaa-0000-0000-0000-000000000004'); -- pai A1 lê
insert into agenda_leituras (agenda_dia_id, escola_id) values (:'dia_a1', 'aaaaaaaa-1111-0000-0000-000000000000');

select testes.entrar('aaaaaaaa-0000-0000-0000-000000000001'); -- gestor A
select is((select count(*)::int from agenda_leituras), 1, 'gestor vê quem leu na própria escola');
select is((select count(*)::int from agenda_registros where registrado_por is not null), 4, 'gestor vê autoria de todos os registros');
select is((select count(*)::int from turma_dias), 1, 'gestor vê o mural (autoria) da escola');

select testes.entrar('bbbbbbbb-0000-0000-0000-000000000001'); -- gestor B
select is((select count(*)::int from agenda_leituras), 0, 'gestor de outra escola não vê leituras');
select is((select count(*)::int from agenda_registros where escola_id = 'aaaaaaaa-1111-0000-0000-000000000000'), 0, 'gestor de outra escola não vê registros');

select testes.entrar('aaaaaaaa-0000-0000-0000-000000000005'); -- mãe A2
select is((select count(*)::int from agenda_leituras), 0, 'responsável não vê leituras de outras famílias');
select is((select count(*)::int from membros where escola_id = 'aaaaaaaa-1111-0000-0000-000000000000' and user_id <> auth.uid()), 0,
  'responsável não vê a lista de membros da escola');

select * from finish();
rollback;
