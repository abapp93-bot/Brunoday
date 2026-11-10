# Babbo BrunoDay — Setup 100% Spark / senza carta di credito

Il progetto Firebase già registrato è `babbo-brunoday-2026`. L'app web usa `avvento/firebase-config.js`, che contiene solo la **configurazione pubblica**.

## Importante prima di attivare le prenotazioni
Questa PR è ancora **DRAFT**: codice non distribuito e non testato contro il progetto Firebase effettivo. Non unire finché l'inizializzazione delle tessere, la pubblicazione delle rules e i test reali non sono completati.

## 1. Nessun costo
- Restare sul piano Firebase **Spark**.
- Firestore database Standard `(default)` + Authentication Anonymous (già abilitato dall'organizzatore).
- Nessuna Cloud Function, nessun servizio a pagamento.
- I limiti di Spark possono interrompere il servizio se esauriti, ma non generare addebiti senza l'upgrade.

## 2. Pubblicare le Security Rules
Nella Firebase Console → Build → Firestore Database → Rules, copia il contenuto del file `firestore.rules` dalla PR e premi **Publish**.
**Non** pubblicare rules permissive `allow read, write: if true`.

## 3. Preparare i dati privati delle 22 tessere
- Conserva un file `private-participants.json` **fuori dal repository** con 22 oggetti `{"card":"BD-001","name":"..." }` etc.
- Sul computer usa Node.js 20+, `cd setup && npm install`.
- Con una credenziale Firebase Admin locale (`GOOGLE_APPLICATION_CREDENTIALS`) e variabile `GOOGLE_CLOUD_PROJECT=babbo-brunoday-2026`, esegui `npm run seed -- /percorso/privato/private-participants.json`.
- Lo script crea `advent_cards_2026/{card}` con solo `day:null`, e `advent_names_2026/{card}` con solo `name`. Verifica che nessuno dei tre insiemi di dati sia già popolato.
- Non includere regali nel database; rimangono fuori dal sito e privati presso l'organizzatore.

## 4. Accesso amministratore
- Abilita il provider **Google** in Firebase Authentication, solo per la pagina organizzatore.
- Fai accedere l'organizzatore su `/admin/` con Google e trova il suo UID in Authentication → Users.
- Usa lo script locale `npm run admin -- UID` (stesse credenziali Admin SDK) per assegnare il custom claim `admin:true`.
- Il destinatario admin deve disconnettersi e rientrare per ricevere il nuovo token.
- La dashboard usa solo letture Firestore autorizzate dalle Rules.

## 5. Test obbligatori
- Prima del 15 novembre, verifica che `reserveDay` via browser non sia utilizzabile: il browser esegue ora transazioni Firestore direttamente, non Cloud Functions.
- Verifica una sola prenotazione per tessera e una per casella con due browser indipendenti.
- Verifica che `advent_names_2026/{card}` **non** sia leggibile prima della data di sblocco.
- Verifica dashboard dopo assegnazione claim, accesso negato ai non admin.
- Dopo i test, collegare la homepage a `/avvento/` e unire PR solo su approvazione.

## Limitazione accettata dal committente
La tessera da sola **non è autenticazione forte**: tutte le 22 tessere sono prevedibili. Chi conosce un numero altrui può fingersi quella persona e consultare/prenotare per conto suo. Le regole riducono le doppie prenotazioni, ma **non** possono impedire la sostituzione d'identità, né garantire la segretezza completa delle assegnazioni se i numeri sono pubblicamente riconducibili ai nomi. Per privacy robusta servirà un PIN, un login esterno, o un'altra prova di possesso.

## Architettura
- `avvento/index.html`: calendario e transazioni Firestore client-side.
- `avvento/firebase-config.js`: config web pubblica (non è una chiave segreta).
- `firestore.rules`: impone finestra temporale e scritture atomiche, protegge i nomi fino alla data e i dati admin.
- `admin/index.html`: dashboard autenticata con claim admin.
- `setup/`: script locali per import iniziale e claim admin; nessuna funzione distribuita.
