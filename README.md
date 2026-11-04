# Studio Dentistico – Gestionale 

Web app per la gestione di pazienti e appuntamenti di uno studio dentistico.

# Funzionalità
- Login riservato tramite account creati in precedenza
- Elecon Pazienti con ricerca, creazione, modifica, eliminazione
- Agenda settimanale: inserimento, modifica, cancellazione, stati degli appuntamenti (programmato/confermato/completato/annullato)
- Dottori: ogni appuntamento può essere assegnato a un dottore
- Stati con colore personalizzabile: Programmato, Confermato, Rimandato, Completato, Annullato
- Impostazioni (solo account admin): colori degli stati, elenco e colori dei dottori
- Promemoria all'appuntamento: email (EmailJS) o WhatsApp (per ora apre web con messaggio prefissato, non è automatico)
- Offline: dati già caricati consultabili e modificabili; le modifiche si sincronizzano al ritorno della rete



# Credenziali di test
Ruolo Admin: utente: Admin@admin.com psw: admin1234
Ruolo User: utente: dottore@dottore.com psw: dottore1234

Il ruolo admin può vedere la scheda impostazioni per modificare qualche opzione, l'user semplice no
