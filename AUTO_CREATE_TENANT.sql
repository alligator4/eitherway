-- ============================================
-- CRÉATION AUTOMATIQUE DU LOCATAIRE À L'INSCRIPTION
-- ============================================

-- 1️⃣ CRÉER LA FONCTION QUI CRÉE AUTOMATIQUEMENT UN LOCATAIRE
CREATE OR REPLACE FUNCTION create_tenant_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_full_name TEXT;
BEGIN
  -- Récupérer l'email depuis auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.id;

  -- Récupérer le nom depuis le nouveau profil
  user_full_name := COALESCE(NEW.full_name, 'Utilisateur');

  -- Créer automatiquement un locataire pour cet utilisateur
  INSERT INTO tenants (
    user_id,
    company_name,
    contact_name,
    email,
    active
  ) VALUES (
    NEW.id,
    user_full_name || ' - Entreprise', -- Nom temporaire
    user_full_name,
    user_email,
    true
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2️⃣ CRÉER LE TRIGGER SUR LA TABLE PROFILES
DROP TRIGGER IF EXISTS on_profile_created_create_tenant ON profiles;

CREATE TRIGGER on_profile_created_create_tenant
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_tenant_on_signup();

-- 3️⃣ CRÉER DES LOCATAIRES POUR LES UTILISATEURS EXISTANTS
-- (Seulement pour ceux qui n'ont pas encore de locataire)
INSERT INTO tenants (user_id, company_name, contact_name, email, active)
SELECT 
  p.id,
  COALESCE(p.full_name, 'Entreprise') || ' - Entreprise',
  COALESCE(p.full_name, 'Utilisateur'),
  p.email,
  true
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM tenants t WHERE t.user_id = p.id
)
AND p.role != 'superadmin' -- Ne pas créer de locataire pour les superadmins
AND p.role != 'admin';     -- Ne pas créer de locataire pour les admins

-- 4️⃣ VÉRIFIER QUE ÇA A FONCTIONNÉ
SELECT 
  t.company_name,
  t.contact_name,
  t.email,
  p.role,
  t.active
FROM tenants t
LEFT JOIN profiles p ON p.id = t.user_id
ORDER BY t.created_at DESC;

-- ✅ Maintenant, à chaque nouvelle inscription :
-- 1. Le profil est créé dans 'profiles'
-- 2. AUTOMATIQUEMENT un locataire est créé dans 'tenants'
-- 3. Il apparaîtra dans la page Locataires
-- 4. L'admin pourra modifier ses informations
