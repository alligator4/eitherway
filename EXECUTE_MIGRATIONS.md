# 🚀 Guide d'Exécution des Migrations Supabase

## ✅ Checklist Préparation

- [ ] J'ai un compte Supabase (gratuit) sur https://supabase.com
- [ ] Mon projet Supabase est créé
- [ ] J'ai mes clés dans `.env.local` (VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY)

---

## 📝 Étapes d'Exécution

### 1️⃣ Connexion à Supabase

1. **Ouvrez** votre navigateur
2. **Allez sur** https://app.supabase.com
3. **Connectez-vous** avec votre compte
4. **Sélectionnez** votre projet eitherway (ou créez-en un)

---

### 2️⃣ Ouvrir l'Éditeur SQL

Une fois dans votre projet :

1. **Cliquez** sur "**SQL Editor**" dans le menu de gauche (icône </>)
2. **Cliquez** sur "**New Query**" (bouton en haut)

Vous êtes maintenant prêt à exécuter les migrations !

---

## 🗄️ MIGRATION 1 : Schéma Initial

### ⚠️ IMPORTANT
Cette migration crée toutes les tables de base. Elle peut prendre 30-60 secondes.

### 📋 Instructions

1. **Ouvrez** le fichier suivant dans un éditeur de texte :
   ```
   C:\Users\djala_r1l99q2\OneDrive\Bureau\eitherway\supabase\migrations\001_initial_schema.sql
   ```

2. **Sélectionnez TOUT** le contenu (Ctrl+A)

3. **Copiez** (Ctrl+C)

4. **Retournez** dans Supabase SQL Editor

5. **Collez** dans l'éditeur (Ctrl+V)

6. **Cliquez** sur "**RUN**" (ou F5)

7. **Attendez** le message "Success. No rows returned"

### ✅ Vérification

Allez dans "**Table Editor**" (menu gauche), vous devriez voir :
- ✅ profiles
- ✅ tenants
- ✅ shops
- ✅ contracts
- ✅ invoices
- ✅ invoice_items
- ✅ payments
- ✅ notifications
- ✅ audit_logs
- ✅ settings

**Si vous voyez ces 10 tables → Migration 1 réussie ! ✅**

---

## 🔒 MIGRATION 2 : Sécurité RLS

### 📋 Instructions

1. **Cliquez** sur "**New Query**" pour créer une nouvelle requête

2. **Ouvrez** le fichier :
   ```
   C:\Users\djala_r1l99q2\OneDrive\Bureau\eitherway\supabase\migrations\002_row_level_security.sql
   ```

3. **Sélectionnez TOUT** (Ctrl+A)

4. **Copiez** (Ctrl+C)

5. **Collez** dans le nouvel éditeur SQL (Ctrl+V)

6. **Cliquez** sur "**RUN**" (ou F5)

7. **Attendez** le message "Success"

### ✅ Vérification

1. Allez dans "**Authentication**" → "**Policies**" (menu gauche)
2. Sélectionnez une table (ex: "tenants")
3. Vous devriez voir plusieurs politiques :
   - "Admins can view all tenants"
   - "Tenants can view own data"
   - etc.

**Si vous voyez des politiques → Migration 2 réussie ! ✅**

---

## ⚡ MIGRATION 3 : Fonctions & Automatisations

### 📋 Instructions

1. **Cliquez** sur "**New Query**"

2. **Ouvrez** le fichier :
   ```
   C:\Users\djala_r1l99q2\OneDrive\Bureau\eitherway\supabase\migrations\003_functions_and_triggers.sql
   ```

3. **Sélectionnez TOUT** (Ctrl+A)

4. **Copiez** (Ctrl+C)

5. **Collez** dans l'éditeur SQL (Ctrl+V)

6. **Cliquez** sur "**RUN**" (ou F5)

7. **Attendez** le message "Success"

### ✅ Vérification

1. Allez dans "**Database**" → "**Functions**" (menu gauche)
2. Vous devriez voir des fonctions comme :
   - `log_audit`
   - `generate_invoice_number`
   - `generate_contract_number`
   - `generate_monthly_invoices`
   - `auto_renew_contracts`
   - etc.

**Si vous voyez ces fonctions → Migration 3 réussie ! ✅**

---

## 🎉 TOUTES LES MIGRATIONS TERMINÉES !

### Dernières vérifications

#### 1. Vérifier les vues

1. Allez dans "**Database**" → "**Views**"
2. Vous devriez voir :
   - ✅ contracts_full
   - ✅ invoices_full
   - ✅ dashboard_stats

#### 2. Vérifier les données initiales

1. Allez dans "**Table Editor**"
2. Cliquez sur la table "**settings**"
3. Vous devriez voir ~12 lignes de paramètres

---

## 🚀 Prochaine Étape : Créer votre Premier Admin

### Méthode 1 : Via SQL Editor (Recommandé)

1. Ouvrez "**SQL Editor**" → "**New Query**"

2. **INSCRIVEZ-VOUS d'abord** via l'application web (http://localhost:5173/signup)
   - Utilisez votre email
   - Créez un mot de passe

3. Une fois inscrit, **retournez** dans SQL Editor

4. **Exécutez** cette commande (remplacez par VOTRE email) :

```sql
UPDATE profiles
SET role = 'superadmin'
WHERE email = 'votre-email@example.com';
```

5. **Cliquez** "RUN"

6. Vous devriez voir "Success. 1 rows affected"

### Vérification

1. **Déconnectez-vous** de l'application
2. **Reconnectez-vous**
3. Vous devriez maintenant avoir accès à tous les menus admin !

---

## 🎯 Résumé Final

Vous avez maintenant :
- ✅ 10 tables créées
- ✅ 40+ politiques RLS actives
- ✅ 15+ fonctions automatiques
- ✅ 3 vues optimisées
- ✅ Données de configuration initiales
- ✅ Votre compte admin

---

## ❓ En cas de Problème

### Erreur : "relation already exists"

➡️ Les tables existent déjà. Vous pouvez :
- Soit ignorer (tout est OK)
- Soit réinitialiser la DB et recommencer

### Erreur : "permission denied"

➡️ Vérifiez que vous utilisez le bon projet Supabase

### Erreur : "syntax error"

➡️ Vérifiez que vous avez copié TOUT le contenu du fichier SQL

### Les politiques ne s'affichent pas

➡️ Actualisez la page (F5) dans Supabase Dashboard

---

## 📞 Besoin d'Aide ?

1. Consultez `GUIDE_MIGRATION.md` pour plus de détails
2. Consultez `DOCUMENTATION_TECHNIQUE.md` pour l'architecture
3. Vérifiez les logs dans Supabase → Database → Logs

---

**Bon courage ! 🚀**

Une fois les migrations terminées, lancez simplement :
```powershell
npm run dev
```

Et votre application sera 100% opérationnelle !
