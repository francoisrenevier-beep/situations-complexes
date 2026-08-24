-- Ajouts ponctuels à exécuter dans le SQL Editor de Supabase (en plus de seed.sql).

insert into ressources (id, gt, genre, origine, date, duree, titre, texte, lien) values
  ('formation-rapport-final', 'formation', 'document', 'gt', 'février 2026', NULL, 'Rapport final du groupe de travail « Formation de base et continue »', 'Constats, propositions et recommandations du GT : catalogue de formations à deux niveaux, pistes pour les cadres intermédiaires, communautés de pratique et analyse de pratique interinstitutionnelle.', '#');
