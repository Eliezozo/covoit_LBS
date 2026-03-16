# LBS Covoit

Monorepo de travail pour la PWA mobile-first LBS Covoit.

## Vision
PWA mobile-first pour la communaute de Lomé Business School (LBS). UX onglets, design premium clean, NativeWind (Tailwind), couleurs : navy (#1e3a8a), fond blanc, accents gris.

## Architecture
- apps/mobile : Expo Router + React Native Web + Supabase (Auth, Database, Realtime)
- apps/functions : Supabase Edge Functions (migration recommandée)
## Authentification
- Google OAuth2 via Firebase Auth
- Domaine strict : @lomebs.com.
- Validation cote client (AuthProvider, domain.ts) et cote serveur (Cloud Functions + Firestore Rules)

## Zones et tarification
- zone-1 : 2 jetons
- zone-2 : 4 jetons
- zone-3 : 7 jetons
- Commission : 20% env. (Math.ceil), versement conducteur = tokens - commission.

## Exigences d'environnement
- Node 18 (fichier .nvmrc)
- Expo SDK (managé) et Expo Router
- NativeWind + React Native for Web

## Commandes
- `npm install`
- `npm run start` (ou web/android/ios)
- `npm run lint`
