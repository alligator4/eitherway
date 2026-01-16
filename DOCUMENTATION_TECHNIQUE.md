# Documentation Technique - Eitherway Property Management

## Vue d'ensemble

Eitherway est une application web complète de gestion immobilière pour centres commerciaux, construite avec React, Vite, Tailwind CSS et Supabase.

## Architecture

### Stack Technique

**Frontend:**
- React 18.3.1
- Vite (Build tool)
- React Router DOM 6.22.0
- Tailwind CSS 3.4.1
- Lucide React (Icônes)
- date-fns 3.6.0 (Manipulation dates)

**Backend:**
- Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- PostgreSQL avec Row Level Security (RLS)
- Edge Functions Deno

**Déploiement:**
- Vercel / Netlify (Frontend)
- Supabase Cloud (Backend)

### Architecture des données

```
┌─────────────┐
│   profiles  │ (Utilisateurs avec rôles)
└──────┬──────┘
       │
       ├─────────┐
       │         │
┌──────▼──────┐  │
│   tenants   │  │  (Locataires)
└──────┬──────┘  │
       │         │
       ├─────────┼─────────┐
       │         │         │
┌──────▼──────┐  │  ┌──────▼──────┐
│  contracts  │◄─┼──┤    shops    │ (Locaux)
└──────┬──────┘  │  └─────────────┘
       │         │
       ├─────────┘
       │
┌──────▼──────┐
│  invoices   │ (Factures)
└──────┬──────┘
       │
       ├──────────┬──────────┐
       │          │          │
┌──────▼──────┐   │   ┌──────▼──────┐
│invoice_items│   │   │  payments   │
└─────────────┘   │   └─────────────┘
                  │
           ┌──────▼──────┐
           │notifications│
           └─────────────┘
```

## Sécurité

### Row Level Security (RLS)

Toutes les tables utilisent RLS pour contrôler l'accès aux données :

#### Rôles disponibles :
- **superadmin** : Accès total
- **admin** : Gestion complète (sauf configuration système)
- **manager** : Gestion quotidienne
- **tenant** : Accès limité à ses propres données

#### Exemples de politiques :

```sql
-- Les admins voient tous les locataires
CREATE POLICY "Admins can view all tenants"
  ON tenants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'manager')
    )
  );

-- Les locataires voient uniquement leurs données
CREATE POLICY "Tenants can view own data"
  ON tenants FOR SELECT
  USING (user_id = auth.uid());
```

### Authentification

Supabase Auth gère :
- Inscription/Connexion par email/mot de passe
- Réinitialisation de mot de passe
- Sessions persistantes
- Refresh tokens automatique

### Audit Logging

Toutes les actions importantes sont loggées automatiquement via triggers :

```sql
CREATE TRIGGER audit_contracts 
  AFTER INSERT OR UPDATE OR DELETE ON contracts
  FOR EACH ROW EXECUTE FUNCTION log_audit();
```

## Fonctionnalités clés

### 1. Gestion des Contrats

**Fonctionnalités:**
- Création/modification/suppression
- Génération automatique de numéros
- Alertes d'expiration (30, 60, 90 jours)
- Renouvellement automatique optionnel
- Validation des données
- Historique complet

**Automatisations:**
- Numéro de contrat auto-généré : `CT-2026-00001`
- Mise à jour du statut du local (occupé/vacant)
- Création de notification au locataire

### 2. Système de Facturation

**Génération automatique:**
- Factures mensuelles générées le 1er de chaque mois
- Calcul automatique loyer + charges
- Numérotation automatique : `INV-2026-00001`
- TVA calculée automatiquement

**Suivi des paiements:**
- Statuts : pending, sent, paid, overdue
- Balance due calculée automatiquement
- Rappels de paiement automatiques (J-7, J-3, J-1)
- Marquage automatique en retard

### 3. Notifications

**Types de notifications:**
- In-app (temps réel via Supabase Realtime)
- Email (via Resend API)

**Événements notifiés:**
- Nouvelle facture générée
- Rappel de paiement
- Contrat bientôt expiré
- Contrat renouvelé
- Paiement reçu

### 4. Dashboard

**Statistiques en temps réel:**
- Nombre de locataires actifs
- Locaux occupés/disponibles
- Contrats actifs
- Factures en retard
- Paiements en attente
- Revenus du mois

**Vue créée:**
```sql
CREATE VIEW dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM tenants WHERE active = true) as active_tenants,
  (SELECT COUNT(*) FROM shops WHERE status = 'occupied') as occupied_shops,
  -- ...
```

## API et Fonctions

### Edge Functions

#### 1. send-email

Envoi d'emails via Resend API.

**Endpoint:** `POST /functions/v1/send-email`

**Payload:**
```json
{
  "to": "user@example.com",
  "subject": "Nouvelle facture",
  "html": "<p>Votre facture...</p>",
  "type": "invoice",
  "data": {
    "userId": "uuid",
    "from": "noreply@example.com"
  }
}
```

#### 2. scheduled-tasks

Exécution des tâches automatiques.

**Endpoint:** `POST /functions/v1/scheduled-tasks`

**Tâches effectuées:**
- Marquer les factures en retard
- Envoyer les rappels de paiement
- Renouveler les contrats éligibles
- Générer les factures mensuelles (le 1er du mois)

### Fonctions PostgreSQL

#### generate_monthly_invoices()

Génère automatiquement les factures mensuelles pour tous les contrats actifs.

