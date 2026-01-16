-- ============================================
-- VÉRIFIER & CORRIGER LISTE LOCATAIRES VIDE
-- ============================================

-- 1️⃣ COMBIEN DE LOCATAIRES DANS LA BASE ?
SELECT 'Total locataires' as check_name, COUNT(*) as count FROM tenants;

-- 2️⃣ COMBIEN DE LOCATAIRES ACTIFS ?
SELECT 'Locataires actifs' as check_name, COUNT(*) as count 
FROM tenants 
WHERE active = true;

-- 3️⃣ VOIR TOUS LES LOCATAIRES
SELECT 
  id,
  company_name,
  contact_name,
  email,
  active,
  user_id,
  created_at
FROM tenants
ORDER BY created_at DESC
LIMIT 10;

-- 4️⃣ VÉRIFIER VOTRE RÔLE
SELECT 
  'Mon rôle' as check_name,
  email,
  role
FROM profiles
WHERE id = auth.uid();

-- 5️⃣ VÉRIFIER SI RLS BLOQUE
-- Tester la requête exacte que fait ShopModal
SELECT 
  'Test requête ShopModal' as section,
  id, 
  company_name, 
  contact_name, 
  active
FROM tenants
WHERE active = true
ORDER BY company_name ASC;

-- 6️⃣ SI AUCUN LOCATAIRE, CRÉEZ-EN VIA INSCRIPTION
-- Ou créez-en manuellement pour tester :
/*
INSERT INTO tenants (company_name, contact_name, email, active)
VALUES 
  ('Boutique Test', 'Sophie Martin', 'sophie@test.fr', true),
  ('Restaurant Test', 'Jean Dupont', 'jean@test.fr', true),
  ('Salon Test', 'Marie Durand', 'marie@test.fr', true);
*/

-- 7️⃣ SI RLS BLOQUE, CHANGER VOTRE RÔLE EN ADMIN
/*
UPDATE profiles
SET role = 'admin'
WHERE id = auth.uid();
*/

-- 8️⃣ OU DÉSACTIVER RLS TEMPORAIREMENT (TEST UNIQUEMENT)
/*
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
*/

-- Pour réactiver après test :
/*
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
*/

-- ✅ RÉSULTATS ATTENDUS :
-- - Total locataires > 0
-- - Locataires actifs > 0
-- - Votre rôle = 'admin' ou 'manager'
-- - Test requête ShopModal retourne des données
