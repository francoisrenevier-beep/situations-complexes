-- À exécuter une fois dans Supabase (SQL Editor) sur un projet existant, pour
-- ajouter le classement manuel (ordre) et le poids affiché par ressource,
-- introduits par la refonte de l'admin (Priorité 4). Inutile sur une base
-- recréée depuis schema.sql, qui inclut déjà ces colonnes.

alter table ressources add column if not exists ordre integer;
alter table ressources add column if not exists poids text;
