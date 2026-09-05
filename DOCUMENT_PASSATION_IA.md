# Document de passation IA - Jean Prevost Social

Date de reference: 2026-09-05  
Projet local: `C:\Users\adama\Documents\Reseau Lycee`  
Repo cible connu: `github.com/adamaroua/R-seau_JP`  
Domaine public vise: `https://jpzone.duckdns.org`

Ce document est la reference de reprise du projet. Il a ete redige apres lecture des fichiers source actuels du projet: pages Next.js, routes API, composants, hooks, librairies, types, configuration, schema Supabase, README et memoire `PROJECT_STATE.json`.

Important: ce document ne contient volontairement aucune cle Supabase reelle, aucun token GitHub et aucun secret. Les secrets partages dans une conversation doivent etre consideres comme compromis et regenes avant production.

---

## 1. Resume essentiel pour une IA qui reprend

Jean Prevost Social est un reseau social scolaire pour le lycee Jean Prevost. L'objectif initial est de creer une experience moderne, sombre, rapide et engageante, inspiree de Twitter/X, Reddit et Instagram, mais simplifiee pour des lyceens.

Le projet est une app Next.js App Router en TypeScript, stylisee avec TailwindCSS, connectee a Supabase pour Auth, PostgreSQL, Storage et Realtime. Le deploiement se fait exclusivement via Cloudflare Workers/Pages en utilisant OpenNext et Wrangler, avec deploiement automatique apres chaque changement.

L'app a deja:

- Authentification par identifiant + mot de passe, sans email visible pour l'utilisateur.
- Supabase Auth en interne: l'identifiant est transforme en email technique `identifiant@jpzone.local`.
- Creation de compte cote serveur via `admin.auth.admin.createUser(..., email_confirm: true)`.
- Feed infini avec posts texte/image, likes, dislikes, commentaires, sauvegardes, signalements.
- Roles `user`, `moderator`, `admin`.
- Admin vert, moderateur bleu, utilisateur rouge.
- Dashboard moderation/admin.
- Chat prive en temps reel via Supabase Realtime.
- Notifications simples en temps reel.
- Quotas d'upload et de posts sauvegardes.
- Stockage prive avec URLs signees.
- Cron de nettoyage des posts expires apres 10 jours.
- Emplacements publicitaires placeholder, sans vraie publicite.

Les grands points sensibles:

- Ne jamais committer `.env.local`, `.env`, `.dev.vars` ou un token.
- Ne jamais exposer `SUPABASE_SECRET_KEY` cote client.
- Garder les buckets Supabase prives.
- Ne pas casser les RLS policies.
- Ne pas supprimer `middleware.ts` sans tester Cloudflare/OpenNext: Next 16 le deprecie, mais le projet note qu'il est conserve pour compatibilite OpenNext.
- Toujours lancer `npm run typecheck` et `npm run build:cloudflare` avant de deployer.
- L'URL Supabase d'environnement doit etre la base `https://<project-ref>.supabase.co`, pas l'URL REST terminee par `/rest/v1/`.

---

## 2. Presentation generale

### Objectif principal

Construire un reseau social complet, gratuit a heberger, moderne et directement utilisable pour les eleves du lycee Jean Prevost.

### Objectifs secondaires

- Proposer un feed fluide et rapide.
- Permettre aux eleves de poster du texte et des images.
- Favoriser les interactions: likes, dislikes, commentaires, sauvegardes, notifications.
- Offrir un chat prive en temps reel.
- Encadrer la moderation avec roles, signalements et dashboard.
- Rester deployable gratuitement.
- Garder une base technique maintenable.
- Preparer une monetisation future sans l'activer trop tot.

### Philosophie du projet

Le site doit etre simple pour un lyceen: peu de friction, pas d'email visible, pas d'interface lourde. L'app doit donner une impression de reseau social actuel, rapide et vivant, tout en restant securisee et moderable.

### Public vise

Public principal: lyceens du lycee Jean Prevost.  
Public secondaire: moderateurs/admins du projet, probablement une petite equipe.

### Identite

- Nom: Jean Prevost Social, parfois "JP" dans l'interface.
- Domaine vise: `jpzone.duckdns.org`.
- Ton: direct, moderne, scolaire mais pas institutionnel.
- Interface: sombre, compacte, rapide, orientee contenu.

### Style graphique

Le design utilise une base sombre:

- `ink`: `#07090d`
- `panel`: `#0d1118`
- `panelSoft`: `#131923`
- `line`: `#253041`
- `danger`: `#ff3b5f`, couleur principale et couleur utilisateur
- `admin`: `#31df82`, couleur admin
- `sky`: `#4cc9f0`, couleur moderateur et actions secondaires
- `note`: `#ffd166`, couleur sauvegarde/note

Les cards ont un rayon modere (`rounded-md`) et un style sombre. Les icones viennent de `lucide-react`.

### Contraintes importantes

- Hebergement gratuit ou quasi gratuit.
- Ne pas demander d'email aux utilisateurs.
- Ne pas exposer de secrets.
- Prevoir moderation et securite des le depart.
- Ne pas dupliquer les fichiers quand plusieurs utilisateurs sauvegardent un post.
- Les posts expirent apres 10 jours.
- Garder le projet simple a deployer.

---

## 3. Objectifs business et monetisation

### Situation actuelle

Le code contient uniquement des emplacements de publicite via `AdPlaceholder`. Aucune vraie publicite n'est branchee.

### Objectif business

Le projet doit pouvoir generer des revenus sans investissement personnel du proprietaire. Le site peut gagner de l'argent grace a son audience, mais toute dependance payante doit etre evitee tant que possible.

### Monetisation prevue ou envisagee

- Google AdSense ou plateforme similaire.
- Dons volontaires.
- Page de soutien.
- Partenariats locaux.
- Sponsoring discret par des structures compatibles avec un public lyceen.
- Emplacements publicitaires dans la sidebar et entre les posts.

### Regles AdSense ou equivalent

Toute evolution future doit aider l'approbation par une plateforme publicitaire:

