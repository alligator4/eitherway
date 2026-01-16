-- ============================================
-- SCRIPT DE CORRECTION - PAGE LOCATAIRES
-- ============================================

-- 1️⃣ VÉRIFIER VOTRE RÔLE
SELECT 
    id,
    email, 
    role,
    active
FROM profiles 
WHERE id = auth.uid();

-- RÉSULTAT ATTENDU : role doit être 'admin', 'superadmin' ou 'manager'
-- Si ce n'est pas le cas, exécutez la commande suivante :

-- 2️⃣ METTRE À JOUR VOTRE RÔLE (remplacez par VOTRE email)
UPDATE profiles 
SET role = 'admin'
WHERE email = 'VOTRE_EMAIL@example.com';

-- Vérification après mise à jour :
SELECT email, role FROM profiles WHERE id = auth.uid();

-- 3️⃣ VÉRIFIER LA TABLE TENANTS
SELECT COUNT(*) as nombre_locataires FROM tenants;

-- 4️⃣ CRÉER DES LOCATAIRES DE TEST (si la table est vide)
INSERT INTO tenants (company_name, contact_name, email, phone, business_type, active)
VALUES 
  ('Boutique Mode Paris', 'Sophie Dubois', 'sophie@mode-paris.fr', '0612345678', 'Prêt-à-porter', true),
  ('Restaurant Le Gourmet', 'Jean Martin', 'jean@legourmet.fr', '0623456789', 'Restauration', true),
  ('Librairie du Centre', 'Marie Lefebvre', 'marie@librairie-centre.fr', '0634567890', 'Commerce de détail', true);

-- Vérifier que les données sont insérées :
SELECT id, company_name, contact_name, email, active FROM tenants;

-- 5️⃣ VÉRIFIER LES POLITIQUES RLS
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    cmd
FROM pg_policies
WHERE tablename = 'tenants';

-- RÉSULTAT ATTENDU : Vous devez voir au moins 5 politiques
-- Si aucune politique n'apparaît, exécutez le script ci-dessous :

-- 6️⃣ RECRÉER LES POLITIQUES RLS (si nécessaire)
DROP POLICY IF EXISTS "Admins can view all tenants" ON tenants;
DROP POLICY IF EXISTS "Tenants can view own data" ON tenants;
DROP POLICY IF EXISTS "Admins can insert tenants" ON tenants;
DROP POLICY IF EXISTS "Admins can update tenants" ON tenants;
DROP POLICY IF EXISTS "Admins can delete tenants" ON tenants;

-- S'assurer que RLS est activé
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Créer les politiques
CREATE POLICY "Admins can view all tenants"
  ON tenants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'manager')
    )
  );

CREATE POLICY "Tenants can view own data"
  ON tenants FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can insert tenants"
  ON tenants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'manager')
    )
  );

CREATE POLICY "Admins can update tenants"
  ON tenants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'manager')
    )
  );

CREATE POLICY "Admins can delete tenants"
  ON tenants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin')
    )
  );

-- 7️⃣ TESTER LA REQUÊTE FINALE
-- Cette requête simule ce que l'application fait
SELECT * FROM tenants ORDER BY company_name ASC;

-- Si cette requête fonctionne, l'application devrait fonctionner aussi !
