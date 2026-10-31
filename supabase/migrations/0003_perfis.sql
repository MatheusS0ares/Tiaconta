-- 0003_perfis.sql — consentimento LGPD e visibilidade de perfis.
--
-- Antes: perfis_select dependia de ler `membros`, mas o RLS de membros só
-- deixa o responsável ver a própria linha. Resultado: o responsável não via
-- nem o nome da professora (necessário para "finalizado por ...").
-- Agora: a regra fica num helper security definer:
--   * cada um vê o próprio perfil;
--   * a equipe (gestor/professora) vê todos os perfis da escola;
--   * o responsável vê só os perfis da equipe da escola (nunca de outros pais).

alter table perfis add column consentimento_em timestamptz;

comment on column perfis.consentimento_em is
  'Quando o usuário aceitou o termo de uso e privacidade (LGPD). Null = ainda não aceitou.';

create or replace function fn_perfil_visivel(p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select p_user = auth.uid()
    or exists (
      select 1 from membros alvo
      where alvo.user_id = p_user and alvo.ativo
        and (
          fn_e_equipe(alvo.escola_id)
          or (alvo.papel in ('gestor', 'professora') and fn_e_membro(alvo.escola_id))
        )
    );
$$;

drop policy perfis_select on perfis;
create policy perfis_select on perfis for select using (fn_perfil_visivel(user_id));

drop policy perfis_update on perfis;
create policy perfis_update on perfis for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
