# Collaudo offline della PWA

## Prima di iniziare
1. Configurare `.env` localmente (non pubblicarlo) e le regole Firestore.
2. `npm ci`, `npm run build`, `npm run preview`. Usare `localhost` o HTTPS.
3. Accedere **online** con un utente di prova, aprire Pazienti e Appuntamenti, e attendere il caricamento.
4. Verificare in DevTools > Application che il service worker sia attivo e che IndexedDB contenga i dati Firestore.

## Test 1: consultazione offline
1. DevTools > Network > Offline (oppure disabilitare la rete).
2. Ricaricare la PWA: la shell deve caricarsi dalla precache.
3. Verificare che i dati precedentemente letti siano visibili.
4. Verificare l'avviso offline/cache. Se i dati non erano mai stati letti, potrebbero non essere disponibili.

## Test 2: modifiche offline
1. Con l'utente già autenticato, creare un paziente o modificare un appuntamento.
2. Verificare la modifica nell'interfaccia e l'avviso di scritture in sospeso.
3. Tornare online, attendere la sincronizzazione e verificare che l'avviso scompaia.
4. Ricaricare da un altro browser online per verificare il dato remoto.

## Test 3: accesso e limiti
1. Uscire dall'app e tentare un nuovo login offline: Firebase Authentication richiede la rete per verificare nuove credenziali.
2. Rientrare online, autenticarsi, chiudere e riaprire offline: la sessione già persistita può essere recuperata.
3. Verificare che invio email e altre API remote non siano utilizzabili offline.

## Limiti e sicurezza
- `navigator.onLine` non prova la raggiungibilità di Firestore. L'indicatore `fromCache` segnala quando una query sta mostrando dati locali.
- Le modifiche offline possono essere rifiutate al ritorno della connessione per regole o conflitti; non sono confermate finché `hasPendingWrites` non è falso.
- Non salvare dati sanitari reali su dispositivi condivisi: la cache Firestore persiste localmente e non è automaticamente cancellata al logout. Usare solo dati fittizi per l'esame.
- Le notifiche locali con timer React non funzionano in modo affidabile ad app chiusa: per quello servono push remoti.
- Eseguire i test sulla build di produzione, non soltanto sul server di sviluppo Vite.
