# 🚀 GUIDE DÉPLOIEMENT VERCEL

## Étape 1 : Créer un compte Vercel (si pas déjà fait)

1. Allez sur : **https://vercel.com/signup**
2. Cliquez sur **"Continue with GitHub"**
3. Autorisez Vercel à accéder à votre GitHub
4. ✅ Compte créé !

---

## Étape 2 : Importer votre projet

### Option A : Via l'interface web (Recommandé)

1. Allez sur : **https://vercel.com/new**
2. Vous verrez vos repositories GitHub
3. Cherchez **"eitherway"** dans la liste
4. Cliquez sur **"Import"**

### Option B : Via le lien direct

1. Allez sur : **https://vercel.com/new/git/external?repository-url=https://github.com/alligator4/eitherway**

---

## Étape 3 : Configuration du projet

Vercel détectera automatiquement que c'est un projet **Vite + React**.

### Configuration automatique :
```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

✅ **Ne changez rien**, Vercel a tout détecté grâce à `vercel.json` !

---

## Étape 4 : Variables d'environnement

⚠️ **IMPORTANT** : Ajoutez vos variables Supabase

1. Dans la section **"Environment Variables"**, ajoutez :

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | Votre URL Supabase |
| `VITE_SUPABASE_ANON_KEY` | Votre clé anonyme Supabase |

### Comment trouver ces valeurs ?

1. Allez sur **https://app.supabase.com**
2. Sélectionnez votre projet
3. Cliquez sur **Settings** (⚙️) → **API**
4. Copiez :
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** → `VITE_SUPABASE_ANON_KEY`

---

## Étape 5 : Déployer !

1. Cliquez sur **"Deploy"**
2. ⏳ Attendez 2-3 minutes (Vercel va build votre app)
3. 🎉 Vous verrez :
   ```
   ✓ Build completed
   ✓ Deployment ready
   ```

---

## Étape 6 : Accéder à votre app

Vercel vous donnera une URL du type :
```
https://eitherway-xxxxx.vercel.app
```

🎉 **Votre app est en ligne !**

---

## 🔄 Déploiements automatiques

À partir de maintenant, **chaque fois que vous faites `git push`** :

1. Vercel détecte le changement
2. Build automatiquement
3. Déploie la nouvelle version
4. ✅ Votre app est mise à jour !

---

## 🛠️ Configuration avancée (Optionnel)

### Domaine personnalisé

1. Allez dans **Settings** → **Domains**
2. Ajoutez votre domaine (ex: `eitherway.com`)
3. Suivez les instructions pour configurer le DNS

### Variables d'environnement par branche

- **Production** : branche `main`
- **Preview** : autres branches

---

## ⚠️ IMPORTANT : Supabase

### Autoriser le domaine Vercel dans Supabase

1. Allez sur **https://app.supabase.com**
2. **Authentication** → **URL Configuration**
3. Ajoutez votre URL Vercel dans :
   - **Site URL** : `https://eitherway-xxxxx.vercel.app`
   - **Redirect URLs** : `https://eitherway-xxxxx.vercel.app/**`

Sans ça, l'authentification ne fonctionnera pas en production !

---

## 📝 Checklist finale

Avant de tester en production :

- [ ] Variables d'environnement configurées
- [ ] Build réussi sur Vercel
- [ ] URL Vercel ajoutée dans Supabase Auth
- [ ] Triggers SQL exécutés (FIX_FINAL_INSCRIPTION.sql)
- [ ] RLS activé sur toutes les tables
- [ ] Au moins un locataire créé pour tester

---

## 🐛 Dépannage

### Erreur de build

**Problème** : Build failed  
**Solution** : Vérifiez les logs dans Vercel Dashboard

### Page blanche

**Problème** : L'app charge mais reste blanche  
**Solution** : 
1. F12 → Console pour voir les erreurs
2. Vérifiez que les variables d'environnement sont bien configurées

### Erreur 404 sur refresh

**Problème** : Page 404 quand on rafraîchit  
**Solution** : `vercel.json` doit contenir les rewrites (déjà fait ✅)

### Erreur Auth Supabase

**Problème** : "Invalid login credentials"  
**Solution** : Ajoutez l'URL Vercel dans Supabase Auth Settings

---

## 🎯 Prochaines étapes après déploiement

1. Testez l'inscription : `/signup`
2. Testez la connexion : `/login`
3. Vérifiez que le locataire est créé automatiquement
4. Testez la création d'un local "Occupé"
5. Vérifiez que la liste des locataires apparaît

---

✅ **Votre application est maintenant en production !**

URL du projet : https://github.com/alligator4/eitherway  
URL de déploiement : https://vercel.com/dashboard
