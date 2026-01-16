-- ============================================
-- DIAGNOSTIC COMPLET : LOCATAIRES & RLS
-- ============================================

-- 1️⃣ VÉRIFIER LES LOCATAIRES DANS LA BASE
SELECT 
  id,
  company_name,
  contact_name,
  email,
  active,
  created_at
FROM tenants
ORDER BY created_at DESC;

-- 2️⃣ VÉRIFIER L'ÉTAT DE RLS SUR TENANTS
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename IN ('tenants', 'profiles', 'shops', 'contracts');

-- 3️⃣ VÉRIFIER LES POLITIQUES RLS SUR TENANTS
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'tenants'
ORDER BY policyname;

-- 4️⃣ VÉRIFIER VOTRE RÔLE UTILISATEUR
SELECT 
  id,
  email,
  role,
  active
FROM profiles
WHERE id = auth.uid();

-- 5️⃣ SI AUCUN LOCATAIRE N'EXISTE, EN CRÉER DES EXEMPLES
-- (Décommentez si besoin)
/*
INSERT INTO tenants (company_name, contact_name, email, phone, business_type, active)
VALUES 
  ('Boutique Mode Paris', 'Sophie Dubois', 'sophie@mode-paris.fr', '0612345678', 'Prêt-à-porter', true),
  ('Restaurant Le Gourmet', 'Jean Martin', 'jean@legourmet.fr', '0623456789', 'Restauration', true),
  ('Librairie du Centre', 'Marie Lefebvre', 'marie@librairie-centre.fr', '0634567890', 'Commerce de détail', true);
*/

-- 6️⃣ SI RLS BLOQUE L'ACCÈS, DÉSACTIVER TEMPORAIREMENT (TEST UNIQUEMENT)
-- ⚠️ À UTILISER SEULEMENT POUR TESTER
/*
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
*/

-- 7️⃣ OU DONNER LE RÔLE ADMIN À VOTRE UTILISATEUR
-- (Plus recommandé que désactiver RLS)
/*
UPDATE profiles
SET role = 'admin'
WHERE id = auth.uid();
*/

-- ✅ APRÈS CES VÉRIFICATIONS :
-- - Si vous voyez des locataires à l'étape 1 → Problème de RLS
-- - Si aucun locataire → Créez-en (étape 5)
-- - Si votre rôle n'est pas admin → Changez-le (étape 7)