- Ajouter une page de contact.
- Ajouter une charte d'utilisation.
- Ajouter une politique de confidentialite.
- Ajouter des conditions d'utilisation.
- Eviter le contenu adulte, violent, haineux ou illegal.
- Prevoir un systeme de signalement visible et fonctionnel.
- Moderer activement.
- Ne pas afficher de faux clics publicitaires.
- Ne pas encourager les utilisateurs a cliquer sur les pubs.
- Garder une navigation claire.
- Eviter les pages vides ou sans contenu.
- Eviter les popups agressifs.
- Optimiser mobile.

### Ce qui manque pour la monetisation

Ces elements ne sont pas encore presents dans le code:

- Page `contact`.
- Page `conditions`.
- Page `confidentialite`.
- Page `charte`.
- Page `soutenir`.
- Integration AdSense reelle.
- Consentement cookies si analytics/publicite.
- Strategie SEO publique.

---

## 4. Objectifs UX

L'utilisateur veut une experience tres engageante, presque addictive au sens positif: l'utilisateur doit avoir envie d'explorer, cliquer, poster, revenir et decouvrir.

### Axes UX a renforcer

- Curiosite.
- Sentiment de progression.
- Satisfaction immediate apres action.
- Retours visuels rapides.
- Micro-interactions.
- Animations fluides mais sobres.
- Feed facile a scanner.
- Navigation mobile efficace.
- Decouverte de fonctionnalites sans page marketing.

### UX actuelle

- La premiere vraie experience est le feed apres connexion.
- Auth simple: identifiant + mot de passe.
- Navigation desktop: sidebar gauche.
- Navigation mobile: bottom nav fixe.
- Notifications visibles dans la topbar.
- Chat a deux colonnes sur desktop.
- Cards posts lisibles avec actions rapides.
- Placeholder pub discret.

### UX a eviter

- Landing page marketing au lieu de l'app.
- Interface trop decorative.
- Gradients criards.
- Trop de cards imbriquees.
- Texte qui deborde sur mobile.
- Interactions sans feedback.
- Demander trop d'informations a l'inscription.

---

## 5. Architecture technique

### Stack actuelle

- Next.js App Router.
- React.
- TypeScript strict.
- TailwindCSS.
- Supabase Auth, Database, Storage, Realtime.
- `@supabase/ssr`.
- `@supabase/supabase-js`.
- Zod pour validation.
- `lucide-react` pour icones.
- `clsx` et `tailwind-merge` pour classes CSS.
- Cloudflare Workers/Pages via OpenNext et Wrangler pour deploiement automatique.

### Pourquoi Prisma n'est pas utilise

Prisma etait mentionne comme option possible, mais le projet utilise directement Supabase + SQL/RLS. C'est coherent car:

- Supabase gere Auth, Storage, Realtime.
- Les politiques RLS sont centrales.
- Les triggers SQL gerent quotas et securite.
- Ajouter Prisma complexifierait la pile sans benefice immediat.

### Scripts npm

Dans `package.json`:

- `npm run dev`: lance Next en developpement.
- `npm run build`: build Next production.
- `npm run start`: sert le build Next.
- `npm run typecheck`: `tsc --noEmit`.
- `npm run build:cloudflare`: build OpenNext Cloudflare.
- `npm run preview`: build + preview Cloudflare.
- `npm run deploy`: build + deploy Cloudflare.
- `npm run upload`: build + upload Cloudflare.
- `npm run cf-typegen`: genere les types Wrangler.

Le deploiement se fait automatiquement via GitHub Actions a chaque push sur la branche principale.

### Organisation globale

```text
app/                  Pages App Router et Route Handlers API
components/           Composants UI reutilisables
hooks/                Hooks React client
lib/                  Helpers serveur/client, auth, Supabase, validation
types/                Types API et database
supabase/             Schema SQL et seed admin
public/               Headers Cloudflare static assets
.github/              Workflows GitHub Actions (deploiement automatique)
README.md             Guide de lancement/deploiement
GUIDE_SETUP_GITHUB.md Guide configuration secrets GitHub
PROJECT_STATE.json    Memoire persistante du projet
DOCUMENT_PASSATION_IA.md Ce document
```

---

## 6. Fichiers et roles

### Racine

- `.env.example`: variables attendues, avec placeholders uniquement.
- `.dev.vars.example`: template Wrangler local, actuellement `NEXTJS_ENV=development`.
- `.gitignore`: ignore `.env`, `.env.local`, `.dev.vars*`, `.next`, `node_modules`, `.open-next`, `.wrangler`, logs, etc.
- `package.json`: dependances et scripts.
- `package-lock.json`: lock npm; a garder pour builds reproductibles.
- `next.config.mjs`: config Next, image remote pattern Supabase, init OpenNext dev.
- `tsconfig.json`: TypeScript strict, alias `@/*`, includes `.next/types`.
- `tailwind.config.ts`: theme Tailwind custom.
- `postcss.config.mjs`: Tailwind + autoprefixer.
- `next-env.d.ts`: types Next.
- `wrangler.jsonc`: config Cloudflare Worker/OpenNext.
- `open-next.config.ts`: config OpenNext Cloudflare.
- `middleware.ts`: rafraichit la session Supabase sur requetes; conserve pour compatibilite OpenNext.
- `README.md`: documentation utilisateur/dev courte.
- `PROJECT_STATE.json`: memoire projet existante; attention, le fichier affiche des accents corrompus dans certains contexts.
- `public/_headers`: cache immutable pour `/_next/static/*` sur Cloudflare.
- `.github/workflows/deploy-cloudflare.yml`: workflow GitHub Actions pour deploiement automatique.
- `.github/workflows/cron-cleanup.yml`: workflow GitHub Actions pour cron cleanup des posts expires.

### `app/`

