-- ============================================
-- SOLUTION FINALE : 2 TABLES AVEC SYNC CORRECTE
-- ============================================

-- 🎯 OBJECTIF : 
-- - profiles = données authentification (1 user = 1 profil)
-- - tenants = données entreprises (1 user peut avoir N entreprises)

-- ============================================
-- PARTIE 1 : CORRIGER LA TABLE PROFILES
-- ============================================

-- 1️⃣ S'assurer que profiles.email existe et est rempli automatiquement
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,  -- Email depuis auth.users
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'tenant'  -- Rôle par défaut
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2️⃣ Créer/recréer le trigger sur auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 3️⃣ MISE À JOUR : Remplir les emails manquants dans profiles existants
UPDATE profiles p
SET email = au.email
FROM auth.users au
WHERE p.id = au.id
AND (p.email IS NULL OR p.email = '');

-- ============================================
-- PARTIE 2 : SYSTÈME DE CRÉATION DE LOCATAIRES
-- ============================================

-- 4️⃣ Fonction pour créer un locataire (appelée manuellement ou par trigger)
CREATE OR REPLACE FUNCTION create_tenant_for_user(
  p_user_id UUID,
  p_company_name TEXT DEFAULT NULL,
  p_contact_name TEXT DEFAULT NULL,
  p_business_type TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_email TEXT;
  v_full_name TEXT;
  v_phone TEXT;
  v_tenant_id UUID;
BEGIN
  -- Récupérer les infos du profil
  SELECT email, full_name, phone 
  INTO v_email, v_full_name, v_phone
  FROM profiles
  WHERE id = p_user_id;

  -- Valeurs par défaut
  IF p_company_name IS NULL THEN
    p_company_name := COALESCE(v_full_name, 'Entreprise') || ' - Entreprise';
  END IF;
  
  IF p_contact_name IS NULL THEN
    p_contact_name := COALESCE(v_full_name, 'Contact');
  END IF;

  -- Créer le locataire
  INSERT INTO tenants (
    user_id,
    company_name,
    contact_name,
    email,
    phone,
    business_type,
    active
  ) VALUES (
    p_user_id,
    p_company_name,
    p_contact_name,
    v_email,
    v_phone,
    p_business_type,
    true
  )
  RETURNING id INTO v_tenant_id;

  RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5️⃣ Créer automatiquement UN locataire par défaut lors de l'inscription
CREATE OR REPLACE FUNCTION auto_create_first_tenant()
RETURNS TRIGGER AS $$
BEGIN
  -- Créer automatiquement un premier locataire uniquement si rôle = tenant
  IF NEW.role = 'tenant' THEN
    PERFORM create_tenant_for_user(NEW.id);
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Ne pas bloquer l'inscription en cas d'erreur
    RAISE WARNING 'Erreur création locataire auto pour %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6️⃣ Trigger sur profiles pour créer le premier locataire
DROP TRIGGER IF EXISTS on_profile_created_auto_tenant ON profiles;

CREATE TRIGGER on_profile_created_auto_tenant
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_first_tenant();

-- ============================================
-- PARTIE 3 : CRÉER LOCATAIRES POUR USERS EXISTANTS
-- ============================================

-- 7️⃣ Créer un locataire pour chaque utilisateur qui n'en a pas
DO $$
DECLARE
  v_profile RECORD;
BEGIN
  FOR v_profile IN 
    SELECT id, role
    FROM profiles
    WHERE role = 'tenant'
    AND NOT EXISTS (SELECT 1 FROM tenants WHERE user_id = profiles.id)
  LOOP
    PERFORM create_tenant_for_user(v_profile.id);
    RAISE NOTICE 'Locataire créé pour user %', v_profile.id;
  END LOOP;
END $$;

-- ============================================
-- PARTIE 4 : VÉRIFICATION
-- ============================================

-- 8️⃣ Voir tous les utilisateurs et leurs locataires
SELECT 
  p.id as user_id,
  p.email,
  p.full_name,
  p.role,
  COUNT(t.id) as nb_tenants,
  STRING_AGG(t.company_name, ', ') as companies
FROM profiles p
LEFT JOIN tenants t ON t.user_id = p.id
GROUP BY p.id, p.email, p.full_name, p.role
ORDER BY p.created_at DESC;

-- 9️⃣ Voir tous les locataires
SELECT 
  t.id,
  t.company_name,
  t.contact_name,
  t.email,
  t.business_type,
  t.active,
  p.email as user_email,
  p.role as user_role
FROM tenants t
LEFT JOIN profiles p ON p.id = t.user_id
ORDER BY t.created_at DESC;

-- ✅ RÉSUMÉ :
-- 1. profiles.email est maintenant toujours rempli (depuis auth.users)
-- 2. À chaque inscription → 1 profil + 1 locataire par défaut créés
-- 3. L'admin peut créer des locataires supplémentaires via create_tenant_for_user()
-- 4. Un user peut avoir 0, 1 ou N locataires
-- 5. Les users existants ont maintenant leur premier locataire
