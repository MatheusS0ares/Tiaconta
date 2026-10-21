-- Teste rápido de RLS (Postgres puro, fora do Supabase). Rodar após stub de auth + migrations + seed.
grant usage on schema public, auth to authenticated;
grant all on all tables in schema public to authenticated;
grant execute on all functions in schema public, auth to authenticated;

-- usuários
insert into auth.users values
 ('00000000-0000-0000-0000-00000000000a'), -- gestora ABC
 ('00000000-0000-0000-0000-00000000000b'), -- professora ABC
 ('00000000-0000-0000-0000-00000000000c'), -- pai ABC (filho 1)
 ('00000000-0000-0000-0000-00000000000d'); -- gestor outra escola
insert into escolas (id,nome,slug) values ('10000000-0000-0000-0000-000000000002','Outra','outra');
select criar_campos_padrao('10000000-0000-0000-0000-000000000002');
insert into membros (escola_id,user_id,papel)
 select id,'00000000-0000-0000-0000-00000000000a'::uuid,'gestor'::papel_membro from escolas where slug='escolinha-abc'
 union all select id,'00000000-0000-0000-0000-00000000000b'::uuid,'professora'::papel_membro from escolas where slug='escolinha-abc'
 union all select id,'00000000-0000-0000-0000-00000000000c'::uuid,'responsavel'::papel_membro from escolas where slug='escolinha-abc'
 union all select '10000000-0000-0000-0000-000000000002'::uuid,'00000000-0000-0000-0000-00000000000d'::uuid,'gestor'::papel_membro;
insert into turmas (id,escola_id,nome,faixa) select '20000000-0000-0000-0000-000000000001',id,'Berçário I','bercario' from escolas where slug='escolinha-abc';
insert into criancas (id,escola_id,turma_id,nome) select ('30000000-0000-0000-0000-00000000000'||n)::uuid,e.id,'20000000-0000-0000-0000-000000000001','Criança '||n
 from escolas e, generate_series(1,3) n where e.slug='escolinha-abc';
insert into responsaveis_criancas select '30000000-0000-0000-0000-000000000001',escola_id,'00000000-0000-0000-0000-00000000000c','pai' from criancas where id='30000000-0000-0000-0000-000000000001';

-- professora: registro em lote, exceto criança 3
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
select 'lote' t, registrar_em_lote('20000000-0000-0000-0000-000000000001', current_date,
  (select c.id from agenda_campos c join escolas e on e.id=c.escola_id where e.slug='escolinha-abc' and chave='almoco'),
  '{"opcao":"Comeu tudo"}', array['30000000-0000-0000-0000-000000000003']::uuid[]);
select 'autor ok' t, count(*) from agenda_registros where registrado_por='00000000-0000-0000-0000-00000000000b';
update agenda_dias set status='finalizado' where crianca_id='30000000-0000-0000-0000-000000000001';
select 'finalizado_por' t, finalizado_por from agenda_dias where crianca_id='30000000-0000-0000-0000-000000000001';
-- após finalizar, professora não consegue alterar
update agenda_registros set valor='{"opcao":"Recusou"}' where agenda_dia_id=(select id from agenda_dias where crianca_id='30000000-0000-0000-0000-000000000001');
select 'bloqueio pos-finalizar (esperado Comeu tudo)' t, valor from agenda_registros r join agenda_dias d on d.id=r.agenda_dia_id where d.crianca_id='30000000-0000-0000-0000-000000000001';

-- pai: só vê o próprio filho
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select 'pai ve criancas (esperado 1)' t, count(*) from criancas;
select 'pai ve registros (esperado 1)' t, count(*) from agenda_registros;
insert into agenda_leituras (agenda_dia_id,escola_id) select id,escola_id from agenda_dias;
select 'pai leituras (esperado 1)' t, count(*) from agenda_leituras;
do $$ begin
  insert into agenda_registros (escola_id,agenda_dia_id,campo_id,valor)
  select escola_id,id,(select id from agenda_campos where chave='nota' and escola_id=d.escola_id),'{"texto":"x"}' from agenda_dias d;
  raise notice 'FALHA: pai conseguiu inserir';
exception when insufficient_privilege then raise notice 'OK: pai bloqueado de inserir';
end $$;

-- gestor de outra escola: não vê nada da ABC
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000d';
select 'outra escola ve criancas ABC (esperado 0)' t, count(*) from criancas;
select 'outra escola ve registros (esperado 0)' t, count(*) from agenda_registros;
select 'outra escola ve escolas (esperado 1)' t, count(*) from escolas;