- `app/layout.tsx`: RootLayout, metadata, viewport, CSS global.
- `app/globals.css`: styles globaux, scrollbar, focus ring, fonds sombres.
- `app/page.tsx`: redirect vers `/feed`.
- `app/feed/page.tsx`: page feed, exige profil connecte.
- `app/saved/page.tsx`: feed scope `saved`.
- `app/chat/page.tsx`: chat prive.
- `app/admin/page.tsx`: dashboard staff.
- `app/settings/page.tsx`: profil et quotas.
- `app/profile/[username]/page.tsx`: profil public + posts utilisateur.
- `app/auth/login/page.tsx`: page connexion.
- `app/auth/register/page.tsx`: page inscription.

### `app/api/`

Auth:

- `app/api/auth/register/route.ts`: inscription par identifiant, creation Supabase Auth admin, email technique confirme.

Posts:

- `app/api/posts/route.ts`: GET feed, POST creation post texte/image.
- `app/api/posts/[id]/route.ts`: DELETE post auteur ou admin selon RLS.
- `app/api/posts/[id]/react/route.ts`: like/dislike toggle.
- `app/api/posts/[id]/save/route.ts`: sauvegarde/desauvegarde avec quota 25 Mo.
- `app/api/posts/[id]/comments/route.ts`: commentaires GET/POST.
- `app/api/posts/[id]/report/route.ts`: signalement.

Chat:

- `app/api/chat/conversations/route.ts`: liste/creation conversations.
- `app/api/chat/messages/route.ts`: liste/envoi messages, met `read_at` a jour.

Profil:

- `app/api/profile/route.ts`: GET/PATCH profil.
- `app/api/profile/avatar/route.ts`: upload avatar.
- `app/api/profile/password/route.ts`: changement mot de passe.
- `app/api/profile/delete/route.ts`: suppression compte.

Notifications:

- `app/api/notifications/route.ts`: liste + mark all read.

Admin/moderation:

- `app/api/admin/reports/route.ts`: liste signalements.
- `app/api/admin/reports/[id]/fraudulent/route.ts`: marque/demarque frauduleux.
- `app/api/admin/posts/[id]/route.ts`: suppression admin.
- `app/api/admin/users/role/route.ts`: changer role par username.
- `app/api/admin/users/[id]/role/route.ts`: changer role par id.

Cron:

- `app/api/cron/cleanup/route.ts`: supprime posts expires et medias Storage; protege par `CRON_SECRET`.

### `components/`

Auth:

- `AuthFrame`: cadre commun login/register.
- `LoginForm`: identifiant + mot de passe, signIn Supabase.
- `RegisterForm`: identifiant unique + mot de passe, appelle route register.
- `ProfileSettings`: edition profil, avatar, mot de passe, quotas, deconnexion, suppression compte.

Feed:

- `Feed`: liste des posts, infinite scroll, composer, placeholders pub.
- `Composer`: formulaire creation post, preview image.
- `PostCard`: rendu post, actions, menu, signalement, commentaires.
- `CommentsPanel`: liste + ajout commentaire.

Chat:

- `ChatShell`: conversations, messages, unread count, Realtime.

Layout:

- `AppShell`: structure connectee.
- `Sidebar`: navigation desktop, profil resume, placeholder pub.
- `TopBar`: titre, user, notifications, avatar.
- `MobileNav`: navigation mobile.
- `NotificationsButton`: dropdown notifications + Realtime.

Moderation:

- `AdminDashboard`: signalements, marquer frauduleux, supprimer post, changer role.

Shared:

- `AdPlaceholder`: emplacement annonce.
- `EmptyState`: etat vide.
- `QuotaMeter`: barre quota.
- `RoleBadge`: badge user/mod/admin.
- `SignOutButton`: deconnexion.
- `UserAvatar`: avatar ou initiales.

### `hooks/`

- `useInfiniteFeed.ts`: pagination cursor, chargement feed, Realtime INSERT posts, remove local post.

### `lib/`

- `auth.ts`: recuperation profil courant et guards pages.
- `route-auth.ts`: guards Route Handlers.
- `auth-identifier.ts`: conversion identifiant -> email technique.
- `env.ts`: accesseurs env.
- `api.ts`: `jsonOk`, `jsonError`.
- `feed.ts`: hydration URLs signees posts/avatars.
- `rate-limit.ts`: hash IP + `check_rate_limit`.
- `shell.ts`: profil shell avec avatar signe.
- `storage.ts`: buckets, limites, URLs signees, suppression media.
- `utils.ts`: classes Tailwind, format count, temps relatif, initiales, bytes.
- `validation.ts`: schemas Zod et verification image magic bytes.
- `supabase/admin.ts`: client service-role.
- `supabase/browser.ts`: client browser singleton.
- `supabase/server.ts`: client server SSR cookies.
- `supabase/rpc.ts`: wrapper RPC type.

### `types/`

- `database.ts`: type Supabase manuel.
- `api.ts`: types reponses feed/commentaires/notifications.

### `supabase/`

- `schema.sql`: tables, indexes, triggers, RPC, RLS, buckets Storage, Realtime.
- `seed.sql`: passer un username en admin.

---

## 7. Authentification

### UX

L'utilisateur ne saisit pas d'email. Il cree un compte avec:

- identifiant unique;
- mot de passe.

Connexion:

- identifiant;
- mot de passe.

### Strategie technique

Supabase Auth reste base sur email/password. Le site cache l'email en generant:

```text
identifiant@jpzone.local
```

Le helper est `lib/auth-identifier.ts`.

### Inscription actuelle

`POST /api/auth/register`:

1. Valide `username` et `password`.
2. Rate limit IP: max 5 comptes par 24h.
3. Verifie que `username` n'existe pas deja dans `public.users`.
4. Log l'action dans `action_rate_limits`.
5. Cree l'utilisateur via `admin.auth.admin.createUser`.
6. Met `email_confirm: true`.
7. Passe `username` dans `user_metadata`.
8. Le trigger SQL `handle_new_user` cree la ligne `public.users`.

### Points sensibles auth

