-- ============================================
-- FIX RAPIDE : FORCER L'AFFICHAGE DES LOCATAIRES
-- ============================================

-- ÉTAPE 1 : Désactiver RLS temporairement (pour tester)
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;

-- ÉTAPE 2 : S'assurer qu'il y a des données
-- Supprimer les locataires de test existants
DELETE FROM tenants WHERE email LIKE '%@mode-paris.fr%' OR email LIKE '%@legourmet.fr%';

-- Créer 5 nouveaux locataires de test
INSERT INTO tenants (company_name, contact_name, email, phone, business_type, active)
VALUES 
  ('Boutique Mode Paris', 'Sophie Dubois', 'sophie@mode-paris.fr', '0612345678', 'Prêt-à-porter', true),
  ('Restaurant Le Gourmet', 'Jean Martin', 'jean@legourmet.fr', '0623456789', 'Restauration', true),
  ('Librairie du Centre', 'Marie Lefebvre', 'marie@librairie-centre.fr', '0634567890', 'Commerce de détail', true),
  ('Pharmacie Santé Plus', 'Pierre Durand', 'pierre@sante-plus.fr', '0645678901', 'Santé', true),
  ('Coiffeur Style & Co', 'Isabelle Moreau', 'isabelle@style-co.fr', '0656789012', 'Services', true);

-- ÉTAPE 3 : Vérifier que les données sont là
SELECT 
  id,
  company_name,
  contact_name,
  email,
  active
FROM tenants
ORDER BY company_name;

-- ✅ SI VOUS VOYEZ 5 LIGNES :
-- 1. Rafraîchissez votre application (F5)
-- 2. Vous devriez voir les 5 locataires
-- 3. Si OUI → le problème vient des politiques RLS
-- 4. Si NON → le problème vient du frontend

-- ⚠️ APRÈS LE TEST, POUR RÉACTIVER LA SÉCURITÉ :
-- Exécutez ces commandes dans un nouveau script :
/*
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
*/
