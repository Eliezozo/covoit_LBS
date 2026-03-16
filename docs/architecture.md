# Architecture LBS Covoit

Ce document formalise l'architecture du projet et les choix techniques selon le prompt.

## 1. Vision et identité
- PWA React Native (Expo + Router) avec ergonomie mobile-first et navigation onglets.
- Couleurs : navy (#1e3a8a), blanc, slate gray.
- Styling : NativeWind (Tailwind) pour cohérence desktop/mobile.

## 2. Téléchargez le dossier et commandez
- `cd apps/mobile`
- `npm install`
- `npm run start`

## 3. Système de zonage & tarification
- `apps/mobile/src/config/pricing.ts` : 3 zones + `COMMISSION_RATE`.
- `apps/functions/src/index.ts` : fonction `tokensForZone`, `computeCommission`, `computeDriverPayout`.

## 4. Authentification et sécurité
- Google OAuth2 via Supabase Auth.
- Domaine autorisé : `@lomebs.com` uniquement.
- Vérification côté client (`isAllowedEmail`) + côté serveur (RPC et policies Supabase).
- On détruit la session lorsque le domaine est invalide.

## 5. Flot métier
1. Conducteur crée un trajet dans `rides`.
2. Passager réserve via `reserveRide` (callable Cloud Function) : place réduite, jetons retenus, transaction type « hold ».
3. Conducteur partage QR (`QrCodeCard`), passager scanne.
4. `finalizeRide` valide la réservation, versement conducteur, commission enregistrée.

## 6. Améliorations réalisées
- Normalisation stricte du domaine avec regex exact (plus sûr que `.endsWith`).
- .nvmrc Node 18 ajouté.
- README enrichi.
- Firestore rules durcies sur domaine.

## 7. Points d'évolution possibles
- Tests unitaires (Vitest/Jest) pour `pricing.ts`, `auth/domain.ts`.
- Migration vers TypeScript stricte à tous les niveaux (cloud, mobile).
- Ajout d'une page admin détaillant commissions en temps réel.