```sql
SELECT generate_monthly_invoices();
```

#### auto_renew_contracts()

Renouvelle automatiquement les contrats avec `auto_renewal = true`.

```sql
SELECT auto_renew_contracts();
```

#### send_payment_reminders()

Envoie des notifications de rappel selon les jours configurés.

```sql
SELECT send_payment_reminders();
```

## Composants React

### Contextes

#### AuthContext
Gestion de l'authentification et du profil utilisateur.

```jsx
const { user, profile, loading, signIn, signOut } = useAuth()
```

#### ToastContext
Affichage de notifications toast.

```jsx
const { success, error, warning, info } = useToast()
```

#### NotificationContext
Gestion des notifications in-app.

```jsx
const { notifications, unreadCount, markAsRead } = useNotifications()
```

#### ThemeContext
Gestion du thème clair/sombre.

```jsx
const { theme, toggleTheme } = useTheme()
```

### Composants réutilisables

#### DataTable
Table de données avec recherche, tri, pagination.

```jsx
<DataTable
  data={items}
  columns={columns}
  searchable
  pagination
  pageSize={10}
/>
```

#### Modal
Modal personnalisable.

```jsx
<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Titre"
  size="md"
>
  Contenu
</Modal>
```

#### LoadingSpinner
Indicateur de chargement.

```jsx
<LoadingSpinner fullScreen text="Chargement..." />
```

### Hooks personnalisés

#### useDebounce
Debounce pour recherche en temps réel.

```jsx
const debouncedSearch = useDebounce(searchTerm, 500)
```

#### useAsync
Gestion d'appels asynchrones.

```jsx
const { execute, loading, data, error } = useAsync(fetchData)
```

## Performance

### Optimisations implémentées

1. **Lazy Loading** : Chargement différé des composants
2. **Debouncing** : Recherche optimisée
3. **Pagination** : Limitation des données chargées
4. **Indexes DB** : Indexes sur colonnes fréquemment requêtées
5. **Caching** : Utilisation du cache navigateur
6. **RLS optimisé** : Politiques efficaces

### Recommandations

- Utiliser `React.memo()` pour les composants lourds
- Implémenter `useMemo()` et `useCallback()` où nécessaire
- Activer la compression Gzip/Brotli sur le serveur
- Utiliser un CDN pour les assets statiques

## Tests

### Tests recommandés

1. **Tests unitaires** : Vitest + React Testing Library
2. **Tests d'intégration** : Tester les flux complets
3. **Tests E2E** : Playwright ou Cypress
4. **Tests de sécurité** : Vérifier les politiques RLS

### Exemple de test

```jsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Dashboard from './Dashboard'

describe('Dashboard', () => {
  it('renders statistics', () => {
    render(<Dashboard />)
    expect(screen.getByText(/Locataires actifs/i)).toBeInTheDocument()
  })
})
```

## Monitoring

### Métriques à surveiller

1. **Performance**
   - Temps de chargement des pages
   - Temps de réponse API
   - Utilisation mémoire

2. **Base de données**
   - Nombre de connexions
   - Temps de requêtes lentes
   - Taille de la base

3. **Erreurs**
   - Taux d'erreur frontend
   - Erreurs Edge Functions
   - Échecs d'authentification

### Outils recommandés

- **Sentry** : Tracking d'erreurs
- **Vercel Analytics** : Performance frontend
- **Supabase Dashboard** : Monitoring DB et Edge Functions
- **Uptime Robot** : Monitoring disponibilité

## Maintenance

### Tâches régulières

**Quotidiennes:**
- ✓ Automatiques via cron (factures, rappels)

**Hebdomadaires:**
- Vérifier les logs d'erreur
- Monitorer les performances

**Mensuelles:**
- Sauvegarde manuelle de la DB
- Vérifier les mises à jour de dépendances
- Analyser les statistiques d'utilisation

**Trimestrielles:**
- Audit de sécurité
- Optimisation des requêtes
- Nettoyage des données anciennes

### Mises à jour

```bash
# Vérifier les mises à jour
npm outdated

# Mettre à jour les dépendances mineures
npm update

# Mettre à jour une dépendance majeure
npm install package@latest
```

## Feuille de route

### Fonctionnalités futures

- [ ] Internationalisation (i18n) FR/EN/AR
- [ ] Génération PDF des factures
- [ ] Exports Excel des rapports
- [ ] Graphiques et analytics avancés
- [ ] Application mobile (React Native)
- [ ] Signature électronique de contrats
- [ ] Paiement en ligne (Stripe)
- [ ] Chat support intégré
- [ ] Mode hors ligne (PWA)
- [ ] Import/Export de données

### Améliorations techniques

- [ ] Migration vers TypeScript
- [ ] Tests automatisés (CI/CD)
- [ ] Storybook pour composants
- [ ] Documentation API OpenAPI
- [ ] Performance monitoring avancé

## Contribution

### Workflow

1. Fork le projet
2. Créer une branche feature : `git checkout -b feature/ma-feature`
3. Commiter : `git commit -am 'Add feature'`
4. Push : `git push origin feature/ma-feature`
5. Créer une Pull Request

### Standards de code

- ESLint pour le linting
- Prettier pour le formatage
- Commits conventionnels (feat, fix, docs, etc.)
- Commentaires en français pour la logique métier

---

**Auteur:** Eitherway Team  
**Licence:** MIT  
**Version:** 1.0.0
