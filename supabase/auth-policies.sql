-- À exécuter après schema.sql (et après avoir créé un utilisateur dans
-- Authentication → Users, avec "Auto Confirm User" activé). Autorise
-- toute personne connectée via Supabase Auth à ajouter/modifier/supprimer
-- des ressources et à déposer des fichiers dans le bucket "documents".

create policy "Écriture réservée aux personnes connectées" on ressources
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Upload réservé aux personnes connectées" on storage.objects
  for insert
  with check (bucket_id = 'documents' and auth.role() = 'authenticated');

create policy "Remplacement de fichier réservé aux personnes connectées" on storage.objects
  for update
  using (bucket_id = 'documents' and auth.role() = 'authenticated');
