# 🔧 Diagnostic et Correction - Page Locataires Vide

## 🔍 Problème : La page locataires ne liste pas les locataires

### Causes possibles :

1. ✅ Les politiques RLS bloquent l'accès
2. ✅ Votre utilisateur n'a pas le bon rôle
3. ✅ La table `tenants` est vide
4. ✅ Les migrations ne sont pas appliquées

---

## 📋 ÉTAPE 1 : Vérifier dans la Console du Navigateur

1. **Ouvrez** votre application (http://localhost:5173)
2. **Allez** sur la page "Locataires"
3. **Appuyez** sur F12 (ouvrir les outils développeur)
4. **Cliquez** sur l'onglet "Console"
5. **Regardez** s'il y a des erreurs en rouge

### Erreurs possibles :

#### ❌ "Error chargement locataires: ... row-level security policy"
➡️ **Problème RLS** - Votre utilisateur n'a pas les permissions

#### ❌ "Error chargement locataires: ... relation tenants does not exist"
➡️ **Table manquante** - Les migrations ne sont pas appliquées

#### ✅ Pas d'erreur, mais liste vide
➡️ **Table vide** - Aucun locataire dans la base

---

## 🛠️ SOLUTION 1 : Vérifier votre rôle d'utilisateur

### Dans Supabase SQL Editor :

```sql
-- Vérifier votre rôle actuel
SELECT id, email, role, active 
FROM profiles 
WHERE email = 'VOTRE_EMAIL@example.com';
```

**Résultat attendu :**
- `role` doit être `'admin'` ou `'superadmin'`
- `active` doit être `true`

### Si votre rôle n'est pas admin :

```sql
-- Définir votre rôle en admin
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'VOTRE_EMAIL@example.com';
```

**Puis déconnectez-vous et reconnectez-vous !**

---

## 🛠️ SOLUTION 2 : Vérifier que la table existe

### Dans Supabase SQL Editor :

```sql
-- Vérifier si la table tenants existe
SELECT COUNT(*) as nombre_locataires FROM tenants;
```

**Si erreur "relation tenants does not exist" :**
➡️ Les migrations ne sont pas appliquées. Retournez au guide MIGRATION_SIMPLE.md

**Si résultat = 0 :**
➡️ La table existe mais est vide. Créez des locataires de test (voir Solution 3)

---

## 🛠️ SOLUTION 3 : Créer des locataires de test

### Dans Supabase SQL Editor :

```sql
-- Créer 3 locataires de test
INSERT INTO tenants (company_name, contact_name, email, phone, business_type, active)
VALUES 
  ('Boutique Mode Paris', 'Sophie Dubois', 'sophie@mode-paris.fr', '0612345678', 'Prêt-à-porter', true),
  ('Restaurant Le Gourmet', 'Jean Martin', 'jean@legourmet.fr', '0623456789', 'Restauration', true),
  ('Librairie du Centre', 'Marie Lefebvre', 'marie@librairie-centre.fr', '0634567890', 'Commerce de détail', true);
```

**Puis rafraîchissez la page (F5) dans votre application !**

---

## 🛠️ SOLUTION 4 : Désactiver temporairement RLS (pour tester)

### ⚠️ UNIQUEMENT POUR LE DÉBOGAGE - NE PAS LAISSER EN PRODUCTION

### Dans Supabase SQL Editor :

```sql
-- Désactiver RLS temporairement
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
```

**Rafraîchissez votre application. Si les locataires s'affichent maintenant :**
➡️ Le problème vient des politiques RLS

**Réactivez RLS immédiatement :**

```sql
-- Réactiver RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
```

---

## 🛠️ SOLUTION 5 : Vérifier/Recréer les politiques RLS

### Dans Supabase SQL Editor :

```sql
-- Supprimer les anciennes politiques (si elles existent)
DROP POLICY IF EXISTS "Admins can view all tenants" ON tenants;
DROP POLICY IF EXISTS "Tenants can view own data" ON tenants;
DROP POLICY IF EXISTS "Admins can insert tenants" ON tenants;
DROP POLICY IF EXISTS "Admins can update tenants" ON tenants;
DROP POLICY IF EXISTS "Tenants can update own contact info" ON tenants;
DROP POLICY IF EXISTS "Admins can delete tenants" ON tenants;

-- Recréer les politiques correctes
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
```

**Puis déconnectez-vous et reconnectez-vous !**

---

## 🛠️ SOLUTION 6 : Vérifier votre connexion Supabase

### Dans votre fichier `.env.local` :

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

**Vérifiez que :**
- ✅ Les valeurs sont correctes (depuis votre projet Supabase)
- ✅ Il n'y a pas d'espaces avant/après
- ✅ Les guillemets ne sont PAS inclus dans les valeurs

**Si vous modifiez `.env.local` :**
1. Arrêtez le serveur (Ctrl+C)
2. Relancez : `npm run dev`

---

## 📊 SOLUTION RAPIDE : Script de Diagnostic Complet

### Copiez-collez ceci dans Supabase SQL Editor :

```sql
-- === DIAGNOSTIC COMPLET ===

-- 1. Vérifier votre profil
SELECT '=== VOTRE PROFIL ===' as diagnostic;
SELECT id, email, role, active 
FROM profiles 
WHERE id = auth.uid();

-- 2. Vérifier la table tenants
SELECT '=== TABLE TENANTS ===' as diagnostic;
SELECT COUNT(*) as total_locataires FROM tenants;

-- 3. Vérifier les politiques RLS
SELECT '=== POLITIQUES RLS ===' as diagnostic;
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'tenants';

-- 4. Tester la requête directe
SELECT '=== TEST REQUÊTE ===' as diagnostic;
SELECT id, company_name, contact_name, email, active
FROM tenants
LIMIT 5;
```

**Envoyez-moi le résultat et je pourrai vous aider davantage !**

---

## ✅ CHECKLIST DE VÉRIFICATION

Avant de continuer, vérifiez :

- [ ] Votre utilisateur a le rôle `'admin'` ou `'superadmin'`
- [ ] La table `tenants` existe
- [ ] La table `tenants` contient des données
- [ ] RLS est activé sur la table `tenants`
- [ ] Les politiques RLS sont créées
- [ ] Vous êtes bien connecté (vérifiez dans l'onglet Network des DevTools)
- [ ] Pas d'erreurs dans la console du navigateur
- [ ] Votre `.env.local` contient les bonnes clés
- [ ] Vous vous êtes déconnecté/reconnecté après avoir changé le rôle

---

## 🎯 SOLUTION ULTIME (si rien ne fonctionne)

### Réinitialisation complète :

1. **Sauvegardez** vos données importantes (si vous en avez)

2. **Dans Supabase SQL Editor** :

```sql
-- Supprimer et recréer la table tenants
DROP TABLE IF EXISTS tenants CASCADE;

-- Recréer la table
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  business_type TEXT,
  tax_id TEXT,
  registration_number TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'France',
  notes TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Activer RLS
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

-- Créer des données de test
INSERT INTO tenants (company_name, contact_name, email, phone, business_type, active)
VALUES 
  ('Boutique Mode Paris', 'Sophie Dubois', 'sophie@mode-paris.fr', '0612345678', 'Prêt-à-porter', true),
  ('Restaurant Le Gourmet', 'Jean Martin', 'jean@legourmet.fr', '0623456789', 'Restauration', true),
  ('Librairie du Centre', 'Marie Lefebvre', 'marie@librairie-centre.fr', '0634567890', 'Commerce de détail', true);
```

3. **Rafraîchissez** votre application (F5)

---

## 📞 Besoin d'aide supplémentaire ?

Envoyez-moi :
1. Les erreurs dans la console (F12 → Console)
2. Le résultat du script de diagnostic
3. Votre rôle utilisateur (résultat de `SELECT role FROM profiles WHERE id = auth.uid()`)

Je vous aiderai à résoudre le problème ! 🚀