- `SUPABASE_SECRET_KEY` est obligatoire pour l'inscription car `admin.createUser` est utilise.
- Ne jamais rendre cette route utilisable sans rate limit.
- Ne pas repasser a `signUp` si l'email est invisible, car la confirmation email peut bloquer l'utilisateur.
- Si l'utilisateur change son pseudo, l'email technique Supabase ne change pas actuellement. C'est acceptable tant que le login utilise l'identifiant courant? Attention: actuellement le login transforme l'identifiant saisi en email technique. Si un utilisateur change son username depuis `/settings`, son email Auth reste l'ancien email technique. Cela peut casser la connexion future avec le nouveau pseudo. C'est un point de dette technique important.

### Dette technique auth prioritaire

Resoudre la synchronisation username/email technique:

- Option A: interdire le changement de username apres creation.
- Option B: quand username change, utiliser admin Auth pour mettre a jour l'email technique.
- Option C: stocker un `login_id` immuable separe du `username` public.

Recommandation: ajouter un `login_id` immuable ou mettre a jour l'email Auth cote serveur lors du changement de username. Ne pas laisser le bug en production.

---

## 8. Roles et permissions

### Roles

- `user`: utilisateur standard, rouge.
- `moderator`: moderateur, bleu.
- `admin`: administrateur, vert.

### Permissions utilisateur

- Voir feed.
- Creer posts.
- Supprimer ses propres posts.
- Liker/disliker.
- Commenter.
- Sauvegarder/desauvegarder.
- Signaler.
- Chatter.
- Modifier profil.
- Changer mot de passe.
- Supprimer compte.

### Permissions moderateur

- Tout ce que user peut faire.
- Acces `/admin`.
- Voir signalements.
- Marquer un signalement/post comme frauduleux.

### Permissions admin

- Tout ce que moderator peut faire.
- Supprimer n'importe quel post.
- Changer roles utilisateur.
- Reception des signalements via notifications SQL.

### Securite roles

Le SQL contient:

- `current_role()`
- `is_admin()`
- `is_moderator()`
- trigger `prevent_role_escalation`

La route admin utilise le client service-role mais exige `requireAdmin` avant les updates.

---

## 9. Feed, posts et interactions

### Feed

Le feed utilise `GET /api/posts`, qui appelle la RPC SQL `get_feed_posts`.

Parametres:

- `scope=all`
- `scope=saved`
- `scope=user`
- `username`
- `cursor`

Pagination:

- 15 posts par page.
- cursor base sur `created_at`.

Realtime:

- `useInfiniteFeed` ecoute `INSERT` sur table `posts` pour refresh quand `scope=all`.

### Creation post

`POST /api/posts`:

- texte max 560 chars.
- image optionnelle.
- image max 5 Mo.
- MIME autorises: JPEG, PNG, WebP, GIF.
- Verification magic bytes.
- Quota upload 10 Mo/jour via RPC `can_upload_bytes`.
- Upload Storage bucket `post-media`, chemin `user.id/uuid.ext`.
- Insert `posts`.
- En cas d'erreur DB apres upload, suppression du media.

### Suppression post

- Route utilisateur: `DELETE /api/posts/[id]`.
- Admin: `DELETE /api/admin/posts/[id]`.
- Supprime le media Storage associe.
- Les relations DB sont en cascade.

### Likes/dislikes

Tables separees `likes` et `dislikes`, PK composite `(post_id, user_id)`. Trigger SQL `remove_opposite_reaction` supprime la reaction opposee.

### Commentaires

Commentaires max 360 chars. Les auteurs sont hydrates manuellement apres recuperation des commentaires.

### Sauvegardes

`saved_posts` ne duplique aucun fichier. C'est une relation `(user_id, post_id)`. Le quota 25 Mo est calcule sur `image_bytes` des posts sauvegardes.

Double protection:

- Route `/api/posts/[id]/save` verifie avant insert.
- Trigger SQL `ensure_saved_quota` protege la DB.

### Expiration

Chaque post a `expires_at` par defaut `now() + interval '10 days'`. Le cron supprime les posts expires.

---

## 10. Chat temps reel

### Tables

- `conversations`
- `conversation_members`
- `messages`

### Fonctionnement

`ChatShell`:

- charge conversations;
- selectionne la premiere si aucune active;
- charge messages de la conversation;
- cree une conversation par username;
- envoie messages;
- ecoute tous les `INSERT` sur `messages` via Supabase Realtime;
- si message dans conversation active, recharge messages;
- sinon recharge conversations pour mettre unread count a jour.

### Read/unread

`conversation_members.read_at` est mis a jour:

- apres `GET /api/chat/messages`;
- apres `POST /api/chat/messages` pour l'envoyeur.

`GET /api/chat/conversations` calcule `unread_count` en comparant `messages.created_at` et `read_at`.

### Limites actuelles

- Pas de typing indicator.
- Pas d'envoi image en chat.
- Pas de groupes.
- Pas de pagination ancienne profonde au-dela de 120 messages.

---

## 11. Notifications

### Tables et triggers

La table `notifications` recoit des insertions par triggers SQL:

- `notify_comment`
- `notify_like`
- `notify_report`
- `notify_message`

### UI

`NotificationsButton`:

- charge les 20 dernieres notifications;
- affiche badge non lu;
- dropdown;
- bouton mark all read;
- ecoute les notifications Realtime filtrees par `user_id`.

### Limites

- Pas de page notifications complete.
- Pas de suppression notifications.
- Pas de preferences notifications.

---

## 12. Moderation

### Signalement

Un utilisateur signale un post avec une raison 4-500 chars. La table `reports` a une contrainte unique `(post_id, reporter_id)`.

### Moderateur

Peut:

- consulter `/admin`;
- voir les signalements;
- marquer/demarquer frauduleux.

### Admin

Peut:

- tout faire cote moderation;
- supprimer un post signale;
- nommer un moderateur/admin via username ou id.

### Limites a combler

- Pas encore de journal d'audit visible.
- Pas encore de workflow "admin decide de supprimer ou conserver" avec statut detaille.
- Pas de ban utilisateur.
- Pas de masquage temporaire automatique des posts tres signales.
- Pas de page regles/charte.

---

## 13. Database Supabase

### Tables principales

