# Gestionale Studio Dentistico

Web app per la gestione di pazienti e appuntamenti di uno studio dentistico.

# Funzionalità
- Login riservato tramite account creati in precedenza
- Elenco Pazienti con ricerca, creazione, modifica, eliminazione
- Agenda settimanale: inserimento, modifica, cancellazione, stati degli appuntamenti (programmato/confermato/completato/annullato) ((per poter creare un appuntamento bisogna prima creare un paziente))
- Dottori: ogni appuntamento può essere assegnato a un dottore, i dottori vengono creati dalla scheda impostazioni accessibile solo agli admin
- Stati con colore personalizzabile: Programmato, Confermato, Rimandato, Completato, Annullato
- Impostazioni (solo account admin): colori degli stati, elenco e colori dei dottori
- Promemoria all'appuntamento: email (EmailJS) o WhatsApp (apre whatsapp web con messaggio precompilato, non è automatico)
- Offline: dati già caricati consultabili e modificabili; le modifiche si sincronizzano al ritorno della rete



# Credenziali di test
Ruolo Admin:
```bash
utente: Admin@admin.com 
psw: admin1234
```
Ruolo User:

```bash
utente: dottore@dottore.com 
psw: dottore1234
```

Il ruolo admin può vedere la scheda impostazioni per modificare qualche opzione, l'user semplice no

# Installazione e avvio

Per installare le dipendenza

```bash
npm install
```
Inserire nella cartella principale del progetto il file .env

Per avviare il progetto:

```bash
npm run dev
```
Aprire nel browser l'indirizzo locale indicato dal terminale.

Versione online

L'applicazione è disponibile anche tramite Firebase Hosting.

Link: https://sawprogetto-8cc83.web.app
