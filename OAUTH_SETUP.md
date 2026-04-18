# Configuration OAuth (Google + Facebook)

PitStop supporte la connexion/inscription via Google et Facebook. Les deux providers utilisent le même système de session que la connexion par email (cookie `pitstop_auth`).

## 1) Google

### Créer les credentials

1. Aller sur [Google Cloud Console](https://console.cloud.google.com/).
2. Créer (ou sélectionner) un projet.
3. **APIs & Services → OAuth consent screen**
   - Type : **External**
   - Remplir le nom de l'app, email support, logo, lien vers `/confidentialite`
   - Scopes : `openid`, `email`, `profile`
   - Publier l'app (sortir du mode "Testing") quand elle est prête pour le grand public
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Type : **Web application**
   - Authorized JavaScript origins :
     - `https://pitstop-diagnostic.live`
     - `http://localhost:3000` (dev)
   - Authorized redirect URIs :
     - `https://pitstop-diagnostic.live/api/auth/oauth/google/callback`
     - `http://localhost:3000/api/auth/oauth/google/callback` (dev)
5. Copier **Client ID** et **Client secret** dans `.env.local` / Vercel :
   ```
   GOOGLE_CLIENT_ID="..."
   GOOGLE_CLIENT_SECRET="..."
   ```

## 2) Facebook

### Créer l'app

1. Aller sur [Meta for Developers](https://developers.facebook.com/).
2. **My Apps → Create App** → type **Consumer**.
3. **Products → Facebook Login → Settings**
   - Valid OAuth Redirect URIs :
     - `https://pitstop-diagnostic.live/api/auth/oauth/facebook/callback`
     - `http://localhost:3000/api/auth/oauth/facebook/callback` (dev)
4. **App Settings → Basic**
   - Copier **App ID** et **App Secret** dans `.env.local` / Vercel :
     ```
     FACEBOOK_APP_ID="..."
     FACEBOOK_APP_SECRET="..."
     ```
   - Renseigner Privacy Policy URL : `https://pitstop-diagnostic.live/confidentialite`
   - Remplir les infos app (catégorie, icône…)
5. **App Review → Permissions and Features** : `email` et `public_profile` sont disponibles par défaut en mode développement. Pour le grand public, passer l'app en **Live** (le bouton en haut de la console).

## 3) Vercel — variables d'environnement

Ajouter les 4 variables dans **Settings → Environment Variables** (Production + Preview) :

| Variable                | Valeur                |
| ----------------------- | --------------------- |
| `GOOGLE_CLIENT_ID`      | (Google Cloud)        |
| `GOOGLE_CLIENT_SECRET`  | (Google Cloud)        |
| `FACEBOOK_APP_ID`       | (Meta for Developers) |
| `FACEBOOK_APP_SECRET`   | (Meta for Developers) |

Puis redéployer.

## 4) Fonctionnement côté code

- Routes : `app/api/auth/oauth/[provider]/start` et `app/api/auth/oauth/[provider]/callback`
- Logique de résolution de compte (`lib/oauth-db.ts` → `resolveOAuthSignIn`) :
  1. **OAuth déjà lié** → connexion directe
  2. **Email existant + vérifié par le provider** → liaison automatique OAuth ↔ compte
  3. **Nouveau** → création du compte (sans mot de passe local, sans code postal initial)
- Les comptes OAuth-only ont `passwordHash = "oauth$none"`. `verifyPassword` renvoie toujours `false` pour ce marqueur : l'utilisateur ne peut pas se connecter par formulaire classique tant qu'il n'a pas défini un mot de passe via `/mot-de-passe-oublie`.
- Table `OAuthAccount` : créée automatiquement au premier appel (voir `lib/oauth-db.ts → ensureOAuthTable`).

## 5) Limitations connues / TODO

- **Code postal manquant** pour les nouveaux comptes OAuth : le compte est créé sans `signupPostalCode`. Envisager d'ajouter un écran "complétez votre profil" lors de la première visite post-OAuth (détection via le paramètre `?oauth_welcome=1` déjà renvoyé par le callback).
- **Écran de liaison depuis le profil** : permettre à un utilisateur email de lier Google/Facebook a posteriori (pas encore implémenté).
- **Rate limiting** : les routes OAuth ne sont pas rate-limitées côté PitStop (la protection vient des providers eux-mêmes).

## 6) Test local

1. Renseigner les 4 variables dans `.env.local`.
2. S'assurer que `NEXT_PUBLIC_SITE_URL="http://localhost:3000"` (pour la construction du redirect URI).
3. `npm run dev` puis visiter `http://localhost:3000/connexion`.
4. Cliquer "Continuer avec Google" / "Continuer avec Facebook".
