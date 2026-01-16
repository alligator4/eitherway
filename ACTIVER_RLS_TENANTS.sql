-- ============================================
-- CORRECTIFS RAPIDES RLS (VERSION CORRIGÉE)
-- ============================================

-- 1️⃣ ACTIVER RLS SUR TENANTS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- 2️⃣ SUPPRIMER LES ANCIENNES POLITIQUES SI ELLES EXISTENT
DROP POLICY IF EXISTS "Anyone can view tenants" ON tenants;
DROP POLICY IF EXISTS "Admins can manage tenants" ON tenants;
DROP POLICY IF EXISTS "Tenants can update own data" ON tenants;
DROP POLICY IF EXISTS "Admins can view all tenants" ON tenants;
DROP POLICY IF EXISTS "Tenants can view own data" ON tenants;
DROP POLICY IF EXISTS "Admins can insert tenants" ON tenants;
DROP POLICY IF EXISTS "Admins can update tenants" ON tenants;
DROP POLICY IF EXISTS "Tenants can update own contact info" ON tenants;
DROP POLICY IF EXISTS "Admins can delete tenants" ON tenants;

-- 3️⃣ CRÉER LES NOUVELLES POLITIQUES

-- Politique : Les admins/managers peuvent tout voir
CREATE POLICY "Admins can view all tenants"
  ON tenants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role IN ('superadmin', 'admin', 'manager')
    )
  );

-- Politique : Les tenants peuvent voir leurs propres données
CREATE POLICY "Tenants can view own data"
  ON tenants FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Politique : Les admins peuvent insérer
CREATE POLICY "Admins can insert tenants"
  ON tenants FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role IN ('superadmin', 'admin', 'manager')
    )
  );

-- Politique : Les admins peuvent modifier
CREATE POLICY "Admins can update tenants"
  ON tenants FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role IN ('superadmin', 'admin', 'manager')
    )
  );

-- Politique : Les tenants peuvent modifier leurs propres données
CREATE POLICY "Tenants can update own contact info"
  ON tenants FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Politique : Les admins peuvent supprimer
CREATE POLICY "Admins can delete tenants"
  ON tenants FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role IN ('superadmin', 'admin')
    )
  );

-- 4️⃣ VÉRIFIER QUE LES POLITIQUES SONT CRÉÉES
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename = 'tenants'
ORDER BY policyname;

-- 5️⃣ VÉRIFIER LES DONNÉES
SELECT 
  id,
  company_name,
  contact_name,
  email,
  active,
  created_at
FROM tenants
ORDER BY created_at DESC;

-- ✅ RLS est maintenant actif avec 6 politiques
