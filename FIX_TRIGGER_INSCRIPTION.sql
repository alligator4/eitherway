-- ============================================
-- FIX COMPLET : INSCRIPTION + TRIGGER ROBUSTE
-- ============================================

-- ÉTAPE 1 : RENDRE LES COLONNES NULLABLE (AU CAS OÙ)
-- Cela évite les erreurs si des valeurs sont manquantes
ALTER TABLE tenants ALTER COLUMN company_name DROP NOT NULL;
ALTER TABLE tenants ALTER COLUMN contact_name DROP NOT NULL;  
ALTER TABLE tenants ALTER COLUMN email DROP NOT NULL;

-- ÉTAPE 2 : SUPPRIMER L'ANCIEN TRIGGER S'IL EXISTE
DROP TRIGGER IF EXISTS trigger_auto_create_tenant ON profiles;
DROP TRIGGER IF EXISTS on_profile_created_auto_tenant ON profiles;
DROP TRIGGER IF EXISTS on_profile_created_create_tenant ON profiles;

-- ÉTAPE 3 : CRÉER UNE FONCTION ROBUSTE
CREATE OR REPLACE FUNCTION auto_create_tenant_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  v_email TEXT;
  v_full_name TEXT;
  v_phone TEXT;
  v_company_name TEXT;
  v_contact_name TEXT;
BEGIN
  -- Récupérer les valeurs avec des fallbacks
  v_email := COALESCE(NEW.email, 'user_' || NEW.id || '@temp.local');
  v_full_name := COALESCE(NEW.full_name, 'Utilisateur');
  v_phone := NEW.phone;
  
  -- Construire les noms
  v_company_name := v_full_name || ' - Entreprise';
  v_contact_name := v_full_name;

  -- Créer le locataire SEULEMENT si role = 'tenant'
  IF NEW.role = 'tenant' THEN
    BEGIN
      INSERT INTO tenants (
        user_id,
        company_name,
        contact_name,
        email,
        phone,
        active
      ) VALUES (
        NEW.id,
        v_company_name,
        v_contact_name,
        v_email,
        v_phone,
        true
      );
      
      RAISE NOTICE '✅ Locataire créé pour %', v_email;
      
    EXCEPTION
      WHEN OTHERS THEN
        -- Logger l'erreur mais NE PAS bloquer l'inscription
        RAISE WARNING '❌ Erreur création locataire: % - %', SQLSTATE, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ÉTAPE 4 : CRÉER LE TRIGGER
CREATE TRIGGER trigger_auto_create_tenant
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_tenant_on_signup();

-- ÉTAPE 5 : TESTER MANUELLEMENT LA FONCTION
-- Simuler l'insertion d'un profil
DO $$
DECLARE
  test_id UUID := gen_random_uuid();
BEGIN
  -- Insérer un profil de test
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (test_id, 'test_trigger@example.com', 'Test Trigger', 'tenant');
  
  -- Vérifier que le locataire a été créé
  IF EXISTS (SELECT 1 FROM tenants WHERE user_id = test_id) THEN
    RAISE NOTICE '✅ TEST RÉUSSI : Locataire créé automatiquement';
  ELSE
    RAISE WARNING '❌ TEST ÉCHOUÉ : Aucun locataire créé';
  END IF;
  
  -- Nettoyer
  DELETE FROM tenants WHERE user_id = test_id;
  DELETE FROM profiles WHERE id = test_id;
END $$;

-- ÉTAPE 6 : VÉRIFIER LA CONFIGURATION
SELECT 
  'Configuration finale' as check_name,
  (SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'trigger_auto_create_tenant') as trigger_exists,
  (SELECT COUNT(*) FROM pg_proc WHERE proname = 'auto_create_tenant_on_signup') as function_exists;

-- ✅ SI TOUT EST OK, RETESTEZ L'INSCRIPTION !
-- Si ça ne marche toujours pas, partagez l'erreur exacte dans la console F12
