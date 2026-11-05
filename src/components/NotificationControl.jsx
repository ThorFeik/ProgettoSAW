// Pulsanti per attivare e provare le notifiche
export default function NotificationControl({ n }) {
  if (!n.supported) return null

  if (n.permission === 'denied') {
    return (
      <span className="notif-note" title="Hai bloccato le notifiche: riattivale dalle impostazioni del sito nel browser">
        Notifiche bloccate
      </span>
    )
  }

  if (!n.enabled) {
    return (
      <button className="ghost" onClick={n.enable}>
        Attiva notifiche
      </button>
    )
  }

  return (
    <span className="notif">
      <select aria-label="Preavviso delle notifiche" value={n.lead} onChange={(e) => n.setLead(Number(e.target.value))}>
        {[5, 10, 15, 30, 60].map((m) => (
          <option key={m} value={m}>
            {m} min prima
          </option>
        ))}
      </select>
      <button className="ghost" onClick={n.test}>
        Prova
      </button>
      <button className="ghost" onClick={n.disable}>
        Disattiva
      </button>
    </span>
  )
}
