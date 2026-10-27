import { useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore'
import { auth, db } from './firebase'
import useOnline from './useOnline'
import { mergeSettings } from './settings'
import Login from './components/Login'
import Patients from './components/Patients'
import Appointments from './components/Appointments'
import Settings from './components/Settings'

export default function App() {
  const [user, setUser] = useState(undefined) // undefined = in caricamento
  const [tab, setTab] = useState('appointments')
  const [patients, setPatients] = useState([])
  const [appointments, setAppointments] = useState([])
  const [settings, setSettings] = useState(mergeSettings())
  const [role, setRole] = useState('staff')
  const online = useOnline()

  useEffect(() => onAuthStateChanged(auth, setUser), [])

  useEffect(() => {
    if (!user) return
    const unsubP = onSnapshot(query(collection(db, 'patients'), orderBy('cognome')), (s) =>
      setPatients(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    )
    const unsubA = onSnapshot(query(collection(db, 'appointments'), orderBy('start')), (s) =>
      setAppointments(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    )
    // Impostazioni dello studio (colori, dottori)
    const unsubS = onSnapshot(doc(db, 'settings', 'studio'), (s) => setSettings(mergeSettings(s.data())))
    // Ruolo dell'utente: documento users/{uid} con campo "ruolo" ('admin' | 'staff')
    const unsubR = onSnapshot(
      doc(db, 'users', user.uid),
      (s) => setRole(s.data()?.ruolo || 'staff'),
      () => setRole('staff')
    )
    return () => {
      unsubP()
      unsubA()
      unsubS()
      unsubR()
    }
  }, [user])

  const isAdmin = role === 'admin'
  useEffect(() => {
    if (!isAdmin && tab === 'settings') setTab('appointments')
  }, [isAdmin, tab])

  if (user === undefined) return <p className="center-note">Caricamento…</p>
  if (!user) return <Login online={online} />

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <svg viewBox="0 0 512 512" width="28" height="28" aria-hidden="true">
            <rect width="512" height="512" rx="110" fill="#f4f8f8" />
            <path d="M256 120c-34-28-96-22-118 22-18 36-4 80 10 122 12 36 14 98 40 98 22 0 20-60 34-82 8-12 22-12 34-12s26 0 34 12c14 22 12 82 34 82 26 0 28-62 40-98 14-42 28-86 10-122-22-44-84-50-118-22z" fill="#14505c" />
          </svg>
          <span>Studio Dentistico</span>
        </div>
        <nav aria-label="Sezioni">
          <button className={tab === 'appointments' ? 'on' : ''} onClick={() => setTab('appointments')}>
            Agenda
          </button>
          <button className={tab === 'patients' ? 'on' : ''} onClick={() => setTab('patients')}>
            Pazienti
          </button>
          {isAdmin && (
            <button className={tab === 'settings' ? 'on' : ''} onClick={() => setTab('settings')}>
              Impostazioni
            </button>
          )}
        </nav>
        <div className="who">
          <span className="email">{user.email}{isAdmin ? ' · admin' : ''}</span>
          <button className="ghost" onClick={() => signOut(auth)}>
            Esci
          </button>
        </div>
      </header>

      {!online && (
        <div className="offline-banner" role="status">
          Sei offline: stai vedendo i dati salvati sul dispositivo. Le modifiche si sincronizzeranno al ritorno della connessione.
        </div>
      )}

      <main>
        {tab === 'appointments' && (
          <Appointments patients={patients} appointments={appointments} settings={settings} online={online} />
        )}
        {tab === 'patients' && <Patients patients={patients} appointments={appointments} />}
        {tab === 'settings' && isAdmin && <Settings settings={settings} />}
      </main>
    </div>
  )
}
