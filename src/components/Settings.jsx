import { useState } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { COLOR_PALETTE, DEFAULT_STATUS_COLORS, DOCTOR_PALETTE, STATI } from '../settings'

// Selettore a colori campione (cerchi cliccabili)
function Swatches({ value, onChange, label }) {
  // Se il colore salvato non è nella tavolozza (es. impostato in passato) lo mostra come "Personalizzato"
  const options = COLOR_PALETTE.some((c) => c.hex === value) ? COLOR_PALETTE : [...COLOR_PALETTE, { hex: value, nome: 'Personalizzato' }]
  return (
    <div className="swatches" role="radiogroup" aria-label={label}>
      {options.map((c) => (
        <button
          type="button"
          key={c.hex}
          role="radio"
          aria-checked={c.hex === value}
          aria-label={c.nome}
          title={c.nome}
          className={`swatch ${c.hex === value ? 'on' : ''}`}
          style={{ background: c.hex }}
          onClick={() => onChange(c.hex)}
        />
      ))}
    </div>
  )
}

// Visibile solo agli account admin (e scrivibile solo da loro: vedi firestore.rules)
export default function Settings({ settings }) {
  const [colors, setColors] = useState(settings.statusColors)
  const [doctors, setDoctors] = useState(settings.doctors)
  const [saved, setSaved] = useState(false)

  const touch = (fn) => (...a) => {
    setSaved(false)
    fn(...a)
  }

  const addDoctor = touch(() =>
    setDoctors([...doctors, { id: crypto.randomUUID(), nome: '', colore: DOCTOR_PALETTE[doctors.length % DOCTOR_PALETTE.length] }])
  )
  const updateDoctor = touch((id, patch) => setDoctors(doctors.map((d) => (d.id === id ? { ...d, ...patch } : d))))
  const removeDoctor = touch((id) => {
    if (confirm('Rimuovere questo dottore? Gli appuntamenti già assegnati resteranno in agenda.')) setDoctors(doctors.filter((d) => d.id !== id))
  })

  function save(e) {
    e.preventDefault()
    const clean = doctors.filter((d) => d.nome.trim()).map((d) => ({ ...d, nome: d.nome.trim() }))
    setDoc(doc(db, 'settings', 'studio'), { statusColors: colors, doctors: clean }, { merge: true })
      .then(() => setSaved(true))
      .catch((err) => alert('Salvataggio non riuscito: ' + err.message))
    setDoctors(clean)
  }

  return (
    <section>
      <div className="section-head">
        <h2>Impostazioni</h2>
      </div>
      <form className="settings" onSubmit={save}>
        <div className="card">
          <h3>Colori degli stati</h3>
          <p className="muted">Il colore dello stato tinge la scheda dell’appuntamento in agenda.</p>
          <ul className="color-list">
            {STATI.map((s) => (
              <li key={s}>
                <span className="label">{s}</span>
                <Swatches label={`Colore ${s}`} value={colors[s]} onChange={touch((hex) => setColors({ ...colors, [s]: hex }))} />
              </li>
            ))}
          </ul>
          <button type="button" className="ghost" onClick={touch(() => setColors(DEFAULT_STATUS_COLORS))}>
            Ripristina colori predefiniti
          </button>
        </div>

        <div className="card">
          <h3>Dottori</h3>
          <p className="muted">Il colore del dottore compare come barra a sinistra della scheda appuntamento.</p>
          {doctors.length === 0 && <p className="empty">Nessun dottore configurato.</p>}
          <ul className="color-list">
            {doctors.map((d) => (
              <li key={d.id}>
                <input className="grow" placeholder="Nome del dottore (es. Dott.ssa Rossi)" value={d.nome} onChange={(e) => updateDoctor(d.id, { nome: e.target.value })} />
                <button type="button" className="danger" onClick={() => removeDoctor(d.id)}>
                  Rimuovi
                </button>
                <div className="full">
                  <Swatches label={`Colore ${d.nome || 'dottore'}`} value={d.colore} onChange={(hex) => updateDoctor(d.id, { colore: hex })} />
                </div>
              </li>
            ))}
          </ul>
          <button type="button" className="ghost" onClick={addDoctor}>
            Aggiungi dottore
          </button>
        </div>

        <div className="dialog-actions">
          <button className="primary">Salva impostazioni</button>
          {saved && <span className="muted" role="status">Impostazioni salvate.</span>}
        </div>
      </form>
    </section>
  )
}
