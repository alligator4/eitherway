-- ============================================
-- SOLUTION COMPLÈTE : 1 INSCRIPTION = 1 LOCATAIRE
-- ============================================

-- 🎯 OBJECTIF :
-- - Chaque inscription crée automatiquement un profil + un locataire
-- - Impossible de créer un locataire sans compte utilisateur
-- - Relation 1:1 entre profiles et tenants

-- ============================================
-- ÉTAPE 1 : SUPPRIMER LES LOCATAIRES DE TEST SANS COMPTE
-- ============================================

DELETE FROM tenants
WHERE user_id IS NULL
OR NOT EXISTS (SELECT 1 FROM profiles WHERE id = tenants.user_id);

-- Vérifier la suppression
SELECT 'Locataires restants' as check_name, COUNT(*) as count FROM tenants;

-- ============================================
-- ÉTAPE 2 : CRÉER LE TRIGGER AUTOMATIQUE
-- ============================================

-- Fonction : Créer automatiquement un locataire lors de l'inscription
CREATE OR REPLACE FUNCTION auto_create_tenant_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_full_name TEXT;
  user_phone TEXT;
BEGIN
  -- Récupérer les infos du profil
  user_email := NEW.email;
  user_full_name := COALESCE(NEW.full_name, 'Nouvel utilisateur');
  user_phone := NEW.phone;

  -- Créer automatiquement un locataire UNIQUEMENT si le rôle est 'tenant'
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
      user_phone,
      true
    );
    
    RAISE NOTICE 'Locataire créé automatiquement pour %', user_email;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Logger l'erreur mais ne pas bloquer l'inscription
    RAISE WARNING 'Erreur création locataire pour %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trigger_auto_create_tenant ON profiles;

-- Créer le nouveau trigger
CREATE TRIGGER trigger_auto_create_tenant
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_tenant_on_signup();

-- ============================================
-- ÉTAPE 3 : CRÉER LOCATAIRES POUR UTILISATEURS EXISTANTS
-- ============================================

-- Pour chaque utilisateur avec role='tenant' qui n'a pas de locataire
INSERT INTO tenants (user_id, company_name, contact_name, email, phone, active)
SELECT 
  p.id,
  COALESCE(p.full_name, p.email) || ' - Entreprise',
  COALESCE(p.full_name, 'Contact'),
  p.email,
  p.phone,
  true
FROM profiles p
WHERE p.role = 'tenant'
AND NOT EXISTS (SELECT 1 FROM tenants t WHERE t.user_id = p.id);

-- ============================================
-- ÉTAPE 4 : AJOUTER CONTRAINTE user_id NOT NULL (optionnel)
-- ============================================

-- ⚠️ Décommentez SEULEMENT si vous voulez forcer la liaison
-- Cela empêchera toute création manuelle de locataire sans user_id
/*
ALTER TABLE tenants
ALTER COLUMN user_id SET NOT NULL;
*/

-- ============================================
-- ÉTAPE 5 : VÉRIFICATION FINALE
-- ============================================

-- Voir tous les utilisateurs et leurs locataires
SELECT 
  'VÉRIFICATION FINALE' as section,
  p.email as user_email,
  p.role,
  p.full_name,
  t.company_name,
  t.active as tenant_active
FROM profiles p
LEFT JOIN tenants t ON t.user_id = p.id
ORDER BY p.created_at DESC;

-- Statistiques
SELECT 
  'STATISTIQUES' as section,
  (SELECT COUNT(*) FROM profiles WHERE role = 'tenant') as nb_users_tenant,
  (SELECT COUNT(*) FROM tenants) as nb_locataires,
  (SELECT COUNT(*) FROM tenants WHERE user_id IS NULL) as nb_orphelins;

-- ✅ RÉSULTAT ATTENDU :
-- nb_users_tenant = nb_locataires
-- nb_orphelins = 0

-- ============================================
-- WORKFLOW COMPLET APRÈS CES MODIFICATIONS :
-- ============================================

-- 1. Utilisateur s'inscrit sur /signup
-- 2. Profil créé avec role='tenant' par défaut
-- 3. Trigger auto_create_tenant_on_signup se déclenche
-- 4. Locataire créé automatiquement avec :
--    - user_id lié au profil
--    - company_name = "Nom User - Entreprise"
--    - contact_name = Nom de l'utilisateur
--    - email = Email de l'utilisateur
--    - active = true
-- 5. L'utilisateur peut se connecter et voir ses infos
-- 6. L'admin peut modifier les infos du locataire
-- 7. Un admin peut créer d'autres locataires pour le même user
