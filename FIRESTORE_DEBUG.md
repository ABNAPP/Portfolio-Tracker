# Firestore Debugging Guide

## Problem: Data syns på localhost men inte på Vercel

### Steg 1: Kontrollera Firestore Security Rules

1. Gå till [Firebase Console](https://console.firebase.google.com/)
2. Välj projektet: `portfolio-tracker-771a9`
3. Gå till **Firestore Database** → **Rules**
4. Kontrollera att reglerna är deployade och ser ut så här:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /portfolio/{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

5. Klicka på **Publish** om du har gjort ändringar

### Steg 2: Kontrollera Console Logs

Öppna Developer Console (F12) och leta efter:

- `[PortfolioData] Setting up Firestore listener` - Betyder att listener startas
- `[PortfolioData] Received update for data from Firestore` - Betyder att data laddas från Firestore
- `[PortfolioData] PERMISSION DENIED` - Betyder att security rules blockerar åtkomst
- `[PortfolioData] Failed to save to Firestore` - Betyder att det finns ett fel

### Steg 3: Kontrollera Firestore Database

1. Gå till Firebase Console → Firestore Database → Data
2. Leta efter en collection som heter `users`
3. Kolla om det finns ett dokument med ditt user ID
4. Kolla om det finns en subcollection `portfolio` med ett dokument `data`

### Steg 4: Testa manuellt

1. Logga in på localhost
2. Lägg till en aktie
3. Öppna Console och kolla om du ser: `[PortfolioData] Successfully saved data to Firestore`
4. Gå till Firebase Console → Firestore → Data
5. Verifiera att data finns där
6. Logga in på Vercel med samma konto
7. Kolla Console för felmeddelanden

### Vanliga problem:

1. **Permission Denied**: Security rules är inte deployade eller felaktiga
2. **Document doesn't exist**: Data har inte migrerats från localStorage till Firestore ännu
3. **Network error**: Firestore kan inte nås (kolla internetanslutning)

### Lösning: Force Migration

Om data inte migreras automatiskt, kan du manuellt trigga migration genom att:

1. Öppna Console på localhost
2. Kör: `localStorage.clear()` (varning: raderar all lokal data)
3. Logga in igen
4. Data ska laddas från Firestore

ELLER

1. Logga in på localhost
2. Gör en liten ändring (t.ex. ändra basvaluta)
3. Detta triggar en save till Firestore
4. Logga in på Vercel - data ska nu synas

