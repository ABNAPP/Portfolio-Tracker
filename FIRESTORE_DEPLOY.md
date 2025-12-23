# Firestore Security Rules - Deployment Guide

## Steg-för-steg instruktioner

### 1. Öppna Firebase Console
- Gå till [Firebase Console](https://console.firebase.google.com/)
- Välj ditt projekt: **portfolio-tracker-771a9** (eller det projekt du använder)

### 2. Navigera till Firestore Rules
- I vänstermenyn, klicka på **Firestore Database**
- Klicka på fliken **Rules** (överst i Firestore-sidan)

### 3. Kopiera Rules
- Öppna filen `firestore.rules` i detta projekt
- Kopiera **hela innehållet** från filen (Ctrl+A, Ctrl+C)

### 4. Klistra in Rules i Firebase Console
- I Firebase Console, klicka i textrutan där reglerna finns
- Ersätt allt innehåll med de kopierade reglerna (Ctrl+A, Ctrl+V)

### 5. Validera Rules
- Firebase Console validerar automatiskt syntaxen
- Om det finns fel visas de i rött
- Kontrollera att inga fel visas innan du publicerar

### 6. Publicera Rules
- Klicka på knappen **Publish** (lila knapp längst upp)
- Bekräfta att du vill publicera de nya reglerna

### 7. Verifiera
- Efter publicering ska du se en grön bekräftelse
- Reglerna är nu aktiva och gäller för alla Firestore-anrop
- Testa din app i Vercel - permission errors ska försvinna

## Vad reglerna gör

Reglerna säkerställer att:

1. **Endast inloggade användare** kan komma åt data
2. **Varje användare kan bara läsa/skriva sin egen data** under `users/{theirUserId}/...`
3. **All annan access blockeras** (deny-all rule längst ner)

## Firestore Collections som skyddas

- `users/{uid}/portfolio/data` - Huvudportföljdata
- `users/{uid}/transactions/{transactionId}` - Transaktioner
- `users/{uid}/chartData/{chartId}` - Diagramdata
- `users/{uid}/historyProfiles/{profileId}` - Historikprofiler

## Felsökning

### Permission errors kvarstår?
- Kontrollera att du har publicerat reglerna (inte bara sparat)
- Vänta 30-60 sekunder efter publicering (rules kan ta tid att propagera)
- Kontrollera att användaren är inloggad (`request.auth != null`)

### Syntax errors?
- Se till att du kopierade hela filen inklusive `rules_version = '2';` överst
- Kontrollera att alla `{` och `}` matchar

### Fortfarande problem?
- Se `FIRESTORE_DEBUG.md` för detaljerad felsökning
