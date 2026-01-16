# Guide de Migration et Configuration - Eitherway Property Management

## Table des matières
1. [Prérequis](#prérequis)
2. [Configuration Supabase](#configuration-supabase)
3. [Variables d'environnement](#variables-denvironnement)
4. [Migrations de base de données](#migrations-de-base-de-données)
5. [Edge Functions](#edge-functions)
6. [Tâches automatiques (Cron)](#tâches-automatiques-cron)
7. [Déploiement](#déploiement)
8. [Post-installation](#post-installation)

---

## Prérequis

- Node.js 18+ et npm/pnpm
- Compte Supabase (gratuit pour commencer)
- Compte Resend pour l'envoi d'emails (optionnel mais recommandé)
- Git

## Configuration Supabase

### 1. Créer un projet Supabase

1. Rendez-vous sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Notez les informations suivantes :
   - **Project URL** : `https://xxxxx.supabase.co`
   - **Anon/Public Key** : `eyJhbGciOiJIUzI1...`
   - **Service Role Key** : `eyJhbGciOiJIUzI1...` (à garder secret)

### 2. Exécuter les migrations

Les migrations se trouvent dans le dossier `supabase/migrations/`. Elles doivent être exécutées dans l'ordre :

#### Option A : Via l'interface Supabase (recommandé pour débuter)

1. Allez dans votre projet Supabase
2. Cliquez sur "SQL Editor" dans le menu latéral
3. Créez une nouvelle requête
4. Copiez-collez le contenu de chaque migration dans l'ordre :
   - `001_initial_schema.sql`
   - `002_row_level_security.sql`
   - `003_functions_and_triggers.sql`
5. Exécutez chaque migration une par une

#### Option B : Via Supabase CLI

```bash
# Installer Supabase CLI
npm install -g supabase

# Se connecter
supabase login

# Lier le projet
supabase link --project-ref votre-project-ref

# Appliquer les migrations
supabase db push
```

### 3. Vérifier l'installation

Après les migrations, vérifiez que :
- Toutes les tables sont créées (profiles, tenants, shops, contracts, invoices, etc.)
- Les politiques RLS sont actives
- Les fonctions et triggers sont créés
- La vue `dashboard_stats` existe

## Variables d'environnement

### Fichier `.env.local`

Créez un fichier `.env.local` à la racine du projet :

```env
# Supabase
VITE_SUPABASE_URL=https://votre-project.supabase.co
VITE_SUPABASE_ANON_KEY=votre_anon_key

# Optionnel : Service Role Key (uniquement pour les Edge Functions)
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key

# Resend (pour l'envoi d'emails)
RESEND_API_KEY=re_xxxxxxxxx
```

### Configuration Resend (Email)

1. Créez un compte sur [resend.com](https://resend.com)
2. Vérifiez votre domaine (ou utilisez leur domaine de test)
3. Générez une API Key
4. Ajoutez-la dans `.env.local`

## Migrations de base de données

### Structure des migrations

```
supabase/migrations/
├── 001_initial_schema.sql       # Tables principales
├── 002_row_level_security.sql   # Politiques de sécurité
└── 003_functions_and_triggers.sql # Fonctions et automatisations
```

### Fonctionnalités incluses

#### Tables créées :
- `profiles` : Profils utilisateurs avec rôles
- `tenants` : Locataires/commerçants
- `shops` : Locaux commerciaux
- `contracts` : Contrats de location
- `invoices` : Factures
- `invoice_items` : Lignes de facture
- `payments` : Paiements
- `notifications` : Notifications in-app
- `audit_logs` : Logs d'audit
- `settings` : Paramètres système

#### Fonctions automatiques :
- Génération auto des numéros de contrat/facture
- Calcul automatique des totaux de facture
- Mise à jour du statut des contrats
- Mise à jour du statut des locaux
- Renouvellement automatique des contrats
- Génération mensuelle des factures
- Rappels de paiement
- Logs d'audit automatiques

## Edge Functions

### Déploiement des Edge Functions

```bash
# Déployer la fonction d'envoi d'email
supabase functions deploy send-email --no-verify-jwt

# Déployer la fonction de tâches planifiées
supabase functions deploy scheduled-tasks --no-verify-jwt
```

### Configuration des secrets

```bash
# Configurer la clé Resend
supabase secrets set RESEND_API_KEY=re_xxxxxxxxx
```

### Tester les fonctions

```bash
# Tester l'envoi d'email
curl -X POST 'https://votre-project.supabase.co/functions/v1/send-email' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer votre_anon_key' \
  -d '{
    "to": "test@example.com",
    "subject": "Test",
    "html": "<p>Test email</p>",
    "type": "system"
  }'
```

## Tâches automatiques (Cron)

### Configuration pg_cron

1. Dans votre projet Supabase, allez dans "Database" > "Extensions"
2. Activez l'extension `pg_cron`
3. Exécutez le SQL suivant pour configurer les tâches :

```sql
-- Tâche quotidienne à 1h du matin (génération factures le 1er du mois)
SELECT cron.schedule(
  'generate-monthly-invoices',
  '0 1 * * *',
  $$
    SELECT net.http_post(
      url := 'https://votre-project.supabase.co/functions/v1/scheduled-tasks',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer votre_service_role_key"}'::jsonb
    );
  $$
);

-- Tâche quotidienne pour les rappels de paiement (8h du matin)
SELECT cron.schedule(
  'payment-reminders',
  '0 8 * * *',
  'SELECT send_payment_reminders();'
);

-- Tâche quotidienne pour marquer les factures en retard (minuit)
SELECT cron.schedule(
  'mark-overdue-invoices',
  '0 0 * * *',
  'SELECT mark_overdue_invoices();'
);
```

### Alternative : GitHub Actions

Créez `.github/workflows/scheduled-tasks.yml` :

```yaml
name: Scheduled Tasks

on:
  schedule:
    - cron: '0 1 * * *' # Tous les jours à 1h UTC

jobs:
  run-tasks:
    runs-on: ubuntu-latest
    steps:
      - name: Call scheduled tasks function
        run: |
          curl -X POST '${{ secrets.SUPABASE_URL }}/functions/v1/scheduled-tasks' \
            -H 'Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_KEY }}'
```

## Déploiement

### Option 1 : Vercel (Recommandé)

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer
vercel --prod
```

Configuration Vercel :
- Framework Preset : Vite
- Build Command : `npm run build`
- Output Directory : `dist`
- Install Command : `npm install`

Ajoutez les variables d'environnement dans Vercel :
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Option 2 : Netlify

```bash
# Installer Netlify CLI
npm install -g netlify-cli

# Se connecter
netlify login

# Déployer
netlify deploy --prod
```

Fichier `netlify.toml` :

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Option 3 : Docker

Créez un `Dockerfile` :

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Post-installation

### 1. Créer un premier utilisateur admin

```sql
-- Connectez-vous au SQL Editor de Supabase
-- Remplacez l'email par celui de votre premier admin

UPDATE profiles
SET role = 'superadmin'
WHERE email = 'votre-email@example.com';
```

### 2. Configurer les paramètres système

Les paramètres par défaut sont déjà créés via la migration. Vous pouvez les modifier :

```sql
UPDATE settings SET value = '"Votre Centre Commercial"'
WHERE key = 'company_name';

UPDATE settings SET value = '"Votre adresse"'
WHERE key = 'company_address';
```

### 3. Tester l'application

1. Connectez-vous avec votre compte admin
2. Créez quelques locataires de test
3. Créez des locaux
4. Créez des contrats
5. Vérifiez que les factures se génèrent automatiquement

### 4. Configuration de production

- [ ] Activez l'authentification par email (Supabase Auth)
- [ ] Configurez les templates d'email dans Supabase
- [ ] Activez la sauvegarde automatique de la base de données
- [ ] Configurez les alertes de monitoring
- [ ] Testez les Edge Functions
- [ ] Configurez un domaine personnalisé

## Dépannage

### Les migrations échouent

- Vérifiez que vous êtes connecté au bon projet
- Vérifiez qu'aucune table n'existe déjà
- Exécutez les migrations une par une pour identifier le problème

### Les Edge Functions ne fonctionnent pas

- Vérifiez que les secrets sont configurés
- Vérifiez les logs dans Supabase Dashboard > Edge Functions > Logs
- Testez avec `supabase functions serve` en local

### Les emails ne partent pas

- Vérifiez que `RESEND_API_KEY` est bien configuré
- Vérifiez que votre domaine est vérifié dans Resend
- Consultez les logs Resend pour voir les erreurs

### RLS bloque les requêtes

- Vérifiez que l'utilisateur est bien authentifié
- Vérifiez le rôle de l'utilisateur dans la table `profiles`
- Consultez les logs PostgreSQL pour voir quelle politique bloque

## Support

Pour toute question :
- Documentation Supabase : https://supabase.com/docs
- Documentation Resend : https://resend.com/docs
- Issues GitHub : [votre-repo]/issues

---

**Version:** 1.0.0  
**Dernière mise à jour:** 2026-01-14
