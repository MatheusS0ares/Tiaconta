-- 0006_agenda_professora.sql — ajustes da agenda para a tela da professora.
--
-- 1. Só a professora DA TURMA (ou o gestor) registra. Antes qualquer
--    professora da escola escrevia em qualquer turma (fn_e_equipe).
-- 2. Validação do `valor` por tipo de campo no banco (defesa em profundidade;
--    a UI valida antes com zod em lib/agenda/tipos.ts).
-- 3. Registro em lote idempotente e desfazível (lote_id), sem sobrescrever
--    exceções já registradas em campos de valor único.
-- 4. RPCs para a fila offline: registrar (id gerado no cliente = reenvio
--    seguro), definir_falta, finalizar_dia, finalizar_dia_turma, salvar_mural.
-- 5. Mural: autor/horário pelo servidor e respeito a
--    escolas.agenda_visivel_antes_finalizar para o responsável.

-- ---------------------------------------------------------------- helpers de permissão
create or replace function fn_pode_registrar_turma(p_turma uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from turmas t
    where t.id = p_turma
      and (
        fn_e_gestor(t.escola_id)
        or (
          fn_tem_papel(t.escola_id, array['professora']::papel_membro[])
          and exists (select 1 from turma_professoras tp where tp.turma_id = t.id and tp.user_id = auth.uid())
        )
      )
  );
$$;

create or replace function fn_pode_registrar_crianca(p_crianca uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from criancas c
    where c.id = p_crianca
      and (fn_e_gestor(c.escola_id) or (c.turma_id is not null and fn_pode_registrar_turma(c.turma_id)))
  );
$$;

create or replace function fn_pode_registrar_dia(p_dia uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from agenda_dias d where d.id = p_dia and fn_pode_registrar_crianca(d.crianca_id));
$$;

-- Mural visível ao responsável: escola mostra antes de finalizar, ou o dia
-- de algum filho dele naquela turma já foi finalizado.
create or replace function fn_mural_visivel_responsavel(p_turma uuid, p_data date)
returns boolean language sql stable security definer set search_path = public as $$
  select fn_e_responsavel_na_turma(p_turma) and (
    exists (select 1 from turmas t join escolas e on e.id = t.escola_id
            where t.id = p_turma and e.agenda_visivel_antes_finalizar)
    or exists (
      select 1 from agenda_dias d join criancas c on c.id = d.crianca_id
      where c.turma_id = p_turma and d.data = p_data and d.status = 'finalizado'
        and fn_e_responsavel_de(d.crianca_id)
    )
  );
$$;

-- ---------------------------------------------------------------- policies (substituem as de 0002)
drop policy dias_insert on agenda_dias;
drop policy dias_update on agenda_dias;
create policy dias_insert on agenda_dias for insert
  with check (fn_pode_registrar_crianca(crianca_id));
create policy dias_update on agenda_dias for update
  using (fn_pode_registrar_crianca(crianca_id) and (status = 'rascunho' or fn_e_gestor(escola_id)))
  with check (fn_pode_registrar_crianca(crianca_id));

drop policy reg_insert on agenda_registros;
drop policy reg_update on agenda_registros;
drop policy reg_delete on agenda_registros;
create policy reg_insert on agenda_registros for insert
  with check (fn_pode_registrar_dia(agenda_dia_id) and fn_dia_editavel(agenda_dia_id));
create policy reg_update on agenda_registros for update
  using (fn_pode_registrar_dia(agenda_dia_id) and fn_dia_editavel(agenda_dia_id))
  with check (fn_pode_registrar_dia(agenda_dia_id));
create policy reg_delete on agenda_registros for delete
  using (fn_pode_registrar_dia(agenda_dia_id) and fn_dia_editavel(agenda_dia_id));

drop policy td_select on turma_dias;
drop policy td_write on turma_dias;
create policy td_select on turma_dias for select
  using (fn_e_equipe(escola_id) or fn_mural_visivel_responsavel(turma_id, data));
create policy td_insert on turma_dias for insert with check (fn_pode_registrar_turma(turma_id));
create policy td_update on turma_dias for update
  using (fn_pode_registrar_turma(turma_id)) with check (fn_pode_registrar_turma(turma_id));
create policy td_delete on turma_dias for delete using (fn_e_gestor(escola_id));

-- ---------------------------------------------------------------- mural: autor e horário do servidor
create or replace function trg_turma_dia_autoria()
returns trigger language plpgsql as $$
begin
  new.autor := coalesce(auth.uid(), new.autor);
  new.atualizado_em := now();
  return new;
end $$;

create trigger turma_dias_autoria
before insert or update on turma_dias
for each row execute function trg_turma_dia_autoria();