- `roles`: referentiel roles.
- `users`: profil lie a `auth.users`.
- `posts`: posts texte/image avec expiration.
- `comments`: commentaires.
- `likes`: likes.
- `dislikes`: dislikes.
- `saved_posts`: sauvegardes sans duplication.
- `reports`: signalements.
- `conversations`: conversations privees.
- `conversation_members`: membres + read_at.
- `messages`: messages.
- `notifications`: notifications.
- `upload_events`: suivi quotas upload.
- `action_rate_limits`: rate limiting.

### RPC importantes

- `get_feed_posts`
- `check_rate_limit`
- `can_upload_bytes`
- `daily_uploaded_bytes`
- `saved_posts_bytes`
- `register_upload_event`
- `expired_post_media_paths`
- `cleanup_expired_posts`
- `mark_report_fraudulent` existe encore dans SQL mais la route actuelle utilise un update direct.

### Triggers importants

- `on_auth_user_created`: cree `public.users`.
- `prevent_role_escalation_trigger`: bloque escalation role.
- `ensure_post_upload_quota_trigger`: quota upload.
- `enforce_post_spam_limit_trigger`: anti spam posts.
- `enforce_comment_spam_limit_trigger`: anti spam commentaires.
- `enforce_message_spam_limit_trigger`: anti spam messages.
- `enforce_report_spam_limit_trigger`: anti spam signalements.
- `record_post_upload_trigger`: log upload post.
- `ensure_saved_quota_trigger`: quota sauvegardes.
- `remove_dislike_after_like`, `remove_like_after_dislike`: reaction exclusive.
- `notify_comment_trigger`, `notify_like_trigger`, `notify_report_trigger`, `notify_message_trigger`: notifications.

### Buckets Storage

- `avatars`: prive, max 2 Mo, JPEG/PNG/WebP.
- `post-media`: prive, max 5 Mo, JPEG/PNG/WebP/GIF.

Les URLs sont signees 1 heure via `signedAvatarUrl` et `signedPostUrl`.

### RLS

RLS est active sur toutes les tables publiques sensibles. Les policies principales:

- `users`: select authentifie; update soi-meme, admin via policy.
- `posts`: select posts non expires; insert auteur; delete auteur ou admin.
- `comments`: select si post live; insert auteur; delete auteur ou admin.
- `likes/dislikes`: select tous authentifies; insert/delete soi-meme.
- `saved_posts`: select/insert/delete soi-meme.
- `reports`: select reporter ou staff; insert reporter; update staff.
- `conversations/messages`: seulement membres.
- `notifications`: user_id uniquement.
- `upload_events`: select soi-meme.
- `action_rate_limits`: insert authentifie; select admin.

---

## 14. Securite

### Protections presentes

- Supabase Auth pour mots de passe hashes.
- RLS DB.
- Clients server/browser separes.
- Client admin seulement cote serveur.
- Zod sur inputs API.
- Verification magic bytes images.
- Limites tailles fichiers.
- Buckets prives.
- URLs signees.
- Rate limiting applicatif + DB.
- Triggers anti spam.
- Pas de `dangerouslySetInnerHTML`.
- SQL parametre via Supabase client.
- Cron protege par secret.

### Secrets

Variables:

- `NEXT_PUBLIC_SUPABASE_URL`: publique mais doit rester coherente.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: cle publique Supabase.
- `SUPABASE_SECRET_KEY`: secret serveur uniquement.
- `CRON_SECRET`: secret cron.
- `NEXT_PUBLIC_SITE_URL`: domaine public.

Ne jamais committer:

- `.env`
- `.env.local`
- `.dev.vars`
- tokens GitHub
- cles Supabase reelles
- dumps de logs contenant secrets

Le token GitHub et les cles deja partages dans conversation doivent etre regenes/revoques avant production.

### Passation pratique des cles

Les cles donnees par l'utilisateur dans une conversation peuvent servir uniquement a comprendre quelles variables existent et a tester temporairement en local. Elles ne doivent jamais etre copiees dans ce document, dans le README, dans `.env.example`, dans `.dev.vars.example`, dans un commit, dans une issue GitHub ou dans un message public.

La bonne passation consiste a documenter:

- le nom exact de la variable;
- son role;
- ou la renseigner;
- si elle est publique ou secrete;
- le format attendu, avec une valeur factice.

Exemple autorise:

```env
NEXT_PUBLIC_SUPABASE_URL=https://project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxx
SUPABASE_SECRET_KEY=sb_secret_xxxxxxxxx
CRON_SECRET=long-secret-random-value
NEXT_PUBLIC_SITE_URL=https://jpzone.duckdns.org
```

Exemple interdit:

```env
SUPABASE_SECRET_KEY=<vraie cle service role>
GITHUB_TOKEN=<vrai token personnel>
```

Classification des variables:

- `NEXT_PUBLIC_SUPABASE_URL`: publique. Elle peut etre visible cote navigateur, mais elle doit pointer vers l'URL de base Supabase, sans `/rest/v1/`.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: publique cote navigateur. Elle reste encadree par les RLS Supabase, donc les policies doivent etre correctes.
- `SUPABASE_SECRET_KEY`: secrete. Elle correspond a une cle serveur/service role capable de contourner les RLS. Elle doit rester uniquement dans les routes serveur, workflows securises ou variables d'environnement privees.
- `CRON_SECRET`: secrete. Elle protege `/api/cron/cleanup`; choisir une valeur longue et aleatoire.
- `NEXT_PUBLIC_SITE_URL`: publique. Utilisee pour connaitre le domaine public de l'app.
- `CLOUDFLARE_API_TOKEN`: secret GitHub Actions/Cloudflare uniquement, jamais cote client.
- `CLOUDFLARE_ACCOUNT_ID`: identifiant de compte Cloudflare. Moins critique qu'un token, mais a garder dans les secrets CI par proprete.
- Token GitHub personnel: a utiliser seulement localement ou dans un secret CI si absolument necessaire; ne jamais l'ecrire dans le repo ni le stocker dans l'URL remote.

Emplacements corrects:

