import { formatLong } from './dates'

const studio = import.meta.env.VITE_STUDIO_NAME || 'Studio Dentistico'

const cfg = {
  service: import.meta.env.VITE_EMAILJS_SERVICE_ID,
  template: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
  key: import.meta.env.VITE_EMAILJS_PUBLIC_KEY
}

export const emailConfigured = Boolean(cfg.service && cfg.template && cfg.key)

const when = (appt) => ({ date: formatLong(appt.start.slice(0, 10)), time: appt.start.slice(11, 16) })

// API esterna 1: EmailJS (REST) – invia un'email di promemoria al paziente
export async function sendEmailReminder(appt, patient) {
  if (!emailConfigured) throw new Error('EmailJS non configurato (vedi .env)')
  if (!patient?.email) throw new Error('Il paziente non ha un indirizzo email')
  const { date, time } = when(appt)
  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: cfg.service,
      template_id: cfg.template,
      user_id: cfg.key,
      template_params: {
        to_email: patient.email,
        to_name: `${patient.nome} ${patient.cognome}`,
        studio_name: studio,
        date,
        time,
        treatment: appt.trattamento
      }
    })
  })
  if (!res.ok) throw new Error(`Invio non riuscito (${res.status})`)
}

// API esterna 2: link WhatsApp (wa.me) con messaggio precompilato
export function whatsappLink(appt, patient) {
  if (!patient?.telefono) return null
  const { date, time } = when(appt)
  const phone = patient.telefono.replace(/[^\d]/g, '').replace(/^00/, '')
  const full = phone.length <= 10 ? '39' + phone : phone // default Italia
  const text = `Buongiorno ${patient.nome}, le ricordiamo l'appuntamento presso ${studio}: ${date} alle ${time} (${appt.trattamento}). Per modifiche ci contatti pure. Grazie!`
  return `https://wa.me/${full}?text=${encodeURIComponent(text)}`
}
