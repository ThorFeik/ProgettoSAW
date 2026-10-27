import { useMemo, useState } from 'react'
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { addDays, addMonths, minutesOf, startOfWeek, toDateKey } from '../dates'
import Calendar from './Calendar'
import { emailConfigured, sendEmailReminder, whatsappLink } from '../reminders'
import { STATI } from '../settings'

const TRATTAMENTI = ['Visita di controllo', 'Igiene dentale', 'Otturazione', 'Devitalizzazione', 'Estrazione', 'Sbiancamento', 'Altro']

export default function Appointments({ patients, appointments, settings, online }) {
  const [view, setView] = useState(() => (window.innerWidth < 700 ? 'day' : 'week'))
  const [date, setDate] = useState(() => new Date())
  const [editing, setEditing] = useState(null)
  const [feedback, setFeedback] = useState('')
  const [doctorFilter, setDoctorFilter] = useState('')
  const todayKey = toDateKey(new Date())
  const { doctors, statusColors } = settings

  const newAppt = (dateKey, ora = '09:00') => ({
    patientId: '',
    doctorId: doctors[0]?.id || '',
    data: dateKey,
    ora,
    durata: 30,
    trattamento: TRATTAMENTI[0],
    stato: 'Programmato',
    note: ''
  })

  // Tutti gli appuntamenti per giorno (per il controllo sovrapposizioni)
  const byDay = useMemo(() => {
    const map = {}
    for (const a of appointments) (map[a.start.slice(0, 10)] ||= []).push(a)
    return map
  }, [appointments])

  // Quelli mostrati nel calendario (filtro per dottore)
  const shownByDay = useMemo(() => {
    const map = {}
    for (const a of appointments) {
      if (doctorFilter && a.doctorId !== doctorFilter) continue
      ;(map[a.start.slice(0, 10)] ||= []).push(a)
    }
    return map
  }, [appointments, doctorFilter])

  const step = (n) => setDate(view === 'month' ? addMonths(date, n) : addDays(date, n * (view === 'week' ? 7 : 1)))
  const title =
    view === 'day'
      ? date.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      : view === 'month'
        ? date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
        : (() => {
            const a = startOfWeek(date)
            const b = addDays(a, 6)
            return `${a.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} – ${b.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}`
          })()
  const openNew = (dateKey, ora) => {
    if (patients.length === 0) return
    setFeedback('')
    setEditing(newAppt(dateKey, ora))
  }

  const patientOf = (id) => patients.find((p) => p.id === id)
  const doctorOf = (id) => doctors.find((d) => d.id === id)

  function open(a) {
    setFeedback('')
    setEditing({
      id: a.id, patientId: a.patientId, doctorId: a.doctorId || '', data: a.start.slice(0, 10), ora: a.start.slice(11, 16),
      durata: a.durata, trattamento: a.trattamento, stato: a.stato, note: a.note || ''
    })
  }

  // Controllo sovrapposizioni nello stesso giorno (stesso dottore, se indicato; esclusi gli annullati)
  function overlaps(f) {
    const start = minutesOf(`${f.data}T${f.ora}`)
    const end = start + Number(f.durata)
    return (byDay[f.data] || []).filter(
      (a) =>
        a.id !== f.id && a.stato !== 'Annullato' &&
        (!f.doctorId || !a.doctorId || a.doctorId === f.doctorId) &&
        minutesOf(a.start) < end && minutesOf(a.start) + a.durata > start
    )
  }

  function persist(form) {
    const p = patientOf(form.patientId)
    const clash = overlaps(form)
    if (clash.length && !confirm(`Questo orario si sovrappone a ${clash.length} appuntamento/i. Salvare comunque?`)) return
    const data = {
      patientId: form.patientId,
      patientName: p ? `${p.cognome} ${p.nome}` : '',
      doctorId: form.doctorId,
      start: `${form.data}T${form.ora}`,
      durata: Number(form.durata),
      trattamento: form.trattamento,
      stato: form.stato,
      note: form.note
    }
    if (form.id) updateDoc(doc(db, 'appointments', form.id), data).catch(console.error)
    else addDoc(collection(db, 'appointments'), { ...data, creatoIl: serverTimestamp() }).catch(console.error)
    setEditing(null)
  }

  const save = (e) => {
    e.preventDefault()
    persist(editing)
  }

  // Conferma l'appuntamento direttamente dalla scheda (salva anche le altre modifiche aperte)
  const confirmNow = () => persist({ ...editing, stato: 'Confermato' })

  function remove() {
    if (!confirm('Eliminare questo appuntamento?')) return
    deleteDoc(doc(db, 'appointments', editing.id)).catch(console.error)
    setEditing(null)
  }

  async function emailReminder() {
    setFeedback('Invio in corso…')
    try {
      await sendEmailReminder({ start: `${editing.data}T${editing.ora}`, trattamento: editing.trattamento }, patientOf(editing.patientId))
      setFeedback('Promemoria inviato per email.')
    } catch (err) {
      setFeedback(err.message)
    }
  }

  const set = (k) => (e) => setEditing({ ...editing, [k]: e.target.value })
  const patient = editing && patientOf(editing.patientId)
  const wa = editing && patient ? whatsappLink({ start: `${editing.data}T${editing.ora}`, trattamento: editing.trattamento }, patient) : null


  return (
    <section>
      <div className="cal-toolbar">
        <div className="actions">
          <button className="ghost" onClick={() => setDate(new Date())}>Oggi</button>
          <button className="ghost round" onClick={() => step(-1)} aria-label="Precedente">‹</button>
          <button className="ghost round" onClick={() => step(1)} aria-label="Successivo">›</button>
          <h2 className="cal-title">{title}</h2>
        </div>
        <div className="actions">
          {doctors.length > 0 && (
            <select aria-label="Filtra per dottore" value={doctorFilter} onChange={(e) => setDoctorFilter(e.target.value)} className="filter">
              <option value="">Tutti i dottori</option>
              {doctors.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
            </select>
          )}
          <div className="seg" role="group" aria-label="Vista">
            {[['day', 'Giorno'], ['week', 'Settimana'], ['month', 'Mese']].map(([v, l]) => (
              <button key={v} className={view === v ? 'on' : ''} onClick={() => setView(v)}>{l}</button>
            ))}
          </div>
          <button className="primary" disabled={patients.length === 0} title={patients.length === 0 ? 'Aggiungi prima un paziente' : ''} onClick={() => openNew(todayKey, '09:00')}>
            + Nuovo
          </button>
        </div>
      </div>

      <ul className="legend" aria-label="Legenda colori">
        {STATI.map((s) => <li key={s}><i style={{ background: statusColors[s] }} />{s}</li>)}
        {doctors.map((d) => <li key={d.id}><i className="bar" style={{ background: d.colore }} />{d.nome}</li>)}
      </ul>

      {patients.length === 0 && <p className="empty">Per fissare un appuntamento serve almeno un paziente: aggiungilo dalla sezione Pazienti.</p>}

      <Calendar
        view={view}
        date={date}
        byDay={shownByDay}
        settings={settings}
        onSlot={openNew}
        onOpen={open}
        onDay={(d) => { setDate(d); setView('day') }}
      />

      {editing && (
        <div className="overlay" onClick={() => setEditing(null)}>
          <form className="dialog" onClick={(e) => e.stopPropagation()} onSubmit={save}>
            <h3>{editing.id ? 'Modifica appuntamento' : 'Nuovo appuntamento'}</h3>
            <label>
              Paziente
              <select required value={editing.patientId} onChange={set('patientId')}>
                <option value="">Seleziona…</option>
                {patients.map((p) => <option key={p.id} value={p.id}>{p.cognome} {p.nome}</option>)}
              </select>
            </label>
            <label>
              Dottore
              <select value={editing.doctorId} onChange={set('doctorId')}>
                <option value="">{doctors.length ? 'Non assegnato' : 'Nessun dottore configurato'}</option>
                {doctors.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
                {editing.doctorId && !doctorOf(editing.doctorId) && <option value={editing.doctorId}>Dottore rimosso</option>}
              </select>
            </label>
            <div className="grid3">
              <label>Data<input type="date" required value={editing.data} onChange={set('data')} /></label>
              <label>Ora<input type="time" required step="900" value={editing.ora} onChange={set('ora')} /></label>
              <label>Durata (min)<input type="number" min="15" step="15" required value={editing.durata} onChange={set('durata')} /></label>
            </div>
            <div className="grid2">
              <label>Trattamento
                <select value={editing.trattamento} onChange={set('trattamento')}>
                  {TRATTAMENTI.map((t) => <option key={t}>{t}</option>)}
                </select>
              </label>
              <label>Stato
                <select value={editing.stato} onChange={set('stato')}>
                  {STATI.map((s) => <option key={s}>{s}</option>)}
                </select>
              </label>
            </div>
            <label>Note<textarea rows="2" value={editing.note} onChange={set('note')} /></label>

            {editing.id && editing.stato !== 'Confermato' && (
              <button type="button" className="confirm" onClick={confirmNow}>✓ Conferma appuntamento</button>
            )}

            {editing.id && (
              <div className="reminders">
                <span className="muted">Promemoria al paziente</span>
                <button type="button" className="ghost" onClick={emailReminder} disabled={!emailConfigured || !online || !patient?.email}
                  title={!emailConfigured ? 'Configura EmailJS nel file .env' : !patient?.email ? 'Il paziente non ha email' : ''}>
                  Invia email
                </button>
                {wa ? <a className="ghost btn" href={wa} target="_blank" rel="noreferrer">Apri WhatsApp</a> : <button type="button" className="ghost" disabled>WhatsApp</button>}
              </div>
            )}
            {feedback && <p className="muted" role="status">{feedback}</p>}

            <div className="dialog-actions">
              {editing.id && <button type="button" className="danger" onClick={remove}>Elimina</button>}
              <span className="spacer" />
              <button type="button" className="ghost" onClick={() => setEditing(null)}>Annulla</button>
              <button className="primary">Salva</button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}
