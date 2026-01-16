-- ============================================
-- ANALYSE : PROFILES vs TENANTS
-- ============================================

-- 1️⃣ Voir tous les utilisateurs (profiles)
SELECT 
  'UTILISATEURS (profiles)' as section,
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles
ORDER BY created_at DESC;

-- 2️⃣ Voir tous les locataires (tenants)
SELECT 
  'LOCATAIRES (tenants)' as section,
  id,
  user_id,
  company_name,
  contact_name,
  email,
  active,
  created_at
FROM tenants
ORDER BY created_at DESC;

-- 3️⃣ Voir les locataires SANS compte utilisateur (problème)
SELECT 
  '⚠️ LOCATAIRES SANS COMPTE' as section,
  t.id,
  t.company_name,
  t.email,
  t.user_id as user_id_dans_tenant
FROM tenants t
WHERE t.user_id IS NULL
OR NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = t.user_id);

-- 4️⃣ Voir les utilisateurs SANS locataire (problème aussi)
SELECT 
  '⚠️ UTILISATEURS SANS LOCATAIRE' as section,
  p.id,
  p.email,
  p.role
FROM profiles p
WHERE p.role = 'tenant'
AND NOT EXISTS (SELECT 1 FROM tenants t WHERE t.user_id = p.id);

-- 5️⃣ Compter les incohérences
SELECT 
  'STATISTIQUES' as section,
  (SELECT COUNT(*) FROM profiles WHERE role = 'tenant') as nb_users_tenant,
  (SELECT COUNT(*) FROM tenants) as nb_locataires,
  (SELECT COUNT(*) FROM tenants WHERE user_id IS NULL) as nb_locataires_sans_user;

-- ✅ RÉSULTAT ATTENDU :
-- - nb_users_tenant = nb_locataires
-- - nb_locataires_sans_user = 0
-- Si ce n'est pas le cas, il faut synchroniser !
