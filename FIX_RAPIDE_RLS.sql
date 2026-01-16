-- ============================================
-- CORRECTIFS RAPIDES
-- ============================================

-- 1️⃣ ACTIVER RLS SUR TENANTS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- 2️⃣ VÉRIFIER QUE LES POLITIQUES EXISTENT
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename = 'tenants';

-- Si aucune politique n'existe, créer les politiques de base :

-- Politique : Tout le monde peut voir les locataires (à ajuster selon vos besoins)
CREATE POLICY IF NOT EXISTS "Anyone can view tenants"
  ON tenants FOR SELECT
  TO authenticated
  USING (true);

-- Politique : Les admins peuvent tout faire
CREATE POLICY IF NOT EXISTS "Admins can manage tenants"
  ON tenants FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role IN ('superadmin', 'admin', 'manager')
    )
  );

-- Politique : Les tenants peuvent modifier leurs propres données
CREATE POLICY IF NOT EXISTS "Tenants can update own data"
  ON tenants FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 3️⃣ VÉRIFIER LES DONNÉES
SELECT 
  id,
  company_name,
  contact_name,
  email,
  active,
  created_at
FROM tenants
ORDER BY created_at DESC;
