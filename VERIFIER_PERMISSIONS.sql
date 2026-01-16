-- ============================================
-- VÉRIFICATION DES PERMISSIONS UTILISATEUR
-- ============================================

-- 1️⃣ VÉRIFIER VOTRE PROFIL ET RÔLE
SELECT 
  id,
  email,
  role,
  created_at
FROM profiles
WHERE id = auth.uid();

-- 2️⃣ VÉRIFIER SI VOUS POUVEZ VOIR LES LOCATAIRES
SELECT 
  id,
  company_name,
  contact_name,
  email,
  active
FROM tenants
ORDER BY company_name;

-- 3️⃣ VÉRIFIER LES POLITIQUES RLS ACTIVES
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'tenants';

-- 4️⃣ SI VOUS NE VOYEZ AUCUN LOCATAIRE, EXÉCUTEZ CETTE CORRECTION :
-- (Décommentez les lignes ci-dessous si nécessaire)

/*
-- Option A : Donner le rôle admin à votre utilisateur
UPDATE profiles
SET role = 'admin'
WHERE id = auth.uid();
*/

/*
-- Option B : Désactiver temporairement RLS pour tester (NON RECOMMANDÉ EN PRODUCTION)
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
*/
