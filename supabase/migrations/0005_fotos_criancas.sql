-- 0005_fotos_criancas.sql — foto da criança em bucket PRIVADO + RLS no Storage.
--
-- Caminho obrigatório: {escola_id}/{crianca_id}/{arquivo}
-- Quem vê: equipe da escola e responsáveis daquela criança (via URL assinada).
-- Quem envia/troca/apaga: gestor da escola.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('criancas-fotos', 'criancas-fotos', false, 2 * 1024 * 1024, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Extrai escola e criança do caminho sem quebrar com nomes malformados.
create or replace function fn_foto_partes(p_name text, out escola_id uuid, out crianca_id uuid)
language plpgsql immutable as $$
declare
  partes text[] := string_to_array(p_name, '/');
  padrao text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
begin
  if array_length(partes, 1) = 3 and partes[1] ~* padrao and partes[2] ~* padrao and partes[3] <> '' then
    escola_id := partes[1]::uuid;
    crianca_id := partes[2]::uuid;
  end if;
end $$;

-- A criança do caminho precisa pertencer à escola do caminho (evita gravar
-- foto de uma escola na pasta de outra).
create or replace function fn_foto_crianca_da_escola(p_name text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from criancas c, fn_foto_partes(p_name) p
    where c.id = p.crianca_id and c.escola_id = p.escola_id
  );
$$;

create or replace function fn_foto_visivel(p_name text)
returns boolean language sql stable security definer set search_path = public as $$
  select fn_foto_crianca_da_escola(p_name) and (
    fn_e_equipe((fn_foto_partes(p_name)).escola_id)
    or fn_e_responsavel_de((fn_foto_partes(p_name)).crianca_id)
  );
$$;

create or replace function fn_foto_editavel(p_name text)
returns boolean language sql stable security definer set search_path = public as $$
  select fn_foto_crianca_da_escola(p_name) and fn_e_gestor((fn_foto_partes(p_name)).escola_id);
$$;

create policy criancas_fotos_select on storage.objects for select to authenticated
  using (bucket_id = 'criancas-fotos' and fn_foto_visivel(name));
create policy criancas_fotos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'criancas-fotos' and fn_foto_editavel(name));
create policy criancas_fotos_update on storage.objects for update to authenticated
  using (bucket_id = 'criancas-fotos' and fn_foto_editavel(name))
  with check (bucket_id = 'criancas-fotos' and fn_foto_editavel(name));
create policy criancas_fotos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'criancas-fotos' and fn_foto_editavel(name));
