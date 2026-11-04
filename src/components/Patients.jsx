import { useMemo, useState } from 'react'
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'

const validPhone = (value) => !value || /^\+?[0-9 ]+$/.test(value) && (value.match(/\d/g) || []).length >= 6 && (value.match(/\d/g) || []).length <= 15
const validEmail = (value) => !value || (value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))

const empty = { nome: '', cognome: '', dataNascita: '', telefono: '', email: '', note: '' }

export default function Patients({ patients, appointments }) {
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null) // null | {id?, ...campi}

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return patients
    return patients.filter((p) => `${p.nome} ${p.cognome} ${p.telefono} ${p.email}`.toLowerCase().includes(q))
  }, [patients, search])

  const nextAppt = (id) => {
    const d = new Date()
    const now = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    return appointments.find((a) => a.patientId === id && a.start >= now && a.stato !== 'Annullato')
  }

  function save(e) {
    e.preventDefault()
    if (!validPhone(editing.telefono.trim())) { alert('Inserisci un telefono valido (6-15 cifre, spazi e + opzionale).'); return }
    if (!validEmail(editing.email.trim())) { alert('Inserisci un indirizzo email valido (massimo 254 caratteri).'); return }
    const { id, ...data } = { ...editing, telefono: editing.telefono.trim(), email: editing.email.trim() }
    // Niente await: offline la scrittura resta in coda e si sincronizza dopo
    if (id) updateDoc(doc(db, 'patients', id), data).catch((err) => { console.error(err); alert('Modifica non accettata da Firestore: ' + err.message) })
    else addDoc(collection(db, 'patients'), { ...data, creatoIl: serverTimestamp() }).catch((err) => { console.error(err); alert('Modifica non accettata da Firestore: ' + err.message) })
    setEditing(null)
  }

  function remove() {
    const n = appointments.filter((a) => a.patientId === editing.id).length
    const msg = n
      ? `Eliminare ${editing.nome} ${editing.cognome}? Ha ${n} appuntamenti collegati, che resteranno in agenda.`
      : `Eliminare ${editing.nome} ${editing.cognome}?`
    if (!confirm(msg)) return
    deleteDoc(doc(db, 'patients', editing.id)).catch((err) => { console.error(err); alert('Modifica non accettata da Firestore: ' + err.message) })
    setEditing(null)
  }

  const set = (k) => (e) => setEditing({ ...editing, [k]: e.target.value })

  return (
    <section>
      <div className="section-head">
        <h2>Pazienti <span className="count">{patients.length}</span></h2>
        <div className="actions">
          <input type="search" placeholder="Cerca per nome, telefono, email" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="primary" onClick={() => setEditing({ ...empty })}>Nuovo paziente</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="empty">
          {patients.length === 0 ? 'Nessun paziente in archivio. Aggiungi il primo con “Nuovo paziente”.' : 'Nessun paziente corrisponde alla ricerca.'}
        </p>
      ) : (
        <ul className="rows">
          {filtered.map((p) => {
            const next = nextAppt(p.id)
            return (
              <li key={p.id}>
                <button className="row" onClick={() => setEditing(p)}>
                  <span className="name">{p.cognome} {p.nome}</span>
                  <span className="muted">{p.telefono || '—'}</span>
                  <span className="muted hide-sm">{p.email || '—'}</span>
                  <span className="muted">
                    {next ? `Prossimo: ${next.start.slice(8, 10)}/${next.start.slice(5, 7)} ${next.start.slice(11, 16)}` : 'Nessun appuntamento'}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {editing && (
        <div className="overlay" onClick={() => setEditing(null)}>
          <form className="dialog" onClick={(e) => e.stopPropagation()} onSubmit={save}>
            <h3>{editing.id ? 'Scheda paziente' : 'Nuovo paziente'}</h3>
            <div className="grid2">
              <label>Cognome<input required value={editing.cognome} onChange={set('cognome')} /></label>
              <label>Nome<input required value={editing.nome} onChange={set('nome')} /></label>
              <label>Data di nascita<input type="date" value={editing.dataNascita} onChange={set('dataNascita')} /></label>
              <label>Telefono<input type="tel" maxLength="24" title="Da 6 a 15 cifre; sono ammessi spazi e prefisso +" value={editing.telefono} onChange={set('telefono')} /></label>
            </div>
            <label>Email<input type="email" maxLength="254" value={editing.email} onChange={set('email')} /></label>
            <label>Note<textarea rows="3" value={editing.note} onChange={set('note')} /></label>
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
