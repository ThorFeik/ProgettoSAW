import { useCallback, useEffect, useState } from 'react'
import { dueReminders, notificationsSupported, showNotification } from './notifications'

const KEY_ON = 'sd-notif-on'
const KEY_LEAD = 'sd-notif-lead'
const KEY_SENT = 'sd-notif-sent'

const read = (key, fallback) => {
  try {
    return localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}
const write = (key, value) => {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* localStorage non disponibile */
  }
}

// Custom hook: permesso, preferenze e promemoria degli appuntamenti.
// I promemoria partono finché l'app (o il browser) è in esecuzione.
export default function useNotifications(appointments, settings) {
  const supported = notificationsSupported()
  const [permission, setPermission] = useState(() => (supported ? Notification.permission : 'unsupported'))
  const [on, setOn] = useState(() => read(KEY_ON, '1') === '1')
  const [lead, setLeadState] = useState(() => Number(read(KEY_LEAD, '15')))
  const enabled = supported && permission === 'granted' && on

  // Il permesso si chiede solo quando l'utente preme il pulsante
  const enable = useCallback(async () => {
    if (!supported) return
    const result = await Notification.requestPermission()
    setPermission(result)
    if (result === 'granted') {
      write(KEY_ON, '1')
      setOn(true)
      await showNotification('Notifiche attivate', {
        body: 'Riceverai un avviso prima di ogni appuntamento.',
        tag: 'sd-welcome'
      })
    }
  }, [supported])

  const disable = useCallback(() => {
    write(KEY_ON, '0')
    setOn(false)
  }, [])

  const setLead = useCallback((minutes) => {
    write(KEY_LEAD, String(minutes))
    setLeadState(minutes)
  }, [])

  const test = useCallback(
    () =>
      showNotification('Notifica di prova', {
        body: 'Le notifiche funzionano: qui vedrai i promemoria degli appuntamenti.',
        tag: 'sd-test'
      }),
    []
  )

  // Ogni 30 secondi controlla se un appuntamento sta per iniziare
  useEffect(() => {
    if (!enabled) return
    const check = () => {
      const now = new Date()
      let sent = {}
      try {
        sent = JSON.parse(read(KEY_SENT, '{}'))
      } catch {
        sent = {}
      }
      for (const { a, minutes } of dueReminders(appointments, now, lead, sent)) {
        sent[`${a.id}@${a.start}`] = now.getTime()
        const doctor = settings.doctors.find((d) => d.id === a.doctorId)
        showNotification(`Appuntamento tra ${minutes} min`, {
          body: [a.start.slice(11, 16), a.patientName || 'Paziente', a.trattamento, doctor?.nome].filter(Boolean).join(' · '),
          tag: `appt-${a.id}`
        })
      }
      // ripulisce gli avvisi più vecchi di un giorno
      for (const k of Object.keys(sent)) if (now.getTime() - sent[k] > 86400000) delete sent[k]
      write(KEY_SENT, JSON.stringify(sent))
    }
    check()
    const timer = setInterval(check, 30000)
    return () => clearInterval(timer)
  }, [enabled, appointments, lead, settings])

  return { supported, permission, enabled, lead, enable, disable, setLead, test }
}
