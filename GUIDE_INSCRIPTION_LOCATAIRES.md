# 🎯 GUIDE COMPLET - INSCRIPTION & LOCATAIRES

## ✅ CE QUI A ÉTÉ CORRIGÉ

### Problème 1 : Statut "Réservé" manquant
**Avant** : Seulement Disponible, Occupé, En rénovation  
**Après** : ✅ **Réservé** ajouté dans la liste déroulante

### Problème 2 : Locataires sans compte utilisateur
**Avant** : On pouvait créer des locataires manuellement sans compte  
**Après** : ✅ Les locataires sont **créés automatiquement** à l'inscription

### Problème 3 : Bouton "Ajouter locataire" confusant
**Avant** : Bouton visible mais créait des incohérences  
**Après** : ✅ Bouton **désactivé** + message explicatif

---

## 🚀 WORKFLOW UTILISATEUR FINAL

### Pour un nouveau locataire :

```
1. Va sur https://votre-app.com/signup
   ├─ Remplit le formulaire :
   │  ├─ Email : sophie@mode-paris.fr
   │  ├─ Mot de passe : ********
   │  └─ Nom complet : Sophie Dubois
   │
2. Clique sur "S'inscrire"
   │
3. ✨ AUTOMATIQUEMENT :
   ├─ Compte créé (profiles)
   │  ├─ role = 'tenant'
   │  ├─ email = sophie@mode-paris.fr
   │  └─ full_name = Sophie Dubois
   │
   └─ Locataire créé (tenants)
      ├─ user_id → lié au compte
      ├─ company_name = "Sophie Dubois - Entreprise"
      ├─ contact_name = "Sophie Dubois"
      ├─ email = sophie@mode-paris.fr
      └─ active = true
   
4. Se connecte avec email/mot de passe
   │
5. Voit ses informations de locataire
   └─ Peut modifier son profil
```

### Pour l'admin :

```
1. Va dans "Locataires"
   ├─ Voit tous les locataires inscrits
   │
2. Clique sur "Modifier" sur un locataire
   ├─ Peut changer :
   │  ├─ Nom de l'entreprise
   │  ├─ Type d'activité
   │  ├─ Téléphone
   │  └─ Adresse
   │
3. Va dans "Locaux commerciaux"
   ├─ Clique sur "Modifier" un local
   ├─ Change statut à "Occupé"
   ├─ Sélectionne le locataire dans la liste
   └─ Enregistre
   │
4. ✨ AUTOMATIQUEMENT :
   └─ Un contrat est créé entre le local et le locataire
```

---

## 📊 STRUCTURE TECHNIQUE

### Tables et relations :

```sql
auth.users (Supabase Auth)
    ↓
profiles (Votre table)
    ├─ id (UUID)
    ├─ email
    ├─ full_name
    ├─ role = 'tenant'
    └─ phone
         ↓ (1:1)
tenants
    ├─ id (UUID)
    ├─ user_id → profiles.id
    ├─ company_name
    ├─ contact_name
    ├─ email
    ├─ business_type
    └─ active
         ↓ (1:N)
contracts
    ├─ id (UUID)
    ├─ tenant_id → tenants.id
    ├─ shop_id → shops.id
    ├─ start_date
    ├─ end_date
    ├─ monthly_rent
    └─ status
```

### Trigger automatique :

```sql
CREATE TRIGGER trigger_auto_create_tenant
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_tenant_on_signup();
```

**Fonction** : `auto_create_tenant_on_signup()`
- Se déclenche après création d'un profil
- Vérifie si `role = 'tenant'`
- Crée automatiquement une entrée dans `tenants`
- Lie `user_id` au profil créé

---

## 🔧 MAINTENANCE

### Voir les utilisateurs sans locataire :

```sql
SELECT p.email, p.role
FROM profiles p
WHERE p.role = 'tenant'
AND NOT EXISTS (SELECT 1 FROM tenants t WHERE t.user_id = p.id);
```

### Voir les locataires sans compte :

```sql
SELECT t.company_name, t.email
FROM tenants t
WHERE t.user_id IS NULL;
```

### Créer manuellement un locataire pour un user existant :

```sql
INSERT INTO tenants (user_id, company_name, contact_name, email, active)
SELECT 
  id,
  full_name || ' - Entreprise',
  full_name,
  email,
  true
FROM profiles
WHERE email = 'user@example.com';
```

---

## ⚠️ IMPORTANT

### À NE PAS FAIRE :
- ❌ Créer un locataire directement dans la base sans `user_id`
- ❌ Supprimer un profil sans supprimer le locataire associé
- ❌ Modifier manuellement le champ `user_id` dans `tenants`

### À FAIRE :
- ✅ Laisser le trigger gérer la création automatique
- ✅ Modifier les infos du locataire via l'interface admin
- ✅ Vérifier périodiquement la cohérence avec les requêtes SQL ci-dessus

---

## 🧪 TESTER

1. **Créer un compte test** :
   - Email : test@example.com
   - Mot de passe : Test123!

2. **Vérifier dans Supabase** :
   ```sql
   SELECT p.email, t.company_name
   FROM profiles p
   JOIN tenants t ON t.user_id = p.id
   WHERE p.email = 'test@example.com';
   ```

3. **Résultat attendu** :
   ```
   email              | company_name
   -------------------+---------------------------
   test@example.com   | Nom Test - Entreprise
   ```

---

## 🆘 DÉPANNAGE

### Problème : "Liste des locataires vide"
**Cause** : RLS bloque l'accès  
**Solution** : Changez votre rôle en `admin` :
```sql
UPDATE profiles SET role = 'admin' WHERE id = auth.uid();
```

### Problème : "Le locataire n'apparaît pas après inscription"
**Cause** : Trigger pas exécuté  
**Solution** : Vérifiez que le trigger existe :
```sql
SELECT * FROM pg_trigger WHERE tgname = 'trigger_auto_create_tenant';
```

### Problème : "Erreur lors de la création du locataire"
**Cause** : Colonne manquante ou contrainte violée  
**Solution** : Exécutez `SOLUTION_COMPLETE_INSCRIPTION.sql` à nouveau

---

✅ **Après avoir exécuté le script SQL, votre système sera parfaitement cohérent !**
