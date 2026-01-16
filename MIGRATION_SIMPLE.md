# 🎯 GUIDE ULTRA-SIMPLE - Migrations en 5 Minutes

## 🚀 Étape par Étape (Copier-Coller Facile)

### ✅ AVANT DE COMMENCER

Ouvrez 2 fenêtres côte à côte :
1. **Fenêtre 1** : Votre explorateur de fichiers → `C:\Users\djala_r1l99q2\OneDrive\Bureau\eitherway\supabase\migrations`
2. **Fenêtre 2** : Votre navigateur → https://app.supabase.com

---

## 📌 MIGRATION 1 - Schéma de Base (13 KB)

### Dans l'explorateur Windows :
1. Double-cliquez sur `001_initial_schema.sql`
2. Le fichier s'ouvre dans Notepad
3. Appuyez sur **Ctrl+A** (tout sélectionner)
4. Appuyez sur **Ctrl+C** (copier)

### Dans Supabase :
1. Cliquez sur **"SQL Editor"** (menu gauche)
2. Cliquez sur **"New Query"**
3. Appuyez sur **Ctrl+V** (coller)
4. Cliquez sur **"RUN"** (gros bouton vert)
5. Attendez 30 secondes...
6. ✅ Vous devriez voir **"Success. No rows returned"**

### Vérifier :
- Cliquez sur **"Table Editor"** (menu gauche)
- Vous devez voir **10 tables** : profiles, tenants, shops, contracts, invoices, invoice_items, payments, notifications, audit_logs, settings

---

## 📌 MIGRATION 2 - Sécurité RLS (13 KB)

### Dans l'explorateur Windows :
1. Double-cliquez sur `002_row_level_security.sql`
2. **Ctrl+A** puis **Ctrl+C**

### Dans Supabase :
1. Cliquez sur **"New Query"** (créer une nouvelle requête vide)
2. **Ctrl+V** (coller)
3. **"RUN"**
4. ✅ **"Success"**

### Vérifier :
- Cliquez sur **"Authentication"** → **"Policies"**
- Sélectionnez la table "tenants"
- Vous devez voir plusieurs politiques (ex: "Admins can view all tenants")

---

## 📌 MIGRATION 3 - Fonctions (16 KB)

### Dans l'explorateur Windows :
1. Double-cliquez sur `003_functions_and_triggers.sql`
2. **Ctrl+A** puis **Ctrl+C**

### Dans Supabase :
1. **"New Query"**
2. **Ctrl+V**
3. **"RUN"**
4. ✅ **"Success"**

### Vérifier :
- Cliquez sur **"Database"** → **"Functions"**
- Vous devez voir plein de fonctions (generate_invoice_number, log_audit, etc.)

---

## 🎉 C'EST FINI !

### Dernière étape : Créer votre admin

1. **Ouvrez** http://localhost:5173/signup dans votre navigateur
2. **Inscrivez-vous** avec votre email (ex: admin@example.com)
3. **Retournez** dans Supabase → SQL Editor
4. **Nouvelle requête** et collez :

```sql
UPDATE profiles
SET role = 'superadmin'
WHERE email = 'admin@example.com';
```
*(Remplacez par VOTRE email)*

5. **RUN**
6. ✅ Vous devriez voir **"1 rows affected"**

---

## 🚀 LANCER L'APPLICATION

```powershell
npm run dev
```

Ouvrez http://localhost:5173 et connectez-vous !

---

## ⏱️ Temps Total : ~5 minutes

- Migration 1 : 2 minutes
- Migration 2 : 1 minute  
- Migration 3 : 1 minute
- Créer admin : 1 minute

---

## 🆘 Problèmes ?

### "relation already exists"
✅ Ignorez, c'est OK (la table existe déjà)

### "permission denied"
❌ Vérifiez que vous êtes dans le bon projet Supabase

### Rien ne s'affiche dans l'app
❌ Vérifiez votre `.env.local` :
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

---

## 📝 Checklist Finale

- [ ] Migration 1 exécutée (10 tables créées)
- [ ] Migration 2 exécutée (politiques RLS actives)
- [ ] Migration 3 exécutée (fonctions créées)
- [ ] Compte créé via signup
- [ ] Rôle superadmin attribué
- [ ] Application lancée (npm run dev)
- [ ] Connexion réussie

✅ Tout est coché ? **FÉLICITATIONS !** Votre app est opérationnelle ! 🎉
