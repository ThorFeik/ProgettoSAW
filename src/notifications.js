// Notifiche locali (slide "Notifiche"): permesso, invio e calcolo dei promemoria

export const notificationsSupported = () =>
  typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator

// Mostra una notifica. Sul telefono serve passare dal service worker (showNotification);
// se il service worker non c'è (es. in sviluppo) si ripiega su new Notification().
export async function showNotification(title, options = {}) {
  const opts = { icon: '/icon-192.png', badge: '/icon-192.png', lang: 'it', vibrate: [200, 100, 200], ...options }
  try {
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, reject) => setTimeout(() => reject(new Error('nessun service worker')), 1500))
    ])
    await registration.showNotification(title, opts)
  } catch {
    try {
      new Notification(title, opts)
    } catch {
      /* nessun modo di mostrare la notifica su questo dispositivo */
    }
  }
}

// Appuntamenti che iniziano entro "lead" minuti e per cui non è già partito l'avviso.
// "sent" è un oggetto { "<id>@<inizio>": timestamp } degli avvisi già mostrati.
export function dueReminders(appointments, now, lead, sent) {
  return appointments
    .filter((a) => a.stato !== 'Annullato' && a.stato !== 'Completato')
    .map((a) => ({ a, minutes: (new Date(a.start) - now) / 60000 }))
    .filter(({ a, minutes }) => minutes > 0 && minutes <= lead && !sent[`${a.id}@${a.start}`])
    .map(({ a, minutes }) => ({ a, minutes: Math.max(1, Math.round(minutes)) }))
}