- Local: `.env.local` pour Next.js, `.dev.vars` pour Wrangler/Cloudflare local si necessaire.
- GitHub Actions: Settings > Secrets and variables > Actions > Repository secrets.
- Cloudflare: variables/secrets du Worker ou de Pages selon le mode de deploiement.
- Vercel si retour a Vercel: Project Settings > Environment Variables, avec les memes noms.

Regle importante pour Supabase:

- Ne pas utiliser l'URL REST `https://project-ref.supabase.co/rest/v1/` comme `NEXT_PUBLIC_SUPABASE_URL`.
- Utiliser uniquement `https://project-ref.supabase.co`.
- La cle publishable va avec le client public.
- La cle secrete/service role va uniquement avec `createServerAdminClient`.

Rotation conseillee:

1. Si une cle secrete ou un token a ete colle dans une conversation, le considerer comme compromis.
2. Regenerer la cle dans Supabase, GitHub ou Cloudflare.
3. Remplacer la valeur dans `.env.local` et dans les secrets de deploiement.
4. Relancer `npm run build`.
5. Scanner le repo avant push.

Commandes utiles avant push:

```bash
git status
rg "sb_secret|github_pat|SUPABASE_SECRET_KEY=|CLOUDFLARE_API_TOKEN=" -g "!node_modules/**" -g "!.next/**" -g "!.env.local" -g "!.env" -g "!.dev.vars"
```

La commande `rg` ne doit retourner aucune vraie valeur secrete dans les fichiers versionnables. Si elle retourne seulement cette checklist avec des placeholders, verifier manuellement qu'il n'y a aucune vraie cle.

---

## 15. Deploiement

### Cloudflare / OpenNext (deploiement unique)

Le projet utilise exclusivement Cloudflare Workers/Pages via OpenNext et Wrangler. Le deploiement est automatique via GitHub Actions a chaque push sur la branche principale.

#### Deploiement manuel (local)

Commande:

```bash
npm run build:cloudflare
npm run deploy
```

Fichiers de configuration:

- `wrangler.jsonc`: config Cloudflare Worker/OpenNext.
- `open-next.config.ts`: config OpenNext Cloudflare.
- `public/_headers`: cache immutable pour `/_next/static/*` sur Cloudflare.
- `.github/workflows/deploy-cloudflare.yml`: workflow GitHub Actions pour deploiement automatique.
- `.github/workflows/cron-cleanup.yml`: workflow GitHub Actions pour cron cleanup des posts expires.

#### Deploiement automatique (GitHub Actions)

Le workflow se declenche automatiquement a chaque push sur la branche principale. Il:

1. Installe les dependances.
2. Lance `npm run typecheck`.
3. Lance `npm run build:cloudflare`.
4. Deploie sur Cloudflare via Wrangler.

Variables requises dans GitHub Secrets:

- `CLOUDFLARE_API_TOKEN`: token d'API Cloudflare avec permissions Workers (a creer dans Cloudflare Dashboard).
- `CLOUDFLARE_ACCOUNT_ID`: ID du compte Cloudflare (disponible dans Cloudflare Dashboard).
- `NEXT_PUBLIC_SUPABASE_URL`: URL Supabase (ex: `https://xxx.supabase.co`).
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: cle publique Supabase.
- `SUPABASE_SECRET_KEY`: secret serveur Supabase (service_role).
- `CRON_SECRET`: secret pour le cron (a generer).
- `NEXT_PUBLIC_SITE_URL`: domaine public (ex: `https://jpzone.duckdns.org`).

Pour configurer les secrets:
1. Aller dans Settings > Secrets and variables > Actions du repo GitHub.
2. Cliquer sur "New repository secret".
3. Ajouter chaque variable avec sa valeur.

Un guide detaille est disponible dans `GUIDE_SETUP_GITHUB.md`.

#### Cron cleanup

Le cron de nettoyage des posts expires (`/api/cron/cleanup`) etait configure via Vercel. Avec Cloudflare, plusieurs options:

- Option A: Utiliser Cloudflare Cron Triggers (Workers).
- Option B: Utiliser GitHub Actions avec schedule.
- Option C: Utiliser un service externe (cron-job.org, etc.).
- Option D: Utiliser Supabase pg_cron (si disponible).

Recommandation: GitHub Actions schedule car deja utilise pour le deploiement.

### DNS

Domaine vise: `jpzone.duckdns.org`.

Ne pas confondre:

- URL site: `https://jpzone.duckdns.org`
- URL Supabase base: `https://<project-ref>.supabase.co`
- URL REST Supabase: `https://<project-ref>.supabase.co/rest/v1/`

Dans `NEXT_PUBLIC_SUPABASE_URL`, il faut la base, pas `/rest/v1/`.

---

## 16. Conventions de code

### General

- TypeScript strict.
- Alias imports `@/...`.
- Composants React fonctionnels.
- Client components marques `"use client"`.
- Route Handlers dans `app/api/.../route.ts`.
- Validation dans `lib/validation.ts`.
- Helpers partages dans `lib`.
- Types DB/API dans `types`.

### UI

- Tailwind uniquement.
- Icnes via `lucide-react`.
- Utiliser `cn` pour fusionner classes conditionnelles.
- Garder les cards a rayon modere.
- Eviter cartes imbriquees inutiles.
- Mobile first.
- Garder les textes courts dans boutons.
- Utiliser icons pour actions connues.

### API

- Toujours appeler `getRouteUser`, `getRouteProfile`, `requireAdmin` ou `requireStaff` selon le besoin.
- Toujours valider les bodies avec Zod ou checks explicites.
- Toujours renvoyer via `jsonOk` / `jsonError`.
- Toujours proteger les actions ecrites par rate limit si elles peuvent spammer.
- Ne pas utiliser `any`.

### Supabase

- Browser client seulement cote client.
- Server client pour session SSR.
- Admin client seulement en Route Handler/server action equivalente.
- RPC via `supabaseRpc<T>` si le typage Supabase genere un probleme.

---

## 17. Preferences utilisateur

Ce que l'utilisateur a exprime ou montre:

