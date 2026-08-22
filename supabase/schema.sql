-- À exécuter une fois dans Supabase (SQL Editor) après avoir créé le projet.

create table ressources (
  id text primary key,
  gt text not null,
  genre text not null check (genre in ('document','video','presentation','lien')),
  origine text not null check (origine in ('gt','externe')),
  date text default '',
  duree text,
  titre text not null,
  texte text default '',
  lien text not null,
  created_at timestamptz default now()
);

alter table ressources enable row level security;

-- Lecture publique (utilisée par index.html / ressources.html / admin.html
-- via la clé "anon"). Aucune policy d'écriture n'est créée : les
-- insert/update/delete ne passent que par nos fonctions serveur, qui
-- utilisent la clé "service_role" (celle-ci contourne toujours les
-- policies RLS, par conception de Supabase).
create policy "Lecture publique" on ressources
  for select using (true);

-- Créez aussi, dans Storage, un bucket public nommé "documents"
-- (Storage → New bucket → Public bucket : activé) pour les fichiers uploadés.
