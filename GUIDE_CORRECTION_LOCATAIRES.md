# 🔧 GUIDE RAPIDE - CORRECTION PAGE LOCATAIRES

## 📋 ÉTAPE 1 : DIAGNOSTIC
1. Ouvrez Supabase SQL Editor
2. Copiez-collez le contenu de `DIAGNOSTIC_COMPLET.sql`
3. Exécutez et notez les résultats

## 📋 ÉTAPE 2 : CORRECTION RLS
Si RLS n'est pas activé ou les politiques manquent :
1. Copiez-collez le contenu de `ACTIVER_RLS_TENANTS.sql`
2. Exécutez dans Supabase SQL Editor

## 📋 ÉTAPE 3 : CRÉATION LOCATAIRES
Si vous n'avez pas de locataires :
```sql
-- Créer des locataires de test
INSERT INTO tenants (company_name, contact_name, email, active)
VALUES
  ('Boutique Test', 'Jean Dupont', 'jean@test.fr', true),
  ('Restaurant Test', 'Marie Martin', 'marie@test.fr', true);
```

## 📋 ÉTAPE 4 : VÉRIFICATION
1. Rafraîchissez votre application (F5)
2. Allez sur la page "Locataires"
3. Vous devriez voir la liste !

---

## 🔍 RÉSULTATS ATTENDUS DU DIAGNOSTIC

### ✅ BON RÉSULTAT :
- `Nombre de locataires: 2` (ou plus)
- `RLS Status: tenants | true`
- Politiques RLS présentes

### ❌ MAUVAIS RÉSULTAT :
- `Nombre de locataires: 0` → Pas de données
- `RLS Status: tenants | false` → RLS désactivé
- Pas de politiques RLS → Permissions manquantes

---

## 🚨 SI ÇA NE MARCHE PAS

1. **Vérifiez votre rôle :**
```sql
SELECT role FROM profiles WHERE id = auth.uid();
```
Doit retourner `admin` ou `manager`

2. **Si rôle incorrect :**
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'votre-email@example.com';
```

3. **Déconnectez-vous et reconnectez-vous**

---

## 📞 BESOIN D'AIDE ?
Exécutez le diagnostic et dites-moi exactement ce que vous voyez !