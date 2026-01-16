# 🦊 GUIDE DÉPLOIEMENT GITLAB + VERCEL

## Étape 1 : Créer le repo GitLab

1. Allez sur : **https://gitlab.com/projects/new**
2. Choisissez **"Create blank project"**
3. Configuration :
   - **Project name** : `eitherway`
   - **Visibility Level** : Private (ou Public si vous voulez)
   - **Initialize repository** : Décochez "Initialize with README"
4. Cliquez **"Create project"**

GitLab vous donnera une URL comme :
```
https://gitlab.com/votre-username/eitherway.git
```

---

## Étape 2 : Ajouter GitLab comme remote

Ouvrez PowerShell dans votre dossier projet et exécutez :

```powershell
cd C:\Users\djala_r1l99q2\OneDrive\Bureau\eitherway

# Ajouter GitLab comme nouveau remote
git remote add gitlab https://gitlab.com/VOTRE-USERNAME/eitherway.git

# Vérifier
git remote -v
```

Vous devriez voir :
```
origin    https://github.com/alligator4/eitherway.git (fetch)
origin    https://github.com/alligator4/eitherway.git (push)
gitlab    https://gitlab.com/VOTRE-USERNAME/eitherway.git (fetch)
gitlab    https://gitlab.com/VOTRE-USERNAME/eitherway.git (push)
```

---

## Étape 3 : Pousser le code vers GitLab

```powershell
git push gitlab main
```

Si GitLab demande vos identifiants :
- **Username** : votre-username-gitlab
- **Password** : Utilisez un **Personal Access Token** (pas votre mot de passe)

### Créer un Personal Access Token :

1. GitLab → **Avatar (en haut à droite)** → **Preferences**
2. **Access Tokens** (menu gauche)
3. **Add new token** :
   - Name : `vercel-deploy`
   - Scopes : Cochez `write_repository`
   - Expiration : 1 an
4. Cliquez **Create personal access token**
5. **Copiez le token** (vous ne le reverrez plus !)
6. Utilisez ce token comme mot de passe lors du `git push`

---

## Étape 4 : Connecter Vercel avec GitLab

### Option A : Via l'interface Vercel

1. Allez sur **https://vercel.com**
2. **Add New** → **Project**
3. En haut, sélectionnez **"Import Git Repository"**
4. Cliquez sur **GitLab**
5. Autorisez Vercel à accéder à GitLab
6. Sélectionnez le repo **eitherway**
7. Cliquez **Import**

### Option B : Import direct

1. Allez sur : **https://vercel.com/import/gitlab**
2. Connectez votre compte GitLab
3. Sélectionnez **eitherway**

---

## Étape 5 : Configuration Vercel

### Build Settings (Auto-détecté)

```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### Environment Variables (IMPORTANT !)

Ajoutez ces 2 variables :

| Name | Value | Où trouver ? |
|------|-------|--------------|
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbG...` | Supabase → Settings → API → anon public |

---

## Étape 6 : Déployer !

1. Cliquez **"Deploy"**
2. ⏳ Attendez 2-3 minutes
3. 🎉 Vous aurez une URL : `https://eitherway-xxxxx.vercel.app`

---

## Étape 7 : Configurer Supabase Auth

⚠️ **IMPORTANT** pour que l'authentification fonctionne :

1. Allez sur **https://app.supabase.com**
2. Sélectionnez votre projet
3. **Authentication** → **URL Configuration**
4. Ajoutez votre URL Vercel :
   - **Site URL** : `https://eitherway-xxxxx.vercel.app`
   - **Redirect URLs** : `https://eitherway-xxxxx.vercel.app/**`

---

## 🔄 Workflow de développement

### Pousser vers les deux repos (GitHub + GitLab)

```powershell
# Pousser vers GitHub
git push origin main

# Pousser vers GitLab
git push gitlab main

# Ou pousser vers les deux en une commande
git push origin main; git push gitlab main
```

### Déploiements automatiques

À partir de maintenant, **chaque `git push gitlab main`** :
1. Met à jour GitLab
2. Déclenche automatiquement un nouveau déploiement Vercel
3. Votre app est mise à jour en production ! ✅

---

## 🛠️ Commandes utiles

### Voir les remotes configurés

```powershell
git remote -v
```

### Renommer un remote

```powershell
git remote rename origin github
```

### Supprimer un remote

```powershell
git remote remove github
```

### Changer l'URL d'un remote

```powershell
git remote set-url gitlab https://nouvelle-url.git
```

---

## 🐛 Dépannage

### Erreur "Authentication failed" lors du push GitLab

**Solution** : Utilisez un Personal Access Token au lieu du mot de passe
1. GitLab → Preferences → Access Tokens
2. Créez un token avec scope `write_repository`
3. Utilisez le token comme mot de passe

### Vercel ne voit pas mon repo GitLab

**Solution** : Reconnectez GitLab dans Vercel
1. Vercel → Settings → Git
2. Disconnect GitLab
3. Reconnect GitLab

### Build échoue sur Vercel

**Solution** : Vérifiez les variables d'environnement
1. Vercel Dashboard → Votre projet → Settings → Environment Variables
2. Vérifiez que `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont bien configurées

---

## ✅ Checklist finale

Avant de tester en production :

- [ ] Repo GitLab créé
- [ ] Code pushé vers GitLab
- [ ] Vercel connecté à GitLab
- [ ] Variables d'environnement configurées dans Vercel
- [ ] Build réussi
- [ ] URL Vercel ajoutée dans Supabase Auth
- [ ] Triggers SQL exécutés (FIX_FINAL_INSCRIPTION.sql)
- [ ] Au moins un locataire créé pour tester

---

## 🎯 URLs importantes

- **GitLab** : https://gitlab.com/votre-username/eitherway
- **Vercel Dashboard** : https://vercel.com/dashboard
- **Vercel Deployments** : https://vercel.com/votre-username/eitherway
- **App en production** : https://eitherway-xxxxx.vercel.app
- **Supabase** : https://app.supabase.com

---

✅ **Votre application sera déployée depuis GitLab !**
