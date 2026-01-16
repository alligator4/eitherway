-- ============================================
-- CRÉATION AUTOMATIQUE DU LOCATAIRE (VERSION CORRIGÉE)
-- ============================================

-- 1️⃣ FONCTION CORRIGÉE QUI RÉCUPÈRE L'EMAIL DEPUIS auth.users
CREATE OR REPLACE FUNCTION create_tenant_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_full_name TEXT;
BEGIN
  -- Récupérer l'email depuis auth.users (source de vérité)
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.id;

  -- Si pas d'email dans auth.users, utiliser celui du profil
  IF user_email IS NULL THEN
    user_email := NEW.email;
  END IF;

  -- Si toujours NULL, générer un email temporaire
  IF user_email IS NULL THEN
    user_email := 'user_' || NEW.id || '@temp.local';
  END IF;

  -- Récupérer le nom
  user_full_name := COALESCE(NEW.full_name, 'Utilisateur');

  -- Créer le locataire uniquement si le rôle est 'tenant'
  IF NEW.role = 'tenant' THEN
    INSERT INTO tenants (
      user_id,
      company_name,
      contact_name,
      email,
      phone,
      active
    ) VALUES (
      NEW.id,
      user_full_name || ' - Entreprise',
      user_full_name,
      user_email,
      NEW.phone,
      true
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur, on log mais on ne bloque pas l'inscription
    RAISE WARNING 'Erreur création locataire pour user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2️⃣ RECRÉER LE TRIGGER
DROP TRIGGER IF EXISTS on_profile_created_create_tenant ON profiles;

CREATE TRIGGER on_profile_created_create_tenant
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_tenant_on_signup();

-- 3️⃣ CRÉER DES LOCATAIRES POUR LES UTILISATEURS EXISTANTS
-- (Avec gestion des emails manquants)
INSERT INTO tenants (user_id, company_name, contact_name, email, phone, active)
SELECT 
  p.id,
  COALESCE(p.full_name, 'Entreprise') || ' - Entreprise',
  COALESCE(p.full_name, 'Utilisateur'),
  COALESCE(p.email, au.email, 'user_' || p.id || '@temp.local'),
  p.phone,
  true
FROM profiles p
LEFT JOIN auth.users au ON au.id = p.id
WHERE NOT EXISTS (
  SELECT 1 FROM tenants t WHERE t.user_id = p.id
)
AND p.role = 'tenant'; -- Seulement les utilisateurs avec rôle 'tenant'

-- 4️⃣ VÉRIFIER LE RÉSULTAT
SELECT 
  t.id,
  t.company_name,
  t.contact_name,
  t.email,
  p.role,
  t.active,
  t.created_at
FROM tenants t
LEFT JOIN profiles p ON p.id = t.user_id
ORDER BY t.created_at DESC;

-- ✅ RÉSUMÉ DES CHANGEMENTS :
-- 1. Récupère l'email depuis auth.users (fiable)
-- 2. Fallback sur profiles.email si nécessaire
-- 3. Génère un email temporaire en dernier recours
-- 4. Ne crée un locataire QUE si role = 'tenant'
-- 5. Ne bloque pas l'inscription en cas d'erreur