- Il veut que l'IA agisse concretement, pas seulement proposer.
- Il prefere des livrables complets et directement utilisables.
- Il veut du gratuit ou quasi gratuit.
- Il est sensible aux bugs de build/deploiement.
- Il fournit parfois des informations sensibles pour aller vite; il faut proteger ces secrets.
- Il aime une interface moderne, sombre, fluide et engageante.
- Il veut des explications claires en francais.
- Il veut savoir quels fichiers ont ete modifies et quels tests ont ete faits.
- Il accepte les solutions pragmatiques si elles marchent.
- Il veut pouvoir confier le projet a une autre IA sans perte de contexte.

Communication recommandee:

- Parler en francais.
- Etre direct et concret.
- Donner le resultat d'abord.
- Lister les fichiers importants modifies.
- Dire les tests faits.
- Signaler les risques sans dramatiser.
- Recommander une meilleure option quand plusieurs choix existent.
- Ne pas noyer dans du jargon inutile.

---

## 18. Regles permanentes pour les futures IA

Checklist obligatoire:

- Lire `PROJECT_STATE.json`, `README.md` et ce document avant gros changement.
- Verifier le code actuel plutot que faire confiance a un souvenir.
- Ne jamais committer de secrets.
- Ne jamais exposer `SUPABASE_SECRET_KEY`.
- Toujours maintenir `.gitignore`.
- Toujours tester `npm run typecheck`.
- Toujours tester `npm run build:cloudflare`.
- Preserver l'auth par identifiant.
- Preserver la philosophie sombre/rapide/sociale.
- Preserver RLS et triggers.
- Ne pas supprimer un ancien fichier important sans autorisation claire.
- Expliquer les changements.
- Indiquer les fichiers modifies.
- Dire ce qui a ete teste.
- Penser mobile.
- Penser performance.
- Penser moderation.
- Penser monetisation future.
- Penser validation AdSense future.
- Penser UX engageante.
- Mettre a jour la documentation apres changement important.

---

## 19. Erreurs a eviter

### Techniques

- Utiliser l'URL Supabase `/rest/v1/` dans `NEXT_PUBLIC_SUPABASE_URL`.
- Importer le client admin dans un composant client.
- Oublier `"use client"` sur un composant avec hooks.
- Utiliser `any` pour masquer un probleme de type.
- Retirer `Relationships` dans `types/database.ts`, ce qui peut recreer des erreurs `never`.
- Casser les cookies SSR dans `middleware.ts`.
- Changer `middleware.ts` en `proxy.ts` sans tester Cloudflare/OpenNext.
- Oublier le lockfile.
- Lancer `npm audit fix --force` sans verifier: cela peut proposer des downgrades dangereux.
- Configurer Vercel au lieu de Cloudflare.

### UX/UI

- Revenir a une inscription email visible.
- Ajouter une landing page marketing en premier ecran.
- Faire une interface trop claire ou hors theme.
- Cacher les actions principales.
- Creer des blocs publicitaires trop agressifs.
- Oublier mobile.
- Laisser du texte deborder.

### Securite

- Commiter `.env.local`.
- Mettre une vraie cle dans README.
- Rendre le bucket public sans raison.
- Retirer les limites upload.
- Retirer le rate limiting.
- Autoriser changement de role cote client.
- Desactiver RLS.

### Monetisation

- Ajouter de vraies pubs avant pages legales.
- Encourager les clics.
- Melanger contenus non moderes et publicites sans controle.
- Oublier contact/confidentialite/conditions.

### Communication

- Dire "tout est bon" sans tests.
- Ne pas mentionner les risques.
- Modifier beaucoup de fichiers sans expliquer.
- Ignorer les preferences utilisateur.

---

## 20. Points sensibles a ne pas casser

- Auth identifiant -> email technique.
- Route `POST /api/auth/register`.
- Trigger `on_auth_user_created`.
- RLS `users`, `posts`, `reports`, `messages`.
- Buckets prives et URLs signees.
- Quotas upload/sauvegarde.
- `useInfiniteFeed` et pagination cursor.
- Chat Realtime et `read_at`.
- Notifications Realtime.
- `middleware.ts` pour session Supabase.
- `NEXT_PUBLIC_SITE_URL`.
- `CRON_SECRET`.
- `removePostMedia` apres suppression posts.
- `saved_posts` relation, sans duplication de fichiers.

---

## 21. Checklist avant deploiement

Technique:

- `npm install` si dependances changees.
- `npm run typecheck`.
- `npm run build:cloudflare`.
- Verifier `.env.local` non tracke.
- Verifier aucune cle dans `rg "sb_secret|github_pat|SUPABASE_SECRET_KEY="` hors fichiers ignores.
- Verifier routes API sensibles.
- Verifier workflow GitHub Actions.
- Verifier secrets GitHub.

UI/UX:

- Login desktop.
- Login mobile.
- Register desktop/mobile.
- Feed connecte.
- Composer post texte.
- Composer post image.
- Like/dislike.
- Commentaire.
- Sauvegarde.
- Signalement.
- Chat.
- Notifications.
- Settings.
- Admin si role staff.

Securite:

- RLS applique en Supabase.
- Buckets prives.
- Storage policies en place.
- Variables deployment configurees.
- Secrets regenes si partages.

Monetisation/AdSense future:

- Pas de vrais ads sans pages legales.
- Pas de contenu interdit.
- Navigation claire.
- Site mobile propre.

---

## 22. Priorites actuelles

### P0 - Avant ouverture publique

1. Regenerer/revoquer toutes les cles et tokens partages en conversation.
2. Corriger la dette username/email technique si username modifiable.
3. Verifier que `supabase/schema.sql` a ete execute sur le bon projet Supabase.
4. Creer le premier admin via `supabase/seed.sql`.
5. Tester inscription/connexion avec vrai Supabase.
6. Tester creation post et upload image.
7. Tester RLS avec deux comptes.
8. Ajouter charte, contact, confidentialite, conditions.
9. Configuration deploiement automatique Cloudflare via GitHub Actions (termine).

### P1 - Stabilisation

