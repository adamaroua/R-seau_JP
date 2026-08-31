# Guide de configuration GitHub Secrets pour le déploiement automatique

Ce guide explique comment configurer les secrets GitHub nécessaires pour le déploiement automatique sur Cloudflare.

## Étapes de configuration

### 1. Créer un token API Cloudflare

1. Allez sur [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Cliquez sur votre profil (en haut à droite) > "My Profile"
3. Allez dans "API Tokens"
4. Cliquez sur "Create Token"
5. Utilisez le template "Edit Cloudflare Workers" ou créez un token custom avec:
   - Permissions: `Account > Cloudflare Workers > Edit`
   - Account Resources: `Include > All accounts` ou sélectionnez votre compte spécifique
6. Copiez le token généré

### 2. Récupérer l'ID du compte Cloudflare

1. Allez sur [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Sélectionnez votre compte (si vous en avez plusieurs)
3. L'ID du compte est visible dans l'URL ou dans "Overview" >右侧
4. Format: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 3. Récupérer les clés Supabase

1. Allez sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans "Settings" > "API"
4. Copiez:
   - `Project URL`: pour `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public`: pour `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `service_role`: pour `SUPABASE_SECRET_KEY` (ATTENTION: ne jamais partager cette clé)

### 4. Générer un secret pour le cron

Générez une chaîne aléatoire sécurisée pour `CRON_SECRET`:
```bash
# Sur Linux/Mac
openssl rand -base64 32

# Sur Windows (PowerShell)
[System.Web.Security.Membership]::GeneratePassword(32,4)
```

### 5. Définir l'URL du site

Pour `NEXT_PUBLIC_SITE_URL`, utilisez votre domaine public:
- Exemple: `https://jpzone.duckdns.org`
- En local: `http://localhost:3000`

### 6. Configurer les secrets GitHub

1. Allez sur votre repository GitHub
2. Cliquez sur "Settings" > "Secrets and variables" > "Actions"
3. Cliquez sur "New repository secret"
4. Ajoutez chaque secret avec sa valeur:

| Nom du secret | Description |
|--------------|-------------|
| `CLOUDFLARE_API_TOKEN` | Token API Cloudflare (étape 1) |
| `CLOUDFLARE_ACCOUNT_ID` | ID du compte Cloudflare (étape 2) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase (étape 3) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clé publique Supabase (étape 3) |
| `SUPABASE_SECRET_KEY` | Clé service_role Supabase (étape 3) |
| `CRON_SECRET` | Secret pour le cron (étape 4) |
| `NEXT_PUBLIC_SITE_URL` | URL publique du site (étape 5) |

### 7. Activer GitHub Actions

1. Allez sur "Settings" > "Actions" > "General"
2. Sous "Actions permissions", sélectionnez:
   - "Allow all actions and reusable workflows"
3. Cliquez sur "Save"

### 8. Tester le déploiement

1. Faites un push sur la branche principale (`main` ou `master`)
2. Allez dans l'onglet "Actions" du repository
3. Vous devriez voir le workflow "Deploy to Cloudflare" se lancer
4. Vérifiez que le déploiement réussit

## Vérification

Après configuration, vous pouvez vérifier que tout fonctionne en:
1. Regardant les logs du workflow GitHub Actions
2. Vérifiant que le site est accessible sur Cloudflare Workers
3. Testant les fonctionnalités critiques (auth, feed, etc.)

## Sécurité

- **NE JAMAIS** committer les secrets dans le code
- **NE JAMAIS** partager `SUPABASE_SECRET_KEY` ou `CLOUDFLARE_API_TOKEN`
- Régénérer les secrets si compromis
- Utiliser des tokens avec les permissions minimales nécessaires
