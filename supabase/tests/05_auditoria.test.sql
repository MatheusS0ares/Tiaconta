-- Regra 5 do CLAUDE.md: todo registro tem autor e horário, e o autor original é imutável.
begin;
\ir _fixtures.psql
select plan(5);

select id as dia_a2 from agenda_dias
where crianca_id = 'aaaaaaaa-3333-0000-0000-000000000002' and data = current_date \gset
select id as campo_nota from agenda_campos
where escola_id = 'aaaaaaaa-1111-0000-0000-000000000000' and chave = 'nota' \gset

select is(
  (select count(*)::int from agenda_registros
   where escola_id = 'aaaaaaaa-1111-0000-0000-000000000000'
     and registrado_por = 'aaaaaaaa-0000-0000-0000-000000000002'
     and registrado_em is not null),
  4, 'lote grava a professora como autora (3 almoços + medicação)');

-- professora tenta se passar por outra pessoa
select testes.entrar('aaaaaaaa-0000-0000-0000-000000000002');
insert into agenda_registros (escola_id, agenda_dia_id, campo_id, valor, registrado_por, registrado_em)
values ('aaaaaaaa-1111-0000-0000-000000000000', :'dia_a2', :'campo_nota', '{"texto": "oi"}',
        'aaaaaaaa-0000-0000-0000-000000000001', now() - interval '3 days');
select testes.sair();
select is((select registrado_por from agenda_registros where agenda_dia_id = :'dia_a2' and campo_id = :'campo_nota'),
  'aaaaaaaa-0000-0000-0000-000000000002'::uuid, 'registrado_por é sempre quem está logado');
select ok((select registrado_em > now() - interval '1 minute' from agenda_registros
           where agenda_dia_id = :'dia_a2' and campo_id = :'campo_nota'), 'registrado_em é sempre o horário do servidor');

-- outra professora edita: autor original fica, atualizado_por registra a edição
select testes.entrar('aaaaaaaa-0000-0000-0000-000000000003');
update agenda_registros set valor = '{"texto": "oi, editado"}', registrado_por = 'aaaaaaaa-0000-0000-0000-000000000003'
where agenda_dia_id = :'dia_a2' and campo_id = :'campo_nota';
select testes.sair();
select is((select registrado_por from agenda_registros where agenda_dia_id = :'dia_a2' and campo_id = :'campo_nota'),
  'aaaaaaaa-0000-0000-0000-000000000002'::uuid, 'autor original não muda na edição');
select is((select atualizado_por from agenda_registros where agenda_dia_id = :'dia_a2' and campo_id = :'campo_nota'),
  'aaaaaaaa-0000-0000-0000-000000000003'::uuid, 'atualizado_por = quem editou');

select * from finish();
rollback;
