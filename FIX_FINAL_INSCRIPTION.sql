-- ============================================
-- FIX FINAL : CONTRAINTE UNIQUE + TRIGGERS
-- ============================================

-- ÉTAPE 1 : AJOUTER LA CONTRAINTE UNIQUE SUR tenants.user_id
-- (Nécessaire pour ON CONFLICT)
ALTER TABLE tenants
ADD CONSTRAINT tenants_user_id_unique UNIQUE (user_id);

-- ÉTAPE 2 : RENDRE LES COLONNES NULLABLE
ALTER TABLE tenants ALTER COLUMN company_name DROP NOT NULL;
ALTER TABLE tenants ALTER COLUMN contact_name DROP NOT NULL;
ALTER TABLE tenants ALTER COLUMN email DROP NOT NULL;

-- ÉTAPE 3 : TRIGGER 1 - auth.users → profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'tenant',
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ÉTAPE 4 : TRIGGER 2 - profiles → tenants
CREATE OR REPLACE FUNCTION public.auto_create_tenant_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  v_email TEXT;
  v_full_name TEXT;
  v_company_name TEXT;
BEGIN
  v_email := COALESCE(NEW.email, 'user_' || NEW.id || '@temp.local');
  v_full_name := COALESCE(NEW.full_name, 'Utilisateur');
  v_company_name := v_full_name || ' - Entreprise';

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
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE '✅ Locataire créé pour %', v_email;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '❌ Erreur création locataire: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_auto_create_tenant ON public.profiles;
DROP TRIGGER IF EXISTS on_profile_created_auto_tenant ON public.profiles;
DROP TRIGGER IF EXISTS on_profile_created_create_tenant ON public.profiles;

CREATE TRIGGER trigger_auto_create_tenant
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_tenant_on_signup();

-- ÉTAPE 5 : CRÉER LOCATAIRES POUR USERS EXISTANTS
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

-- ÉTAPE 6 : SUPPRIMER LOCATAIRES ORPHELINS
DELETE FROM public.tenants
WHERE user_id IS NULL
OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = tenants.user_id);

-- ÉTAPE 7 : VÉRIFICATIONS
SELECT 
  'Configuration triggers' as check_name,
  (SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'on_auth_user_created') as trigger_auth,
  (SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'trigger_auto_create_tenant') as trigger_profiles;

SELECT 
  'État des données' as check_name,
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'tenant') as nb_profiles,
  (SELECT COUNT(*) FROM public.tenants) as nb_tenants,
  (SELECT COUNT(*) FROM public.tenants WHERE user_id IS NULL) as nb_orphelins;

SELECT 
  'Contrainte UNIQUE' as check_name,
  COUNT(*) as constraint_exists
FROM information_schema.table_constraints
WHERE table_name = 'tenants'
AND constraint_name = 'tenants_user_id_unique';

-- ✅ TOUT EST PRÊT ! Testez maintenant l'inscription
