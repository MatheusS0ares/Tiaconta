-- seed.sql — tenant piloto (usuários são criados via convite/Auth, não aqui)
insert into escolas (nome, slug, cor_primaria)
values ('Escolinha ABC – Berçário e Educação Infantil', 'escolinha-abc', '#2563eb')
on conflict (slug) do nothing;

select criar_campos_padrao(id) from escolas where slug = 'escolinha-abc';
