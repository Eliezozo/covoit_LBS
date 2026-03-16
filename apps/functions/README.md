# LBS Covoit - Cloud Functions

## Prerequis
- Node 18
- Firebase CLI connecte a votre projet

## Installation
```bash
npm install
```

## Build
```bash
npm run build
```

## Deploiement
```bash
firebase deploy --only functions
```

## Emulators (local)
Depuis la racine du repo:
```bash
firebase emulators:start --only functions,firestore
```

UI: http://localhost:4000  
Functions: http://localhost:5001  
Firestore: http://localhost:8080

## Admin claims
Attribuer le claim admin (necessaire pour l'ecran Admin):

```bash
GOOGLE_APPLICATION_CREDENTIALS=/chemin/service-account.json \
node scripts/set-admin-claim.js <uid> true
```

Pour retirer le claim admin:
```bash
GOOGLE_APPLICATION_CREDENTIALS=/chemin/service-account.json \
node scripts/set-admin-claim.js <uid> false
```
