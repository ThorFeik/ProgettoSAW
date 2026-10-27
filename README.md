# Studio Dentistico – Gestionale (progetto didattico)

Web app per la gestione di pazienti e appuntamenti di uno studio dentistico.
**Usare solo dati di prova, mai dati reali di pazienti.**

## Stack
- **Front-end:** React 18 + Vite
- **Autenticazione:** Firebase Authentication (email/password, solo utenti creati dall'amministratore)
- **Database:** Cloud Firestore (collezioni `patients` e `appointments`) con cache locale persistente
- **API esterne:** EmailJS (promemoria via email) e link WhatsApp (`wa.me`) con messaggio precompilato
- **PWA:** `vite-plugin-pwa` (manifest, service worker, installabile, uso offline)

## Funzionalità
- Login riservato; nessuna registrazione pubblica
- Pazienti: elenco, ricerca, creazione, modifica, eliminazione
- Agenda settimanale: inserimento, modifica, cancellazione, stati (programmato/confermato/completato/annullato), avviso di sovrapposizione orari
- Dottori: ogni appuntamento può essere assegnato a un dottore (colore dedicato, filtro in agenda)
- Stati con colore personalizzabile: Programmato, Confermato, Rimandato, Completato, Annullato
- Pulsante "Conferma appuntamento" direttamente nella scheda
- Impostazioni (solo account admin): colori degli stati, elenco e colori dei dottori
- Promemoria all'appuntamento: email (EmailJS) o WhatsApp
- Offline: dati già caricati consultabili e modificabili; le modifiche si sincronizzano al ritorno della rete

## Avvio
1. `npm install`
2. Crea un progetto su https://console.firebase.google.com
   - Authentication → abilita **Email/password** e crea gli utenti dello studio (Utenti → Aggiungi utente)
   - Firestore Database → crea il database, poi in "Regole" incolla il contenuto di `firestore.rules`
   - Impostazioni progetto → Le tue app → Web: copia la configurazione
   - **Account admin:** per abilitare le Impostazioni a un utente, in Firestore crea la collezione `users`
     e un documento il cui ID è l'**UID** dell'utente (Authentication → Utenti → colonna "UID utente")
     con il campo `ruolo` (stringa) = `admin`. Chi non ha il documento è un utente normale (`staff`).
     La modifica delle impostazioni è bloccata anche lato database da `firestore.rules`.
3. Copia `.env.example` in `.env` e compila i valori
   - Per la consegna crea anche un utente di test **non admin** e un utente admin, e scrivi le credenziali qui sotto.
4. (Facoltativo) EmailJS: crea account, servizio email e template con i parametri
   `to_email`, `to_name`, `studio_name`, `date`, `time`, `treatment`; inserisci gli ID nel `.env`
5. `npm run dev` per sviluppo, oppure `npm run build && npm run preview` per provare la PWA
   (il service worker e l'installazione funzionano sulla build, non in `dev`)

## Pubblicazione su GitHub
```
git init
git add .
git commit -m "Prima versione"
git branch -M main
git remote add origin https://github.com/<utente>/studio-dentistico.git
git push -u origin main
```
Il file `.env` è escluso da `.gitignore`: non pubblicare mai le tue chiavi.

## Credenziali di test
| Ruolo | Email | Password |
|-------|-------|----------|
| Admin | _da compilare_ | _da compilare_ |
| Staff | _da compilare_ | _da compilare_ |
