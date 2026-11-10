# Babbo BrunoDay — Backend Firebase (NON ATTIVO)
Questa cartella contiene Cloud Functions per le prenotazioni delle 22 date, dal 3 al 24 dicembre 2026.

## Design
- Accesso con **solo numero tessera** come richiesto (consapevolmente **non verifica l'identità**: una persona che conosce una tessera altrui può prenotare a suo nome).
- Infrastruttura: autenticazione anonima Firebase per ottenere un token tecnico; Callable Functions per tutte le operazioni; Firestore con regole *deny all* lato browser.
- `reserveDay`: transazione Firestore per prenotare atomicamente una sola casella e una sola tessera. Controllo della data **server-side** usando Europe/Rome: 15 novembre ore 00:00 – 30 novembre ore 23:59:59 del 2026.
- `calendarState`: mostra prenotato/libero; mostra `recipientName` solo dal giorno corrispondente (mai il nome del regalo).
- `myReservation`: restituisce nome e giorno a chi conosce la tessera. ATTENZIONE: l'assenza di un PIN permette l'enumerazione dei nomi; evitare l'utilizzo di dati sensibili.
- `adminOverview`: restituisce stato completo solo a utente Firebase Auth con custom claim `admin:true`.

## Configurazione manuale in Firebase Console
1. Crea un progetto Firebase e registra una Web App (GitHub Pages).
2. Abilita Firestore in modalità produzione, area europea.
3. Abilita Firebase Authentication → Anonymous; per l'amministratore abilita anche Google.
4. In Authentication → Settings → Authorized domains aggiungi `abapp93-bot.github.io` (se necessario).
5. Registra App Check per la Web App; consigliato **reCAPTCHA Enterprise**, con enforcement delle Functions solo dopo aver verificato le chiamate. Non considerarlo un'identificazione dell'utente.
6. Cloud Functions 2nd gen può richiedere il piano Blaze (fatturazione attiva). Imposta budget e alert prima del deploy.
7. Copia la web config in `avvento/firebase-config.js` (il file è ignorato da git: per la distribuzione su GitHub Pages va poi caricato esplicitamente oppure generato da un processo di build; non inserire mai chiavi amministratore).
8. Sul tuo computer: installa Node.js, `npm i -g firebase-tools`, `firebase login`, `firebase use --add`, `npm install --prefix functions`, `firebase deploy --only firestore:rules,functions`.

## Inizializzare le tessere senza pubblicare i nomi su GitHub
Crea un file **privato** JSON con esattamente 22 elementi, ad esempio:
```json
[{"card":"BD-001","name":"NomeDaMostrare"}, {"card":"BD-002","name":"..." }]
```
Completa tutte le 22 righe, senza versionare il file. Con credenziali amministrative Firebase **locali**:
`GOOGLE_APPLICATION_CREDENTIALS=/path/service-account.json GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID npm --prefix functions run seed -- /absolute/path/participants.json`
Non ripetere lo script su un database già inizializzato. Non inviare service-account o PIN in chat.

## Dashboard organizzatore
Con Google Authentication effettua accesso nella dashboard e recupera l'UID; assegna il claim `admin:true` **da un ambiente fidato** con:
`GOOGLE_APPLICATION_CREDENTIALS=/path/service-account.json npm --prefix functions run admin -- FIREBASE_AUTH_UID`
Poi rientra nell'account per aggiornare il token. Il file `admin/index.html` usa `adminOverview`.

## Limitazioni / TODO prima della pubblicazione
- Verificare configurazione cloud, budget, App Check, dominio autorizzato e protezione contro abusi (e.g. rate limiting); attualmente le funzioni richiedono un token Auth ma NON impongono App Check.
- Eseguire test reali su due browser contemporaneamente, recupero della prenotazione con tessera, date italiane, svelamento e dashboard.
- Se desideri garantire che prenoti davvero il possessore della tessera, aggiungere PIN o email; con la sola tessera questo non è possibile.
- Il calendario rimane nel ramo `feature/babbo-brunoday-calendar` finché i test non passano.