1. Ajouter tests automatises minimaux pour validation et API critiques.
2. Ajouter page notifications.
3. Ajouter statut moderation plus detaille.
4. Ajouter suppression/expiration notifications anciennes.
5. Ajouter meilleure gestion erreurs UI.

### P2 - Croissance

1. Integrer monetisation.
2. Ajouter analytics respectueux vie privee.
3. Ameliorer decouverte et onboarding.
4. Ajouter recherche utilisateur/post.
5. Ajouter moderation avancee.

---

## 23. Roadmap

### Court terme

- Finaliser auth identifiant.
- Tester avec Supabase reel.
- Push GitHub propre sans secrets.
- Deployer sur Cloudflare via GitHub Actions.
- Ajouter pages legales minimales.
- Creer compte admin.

### Moyen terme

- Moderation plus complete.
- Recherche.
- Page notifications.
- Page soutien.
- UX d'onboarding.
- Tests e2e de parcours critiques.

### Long terme

- Monetisation AdSense/partenariats.
- Analytics.
- Badges/achievements.
- Recommandations de posts.
- Moderation anti-abus plus avancee.
- Eventuellement application mobile/PWA.

---

## 24. Bugs connus et dettes techniques

### Username modifiable vs login identifiant

Le login transforme le username saisi en email technique. Si le username change dans `settings`, l'email Supabase Auth peut rester base sur l'ancien username. Il faut traiter ce point avant production.

### `PROJECT_STATE.json` encodage

Certains accents apparaissent corrompus dans les sorties terminal. Ne pas supprimer le fichier; si besoin, le re-sauvegarder proprement en UTF-8 apres verification.

### Middleware Next 16

Next 16 deprecie `middleware.ts` au profit de `proxy.ts`, mais `PROJECT_STATE.json` indique que `middleware.ts` a ete conserve pour Cloudflare/OpenNext. Toute migration doit etre testee sur Cloudflare.

### Typage Supabase manuel

`types/database.ts` est manuel. Si le schema change, il faut le mettre a jour. Des erreurs de build precedentes venaient de types `never`/RPC mal inferees.

### Tests automatises absents

Pas de suite de tests unitaires/e2e pour l'instant. Les controles actuels sont principalement build/typecheck et tests manuels navigateur.

---

## 25. Journal des evolutions connues

### Creation initiale

- Scaffold Next.js TypeScript Tailwind.
- Supabase clients.
- Schema SQL complet.
- Feed, auth, chat, admin, settings.
- README et env example.

### Corrections Cloudflare

- Ajout de `Relationships` dans types DB.
- Remplacement appels RPC directs par helper `supabaseRpc`.
- Correction de types `never`.
- Configuration OpenNext et Wrangler.

### Tests locaux Node

- `npm install`.
- `npm audit --audit-level=moderate`: OK a un moment donne.
- `npm run typecheck`: OK.
- `npm run build`: OK avec variables locales.
- Browser local: login/register OK, redirect `/feed` sans session OK.

### Auth sans email

- Formulaires modifies pour identifiant.
- Email technique cache via `identifierToAuthEmail`.
- Register route utilise `admin.auth.admin.createUser(email_confirm: true)`.

### Cloudflare/OpenNext

- Ajout scripts Cloudflare.
- Ajout `wrangler.jsonc`.
- Ajout `open-next.config.ts`.
- Ajout `public/_headers`.

### Migration deploiement exclusif Cloudflare

- Suppression de la dependance Vercel.
- Suppression de `vercel.json`.
- Mise a jour de tous les scripts pour utiliser uniquement Cloudflare.
- Creation du workflow GitHub Actions `.github/workflows/deploy-cloudflare.yml` pour deploiement automatique.
- Creation du workflow GitHub Actions `.github/workflows/cron-cleanup.yml` pour le cron cleanup.
- Creation du guide `GUIDE_SETUP_GITHUB.md` pour la configuration des secrets.
- Mise a jour complete du document de passation pour ne mentionner que Cloudflare.
- Configuration des 7 secrets GitHub Actions pour le deploiement automatique :
  - `CLOUDFLARE_API_TOKEN` : token API Cloudflare
  - `CLOUDFLARE_ACCOUNT_ID` : ID du compte Cloudflare (2e5aac0740a4a074682db59672e9e7fb3)
  - `NEXT_PUBLIC_SUPABASE_URL` : URL du projet Supabase (https://yvwlpwfnhdijggpvhgno.supabase.co)
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` : cle publique Supabase
  - `SUPABASE_SECRET_KEY` : cle service_role Supabase
  - `CRON_SECRET` : secret pour le cron cleanup
  - `NEXT_PUBLIC_SITE_URL` : domaine public (https://jpzone.duckdns.org)

---

## 26. Conseils de reprise

Pour une nouvelle IA:

1. Commencer par `rg --files -g '!node_modules/**' -g '!.next/**'`.
2. Lire `README.md`, `PROJECT_STATE.json`, ce document.
3. Lire les fichiers concernes par la demande.
4. Ne jamais supposer que `PROJECT_STATE.json` est parfaitement a jour si le code dit autre chose.
5. Avant push/deploiement, scanner secrets.
6. Demander confirmation avant action destructive ou push avec token.
7. Toujours utiliser le repo local comme source de verite.

---

## 27. Resume final

Si tu ne devais retenir que l'essentiel:

Jean Prevost Social est une app Next.js/Supabase de reseau social scolaire sombre, rapide et engageante. Elle utilise Supabase pour Auth, DB, Storage et Realtime. L'utilisateur se connecte avec un identifiant, pas un email; l'email technique Supabase est cache. Le feed supporte posts texte/image, likes, dislikes, commentaires, sauvegardes, signalements, expiration apres 10 jours et placeholders pub. Le chat prive et les notifications utilisent Realtime. Les roles `user`, `moderator`, `admin` pilotent moderation et suppression. La securite repose sur RLS, triggers SQL, quotas, buckets prives, URLs signees et rate limiting.

La priorite absolue est de proteger les secrets, tester les builds, garder RLS intact, corriger la dette username/email technique avant production, et ajouter pages legales/charte avant vraie monetisation.
