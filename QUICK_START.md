# 🚀 Guide de Démarrage Rapide - Eitherway

## ⚡ Installation en 5 minutes

### 1️⃣ Cloner et installer

```bash
cd C:\Users\djala_r1l99q2\OneDrive\Bureau\eitherway
npm install
```

### 2️⃣ Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un compte (gratuit)
3. Cliquez sur "New Project"
4. Notez ces informations :
   - Project URL : `https://xxxxx.supabase.co`
   - Anon Key : `eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp...`
   - Service Role Key : `eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp...`

### 3️⃣ Configurer les variables d'environnement

Créez `.env.local` à la racine du projet :

```env
VITE_SUPABASE_URL=https://votre-project.supabase.co
VITE_SUPABASE_ANON_KEY=votre_anon_key_ici
```

### 4️⃣ Exécuter les migrations

Dans votre projet Supabase :

1. Cliquez sur "SQL Editor" (menu gauche)
2. Cliquez sur "New Query"
3. Copiez-collez le contenu de `supabase/migrations/001_initial_schema.sql`
4. Cliquez "Run" (ou F5)
5. Répétez pour `002_row_level_security.sql`
6. Répétez pour `003_functions_and_triggers.sql`

✅ Vous devriez voir "Success" pour chaque migration

### 5️⃣ Lancer l'application

```bash
npm run dev
```

Ouvrez [http://localhost:5173](http://localhost:5173)

---

## 👤 Créer votre premier admin

1. Inscrivez-vous via l'interface (signup)
2. Dans Supabase SQL Editor, exécutez :

```sql
UPDATE profiles
SET role = 'superadmin'
WHERE email = 'votre-email@example.com';
```

3. Déconnectez-vous et reconnectez-vous

---

## 📋 Checklist de Configuration

### Essentiel (pour démarrer)
- [ ] ✅ Projet Supabase créé
- [ ] ✅ Variables d'environnement configurées (`.env.local`)
- [ ] ✅ 3 migrations exécutées
- [ ] ✅ Application lancée (`npm run dev`)
- [ ] ✅ Premier admin créé

### Optionnel (pour production)
- [ ] Configuration Resend pour emails
- [ ] Edge Functions déployées
- [ ] Tâches cron configurées
- [ ] Application déployée (Vercel/Netlify)
- [ ] Domaine personnalisé configuré

---

## 🎯 Commandes Utiles

### Développement
```bash
npm run dev          # Lancer en développement (port 5173)
npm run build        # Build production
npm run preview      # Prévisualiser le build
```

### Supabase CLI (optionnel mais recommandé)
```bash
# Installation
npm install -g supabase

# Login
supabase login

# Lier le projet
supabase link --project-ref votre-ref

# Appliquer les migrations
supabase db push

# Déployer Edge Functions
supabase functions deploy send-email --no-verify-jwt
supabase functions deploy scheduled-tasks --no-verify-jwt
```

### Git
```bash
git add .
git commit -m "Initial setup"
git push origin main
```

### Déploiement Vercel
```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## 🔧 Troubleshooting Rapide

### ❌ Erreur "Invalid API Key"
➡️ Vérifiez que `.env.local` contient les bonnes clés Supabase

### ❌ Migrations échouent
➡️ Vérifiez qu'aucune table n'existe déjà. Réinitialisez la DB si nécessaire.

### ❌ "No rows returned" après signup
➡️ Normal ! Le trigger crée le profil automatiquement. Rafraîchissez la page.

### ❌ Impossible de se connecter
➡️ Vérifiez que l'email est confirmé dans Supabase Auth > Users

### ❌ RLS bloque les requêtes
➡️ Vérifiez que votre utilisateur a le bon rôle dans la table `profiles`

---

## 📊 Vérification de l'Installation

### Tables créées (10)
Dans Supabase > Table Editor, vous devriez voir :
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

### Vues créées (3)
Dans Supabase > Database > Views :
- ✅ contracts_full
- ✅ invoices_full
- ✅ dashboard_stats

### Fonctions créées
Dans Supabase > Database > Functions :
- ✅ log_audit
- ✅ update_updated_at_column
- ✅ handle_new_user
- ✅ generate_invoice_number
- ✅ generate_contract_number
- ✅ calculate_invoice_totals
- ✅ update_invoice_payment_status
- ✅ generate_monthly_invoices
- ✅ auto_renew_contracts
- ✅ send_payment_reminders
- ✅ mark_overdue_invoices
- ✅ create_notification
- Et plus...

---

## 🎨 Première Utilisation

### 1. Créer des locataires
1. Allez sur "Locataires" (menu)
2. Cliquez "Ajouter un locataire"
3. Remplissez le formulaire
4. Enregistrez

### 2. Créer des locaux
1. Allez sur "Locaux"
2. Cliquez "Ajouter un local"
3. Remplissez (numéro, surface, loyer...)
4. Enregistrez

### 3. Créer un contrat
1. Allez sur "Contrats"
2. Cliquez "Nouveau contrat"
3. Sélectionnez locataire et local
4. Définissez dates et loyer
5. Enregistrez

✅ Le numéro de contrat est généré automatiquement : `CT-2026-00001`

### 4. Générer des factures
Automatique le 1er de chaque mois via la fonction cron OU manuellement :

```sql
SELECT generate_monthly_invoices();
```

---

## 🚀 Déploiement Production

### Option 1 : Vercel (recommandé)

```bash
# 1. Installer CLI
npm i -g vercel

# 2. Se connecter
vercel login

# 3. Déployer
vercel --prod

# 4. Ajouter les variables d'environnement
# Dans Vercel Dashboard > Settings > Environment Variables
# Ajouter VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
```

### Option 2 : Netlify

```bash
# 1. Installer CLI
npm install -g netlify-cli

# 2. Se connecter
netlify login

# 3. Déployer
netlify deploy --prod

# 4. Configurer les variables
# Dans Netlify Dashboard > Site settings > Environment variables
```

---

## 📚 Documentation Complète

- **[README.md](./README.md)** - Vue d'ensemble du projet
- **[GUIDE_MIGRATION.md](./GUIDE_MIGRATION.md)** - Guide détaillé (configuration, déploiement, troubleshooting)
- **[DOCUMENTATION_TECHNIQUE.md](./DOCUMENTATION_TECHNIQUE.md)** - Architecture, API, sécurité
- **[RESUME_COMPLET.md](./RESUME_COMPLET.md)** - Résumé de toutes les fonctionnalités

---

## 🎉 C'est Parti !

Vous êtes maintenant prêt à gérer votre centre commercial avec Eitherway !

**Prochaines étapes recommandées :**
1. Créez quelques données de test
2. Explorez le dashboard
3. Testez la génération de factures
4. Configurez les emails (Resend)
5. Déployez en production

**Besoin d'aide ?** Consultez [GUIDE_MIGRATION.md](./GUIDE_MIGRATION.md)

---

**Développé avec ❤️ pour simplifier la gestion immobilière**
