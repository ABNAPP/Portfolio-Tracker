# Firestore Setup Guide

## Firestore Security Rules

För att säkerställa att data synkas korrekt behöver du konfigurera Firestore Security Rules.

### Steg 1: Deploya Security Rules

1. Gå till [Firebase Console](https://console.firebase.google.com/)
2. Välj ditt projekt: `portfolio-tracker-771a9`
3. Gå till **Firestore Database** → **Rules**
4. Kopiera innehållet från `firestore.rules` och klistra in
5. Klicka på **Publish**

### Steg 2: Verifiera Rules

Security rules säkerställer att:
- Endast inloggade användare kan komma åt data
- Varje användare kan bara läsa/skriva sina egna data
- Data är isolerad per användare baserat på `userId`

### Vad som synkas

Följande data synkas nu mellan localhost och Vercel via Firestore:
- ✅ Portfolio data (`data` - holdings, cash accounts, loan accounts)
- ✅ FX rates (`fx`)
- ✅ Base currency (`baseCurr`)

### Migration från localStorage

När en användare loggar in första gången efter att Firestore-synkning är aktiverad:
1. Systemet försöker ladda data från Firestore
2. Om ingen data finns i Firestore, laddas den från gamla localStorage-nycklar
3. Data migreras automatiskt till Firestore
4. Från och med då synkas allt automatiskt

### Offline-funktionalitet

- Data sparas även lokalt i localStorage som backup
- Om Firestore inte är tillgänglig faller systemet tillbaka på localStorage
- När anslutningen återställs synkas ändringar automatiskt

