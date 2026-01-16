-- ============================================
-- FIX COMPLET : TRIGGER INSCRIPTION SUPABASE
-- ============================================

-- 🎯 COMPRENDRE LE FLOW SUPABASE :
-- 1. User s'inscrit → Supabase crée dans auth.users
-- 2. Trigger sur auth.users → Crée dans profiles
-- 3. Trigger sur profiles → Crée dans tenants

-- ============================================
-- ÉTAPE 1 : VÉRIFIER LES TRIGGERS EXISTANTS
-- ============================================

SELECT 
  'Triggers sur auth.users' as check_name,
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'users'
AND event_object_schema = 'auth';

SELECT 
  'Triggers sur profiles' as check_name,
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'profiles'
AND event_object_schema = 'public';

-- ============================================
-- ÉTAPE 2 : RENDRE LES COLONNES TENANTS NULLABLE
-- ============================================

ALTER TABLE tenants ALTER COLUMN company_name DROP NOT NULL;
ALTER TABLE tenants ALTER COLUMN contact_name DROP NOT NULL;
ALTER TABLE tenants ALTER COLUMN email DROP NOT NULL;

-- ============================================
-- ÉTAPE 3 : CRÉER/MODIFIER LE TRIGGER auth.users → profiles
-- ============================================

-- Fonction pour créer le profil depuis auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'tenant', -- Rôle par défaut
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Créer le nouveau trigger sur auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ÉTAPE 4 : CRÉER LE TRIGGER profiles → tenants
-- ============================================

CREATE OR REPLACE FUNCTION public.auto_create_tenant_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  v_email TEXT;
  v_full_name TEXT;
  v_company_name TEXT;
BEGIN
  -- Valeurs avec fallbacks
  v_email := COALESCE(NEW.email, 'user_' || NEW.id || '@temp.local');
  v_full_name := COALESCE(NEW.full_name, 'Utilisateur');
  v_company_name := v_full_name || ' - Entreprise';

  -- Créer le locataire SEULEMENT si role = 'tenant'
  IF NEW.role = 'tenant' THEN
    INSERT INTO public.tenants (
      user_id,
      company_name,
      contact_name,
      email,
      active,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      v_company_name,
      v_full_name,
      v_email,
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO NOTHING; -- Éviter les doublons
    
    RAISE NOTICE '✅ Locataire créé pour %', v_email;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '❌ Erreur création locataire: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer les anciens triggers
DROP TRIGGER IF EXISTS trigger_auto_create_tenant ON public.profiles;
DROP TRIGGER IF EXISTS on_profile_created_auto_tenant ON public.profiles;

-- Créer le nouveau trigger
CREATE TRIGGER trigger_auto_create_tenant
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_tenant_on_signup();

-- ============================================
-- ÉTAPE 5 : CRÉER LOCATAIRES POUR USERS EXISTANTS
-- ============================================

INSERT INTO public.tenants (user_id, company_name, contact_name, email, active)
SELECT 
  p.id,
  COALESCE(p.full_name, p.email, 'Utilisateur') || ' - Entreprise',
  COALESCE(p.full_name, 'Contact'),
  COALESCE(p.email, 'user_' || p.id || '@temp.local'),
  true
FROM public.profiles p
WHERE p.role = 'tenant'
AND NOT EXISTS (SELECT 1 FROM public.tenants t WHERE t.user_id = p.id)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- ÉTAPE 6 : VÉRIFICATION FINALE
-- ============================================

SELECT 
  'Vérification triggers' as section,
  (SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'on_auth_user_created') as trigger_auth_users,
  (SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'trigger_auto_create_tenant') as trigger_profiles;

SELECT 
  'Vérification données' as section,
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'tenant') as nb_profiles_tenant,
  (SELECT COUNT(*) FROM public.tenants) as nb_tenants,
  (SELECT COUNT(*) FROM public.tenants WHERE user_id IS NULL) as nb_orphelins;

-- ============================================
-- ÉTAPE 7 : SUPPRIMER LOCATAIRES SANS USER
-- ============================================

DELETE FROM public.tenants
WHERE user_id IS NULL
OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = tenants.user_id);

SELECT 'Locataires nettoyés' as message;

-- ✅ TERMINÉ ! Testez maintenant une nouvelle inscription
-- Le flow sera : auth.users → profiles → tenants
