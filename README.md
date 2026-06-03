# Jean Prevost Social

Reseau social sombre et responsive pour le lycee Jean Prevost, construit avec Next.js, TypeScript, TailwindCSS et Supabase. Le feed reprend les codes rapides de X, Reddit et Instagram: posts texte/image, likes, dislikes, commentaires, sauvegardes, chat prive temps reel, notifications, moderation et dashboard admin.

## Stack

- Next.js App Router + TypeScript
- TailwindCSS
- Supabase Auth, Database, Storage et Realtime
- Vercel free tier
- Supabase free tier

Prisma n'est pas utilise ici: Supabase + SQL/RLS couvrent mieux les permissions, triggers, quotas et Realtime sans ajouter une couche de schema en plus.

## Lancer en local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Sous PowerShell:

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

Ouvre ensuite `http://localhost:3000`.

## Variables d'environnement

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxxxxxxx
SUPABASE_SECRET_KEY=sb_secret_xxxxxxxxxxxxxxxxx
CRON_SECRET=change-this-long-random-secret
NEXT_PUBLIC_SITE_URL=https://jpzone.duckdns.org
```

`SUPABASE_SECRET_KEY` doit rester cote serveur uniquement. Ne jamais la mettre dans du code client.

## Configuration Supabase

1. Cree un projet sur Supabase.
2. Va dans SQL Editor.
3. Colle puis execute `supabase/schema.sql`.
4. Dans Authentication, active Email/Password.
5. Option recommande: active Captcha ou une protection anti-bot Supabase pour limiter les inscriptions abusives.
6. Cree un compte depuis `/auth/register`.
7. Pour creer le premier admin, execute `supabase/seed.sql` en remplacant `jp_admin` par ton pseudo.

Le schema cree:

- `users`, `roles`
- `posts`, `comments`, `likes`, `dislikes`, `saved_posts`
- `reports`
- `conversations`, `conversation_members`, `messages`
- `notifications`
- `upload_events`, `action_rate_limits`
- buckets Storage prives: `avatars`, `post-media`
- RLS policies, indexes, triggers et fonctions RPC

## Securite

- Mots de passe geres et hashes par Supabase Auth.
- Connexion simplifiee par identifiant: le site genere un email technique prive pour Supabase Auth, sans demander d'email aux utilisateurs.
- RLS active sur toutes les tables sensibles.
- Validation serveur avec Zod.
- Rate limiting base de donnees pour posts, commentaires, reactions, signalements, chat et profil.
- Triggers anti-spam cote base pour limiter les inserts directs via l'API Supabase.
- Uploads limites par MIME type et taille.
- Buckets Storage prives avec URLs signees.
- Quota upload: 10 Mo par utilisateur et par jour.
- Quota sauvegardes: 25 Mo par utilisateur.
- Un post sauvegarde par plusieurs utilisateurs n'est pas duplique: `saved_posts` ne stocke qu'une relation vers `posts`.
- Suppression admin: le post disparait aussi des sauvegardes via `ON DELETE CASCADE`.
- Expiration automatique: les posts expirent apres 10 jours et le cron les supprime.

## Deploiement gratuit

1. Pousse le projet sur GitHub.
2. Importe le repo dans Vercel.
3. Ajoute les variables d'environnement dans Vercel.
4. Build command: `npm run build`.
5. Output: Next.js par defaut.
6. Vercel fournit un domaine gratuit temporaire du type `nom-du-projet.vercel.app`.
7. Le fichier `vercel.json` configure un cron quotidien vers `/api/cron/cleanup`.

Pour tester le nettoyage manuellement:

```bash
curl "https://ton-site.vercel.app/api/cron/cleanup?secret=TON_CRON_SECRET"
```

## Roles

- `user`: pseudo rouge, peut poster, liker, commenter, sauvegarder et signaler.
- `moderator`: peut consulter les signalements et marquer un post comme frauduleux.
- `admin`: badge vert, pseudo vert, suppression de tout post, nomination des moderateurs/admins.

## Structure

```text
app/                 pages App Router et routes API
components/          composants UI reutilisables
hooks/               hooks client, dont infinite feed
lib/                 Supabase, validation, auth, storage, rate limit
supabase/schema.sql  schema complet, RLS, triggers, fonctions
types/               types TypeScript de l'API et de la base
```

## Routes utiles

- `/feed`: feed principal avec infinite scroll
- `/saved`: posts sauvegardes
- `/chat`: messages prives temps reel
- `/settings`: profil, avatar, mot de passe, quotas, suppression compte
- `/admin`: moderation et gestion des roles

## Notes de production

- Garde les buckets prives.
- Regarde regulierement les logs Vercel du cron.
- Pour un lycee, ajoute une charte d'utilisation et une page contact avant ouverture publique.
- Configure les emails Supabase avec un domaine verifie si le site grossit.
