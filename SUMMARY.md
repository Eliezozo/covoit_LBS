# Summary (journee)

## Etat du projet
- App mobile Expo Router + Supabase + NativeWind operationnelle (PWA mobile-first).
- Auth Google OAuth2 avec restriction stricte sur @lomebs.com.
- Zonage + commission 20% implementes.
- Reservation de trajets (sequestre), QR conducteur, scan passager, finalisation.
- Wallet (solde, historique) + achat de jetons via Cloud Functions.
- Module Admin (commissions) disponible avec un claim `admin`.

## Backend (Cloud Functions)
- `reserveRide`: verifie trajet/zone/places/solde, cree reservation, genere `qrToken`, bloque les jetons.
- `finalizeRide`: valide le QR, confirme reservation, verse conducteur, enregistre commission + metriques.
- `purchaseTokens`: credite le wallet et cree une transaction.
- `getCommissionSummary`: reserve aux admins (custom claim `admin: true`).

## Regles Firestore
- Acces limite aux comptes @lomebs.com.
- `wallets`, `transactions`, `rideReservations`: lecture restreinte, ecriture interdite client.
- `commissions` et `platformMetrics`: totalement verrouilles client.

## Points techniques a surveiller
- Les Functions demandent Node 18, la machine est en Node 24 (changer de version ou ajouter un .nvmrc).

## Prochaines etapes
1. Deployer les Functions (`firebase deploy --only functions`).
2. Utiliser le script admin pour assigner le claim `admin: true`.
3. (Optionnel) Mettre en place emulators + seed de donnees pour tests rapides.