-- ---------------------------------------------------------------- validação do valor
create or replace function fn_hora_valida(p jsonb)
returns boolean language sql immutable as $$
  select jsonb_typeof(p) = 'string' and (p #>> '{}') ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$';
$$;

create or replace function fn_valor_valido(p_tipo tipo_campo, p_opcoes jsonb, v jsonb)
returns boolean language plpgsql immutable as $$
declare
  lista jsonb := coalesce(p_opcoes -> 'opcoes', '[]'::jsonb);
begin
  if jsonb_typeof(v) <> 'object' then return false; end if;
  case p_tipo
    when 'opcao' then
      return jsonb_typeof(v -> 'opcao') = 'string'
        and (jsonb_array_length(lista) = 0 or lista ? (v ->> 'opcao'));
    when 'sim_nao' then
      return jsonb_typeof(v -> 'sim') = 'boolean';
    when 'evento' then
      return fn_hora_valida(v -> 'hora')
        and (v -> 'opcao' is null or (jsonb_typeof(v -> 'opcao') = 'string'
             and (jsonb_array_length(lista) = 0 or lista ? (v ->> 'opcao'))))
        and (v -> 'obs' is null or jsonb_typeof(v -> 'obs') = 'string');
    when 'intervalo' then
      return fn_hora_valida(v -> 'inicio')
        and (v -> 'fim' is null or jsonb_typeof(v -> 'fim') = 'null' or fn_hora_valida(v -> 'fim'));
    when 'quantidade' then
      return jsonb_typeof(v -> 'quantidade') = 'number' and (v ->> 'quantidade')::numeric >= 0
        and (v -> 'hora' is null or fn_hora_valida(v -> 'hora'));
    when 'texto' then
      return jsonb_typeof(v -> 'texto') = 'string' and length(v ->> 'texto') between 1 and 2000;
    when 'checklist' then
      return jsonb_typeof(v -> 'itens') = 'array'
        and (jsonb_array_length(lista) = 0 or lista @> (v -> 'itens'))
        and (v -> 'obs' is null or jsonb_typeof(v -> 'obs') = 'string');
  end case;
  return false;
end $$;

create or replace function trg_registro_valida()
returns trigger language plpgsql as $$
declare
  c agenda_campos%rowtype;
begin
  select * into c from agenda_campos where id = new.campo_id;
  if not fn_valor_valido(c.tipo, c.opcoes, new.valor) then
    raise exception 'valor_invalido' using errcode = '22023',
      detail = format('campo %s (%s): %s', c.chave, c.tipo, new.valor);
  end if;
  return new;
end $$;

create trigger agenda_registros_valida
before insert or update of valor, campo_id on agenda_registros
for each row execute function trg_registro_valida();

-- ---------------------------------------------------------------- lote
alter table agenda_registros add column lote_id uuid;
create index on agenda_registros (lote_id) where lote_id is not null;

-- Garante o dia da criança (rascunho) e devolve o id. Roda com RLS de quem chama.
create or replace function garantir_dia(p_crianca uuid, p_data date)
returns uuid language plpgsql security invoker as $$
declare
  v_dia uuid;
  v_escola uuid;
begin
  select id into v_dia from agenda_dias where crianca_id = p_crianca and data = p_data;
  if v_dia is not null then return v_dia; end if;
  select escola_id into v_escola from criancas where id = p_crianca;
  if v_escola is null then raise exception 'crianca_nao_encontrada' using errcode = 'P0001'; end if;
  insert into agenda_dias (escola_id, crianca_id, data) values (v_escola, p_crianca, p_data)
  on conflict (crianca_id, data) do nothing
  returning id into v_dia;
  if v_dia is null then
    select id into v_dia from agenda_dias where crianca_id = p_crianca and data = p_data;
  end if;
  return v_dia;
end $$;

drop function registrar_em_lote(uuid, date, uuid, jsonb, uuid[]);

-- "Almoço: todos comeram tudo", exceto p_exceto. Não sobrescreve quem já tem
-- valor num campo de valor único (a exceção registrada antes vence).
-- Idempotente por p_lote (reenvio da fila offline) e desfazível
-- (delete from agenda_registros where lote_id = p_lote).
create or replace function registrar_em_lote(
  p_turma uuid,
  p_data date,
  p_campo uuid,
  p_valor jsonb,
  p_exceto uuid[] default '{}',
  p_lote uuid default gen_random_uuid()
) returns int language plpgsql security invoker as $$
declare
  v_escola uuid;
  v_multiplo boolean;
  v_total int := 0;
  r record;
  v_dia uuid;
begin
  if exists (select 1 from agenda_registros where lote_id = p_lote) then
    return (select count(*) from agenda_registros where lote_id = p_lote);
  end if;

  select escola_id into v_escola from turmas where id = p_turma;
  if v_escola is null then raise exception 'Turma não encontrada'; end if;
  select multiplo into v_multiplo from agenda_campos where id = p_campo and escola_id = v_escola and ativo;
  if v_multiplo is null then raise exception 'campo_invalido' using errcode = 'P0001'; end if;

  for r in
    select c.id from criancas c
    where c.turma_id = p_turma and c.ativa and not (c.id = any (coalesce(p_exceto, '{}')))
  loop
    v_dia := garantir_dia(r.id, p_data);
    if exists (select 1 from agenda_dias where id = v_dia and not faltou and status = 'rascunho')
       and (v_multiplo or not exists (select 1 from agenda_registros where agenda_dia_id = v_dia and campo_id = p_campo))
    then
      insert into agenda_registros (escola_id, agenda_dia_id, campo_id, valor, lote_id)
      values (v_escola, v_dia, p_campo, p_valor, p_lote);
      v_total := v_total + 1;
    end if;
  end loop;

  return v_total;
end $$;

-- ---------------------------------------------------------------- registro individual
-- p_id é gerado no cliente: reenviar o mesmo registro não duplica.
-- Campo de valor único: atualiza o registro existente (exceção sobre o lote).
create or replace function registrar(p_id uuid, p_crianca uuid, p_data date, p_campo uuid, p_valor jsonb)
returns uuid language plpgsql security invoker as $$
declare
  v_dia uuid;
  v_escola uuid;
  v_multiplo boolean;
  v_existente uuid;
begin
  v_dia := garantir_dia(p_crianca, p_data);
  if not fn_dia_editavel(v_dia) then
    raise exception 'dia_finalizado' using errcode = 'P0001';
  end if;
  select escola_id into v_escola from agenda_dias where id = v_dia;
  select multiplo into v_multiplo from agenda_campos where id = p_campo and escola_id = v_escola;
  if v_multiplo is null then raise exception 'campo_invalido' using errcode = 'P0001'; end if;

  if not v_multiplo then
    select id into v_existente from agenda_registros
    where agenda_dia_id = v_dia and campo_id = p_campo and id <> p_id
    limit 1;
    if v_existente is not null then
      update agenda_registros set valor = p_valor, lote_id = null where id = v_existente;
      return v_existente;
    end if;
  end if;

  insert into agenda_registros (id, escola_id, agenda_dia_id, campo_id, valor)
  values (p_id, v_escola, v_dia, p_campo, p_valor)
  on conflict (id) do update set valor = excluded.valor;
  return p_id;
end $$;

create or replace function definir_falta(p_crianca uuid, p_data date, p_faltou boolean)
returns void language plpgsql security invoker as $$
declare
  v_dia uuid := garantir_dia(p_crianca, p_data);
begin
  update agenda_dias set faltou = p_faltou where id = v_dia and status = 'rascunho';
  if not found then raise exception 'dia_finalizado' using errcode = 'P0001'; end if;
end $$;

create or replace function finalizar_dia(p_crianca uuid, p_data date)
returns void language plpgsql security invoker as $$
declare
  v_dia uuid := garantir_dia(p_crianca, p_data);
begin
  update agenda_dias set status = 'finalizado' where id = v_dia and status = 'rascunho';
end $$;

-- Finaliza todas as crianças ativas da turma (inclusive faltas). Retorna quantas mudaram.
create or replace function finalizar_dia_turma(p_turma uuid, p_data date)
returns int language plpgsql security invoker as $$
declare
  r record;
  v_dia uuid;
  v_total int := 0;
begin
  if not fn_pode_registrar_turma(p_turma) then
    raise exception 'sem_permissao' using errcode = '42501';
  end if;
  for r in select id from criancas where turma_id = p_turma and ativa loop
    v_dia := garantir_dia(r.id, p_data);
    update agenda_dias set status = 'finalizado' where id = v_dia and status = 'rascunho';
    if found then v_total := v_total + 1; end if;
  end loop;
  return v_total;
end $$;

create or replace function salvar_mural(p_turma uuid, p_data date, p_texto text)
returns void language plpgsql security invoker as $$
declare
  v_escola uuid;
begin
  select escola_id into v_escola from turmas where id = p_turma;
  if v_escola is null then raise exception 'Turma não encontrada'; end if;
  insert into turma_dias (escola_id, turma_id, data, mural)
  values (v_escola, p_turma, p_data, nullif(trim(p_texto), ''))
  on conflict (turma_id, data) do update set mural = excluded.mural;
end $$;
