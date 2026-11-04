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
import useNotifications from './useNotifications'
import NotificationControl from './components/NotificationControl'

export default function App() {
  const [user, setUser] = useState(undefined) // undefined = in caricamento
  const [tab, setTab] = useState('appointments')
  const [patients, setPatients] = useState([])
  const [appointments, setAppointments] = useState([])
  const [settings, setSettings] = useState(mergeSettings())
  const [role, setRole] = useState('staff')
  const [sync, setSync] = useState({ patients: null, appointments: null, settings: null })
  const [dataError, setDataError] = useState('')
  const online = useOnline()
  const notif = useNotifications(appointments, settings)

  useEffect(() => onAuthStateChanged(auth, setUser), [])

  useEffect(() => {
    if (!user) {
      setPatients([]); setAppointments([]); setSync({ patients: null, appointments: null, settings: null });
      setRole('staff'); setDataError('');
      return
    }
    const track = (name, snapshot) => setSync((prev) => ({ ...prev, [name]: {
      fromCache: snapshot.metadata.fromCache, pending: snapshot.metadata.hasPendingWrites
    } }))
    const fail = (label) => (err) => {
      console.error(label, err)
      setDataError(`Impossibile leggere ${label}: ${err.message}`)
    }
    const unsubP = onSnapshot(query(collection(db, 'patients'), orderBy('cognome')), { includeMetadataChanges: true },
      (s) => { setPatients(s.docs.map((d) => ({ id: d.id, ...d.data() }))); track('patients', s) }, fail('i pazienti'))
    const unsubA = onSnapshot(query(collection(db, 'appointments'), orderBy('start')), { includeMetadataChanges: true },
      (s) => { setAppointments(s.docs.map((d) => ({ id: d.id, ...d.data() }))); track('appointments', s) }, fail('gli appuntamenti'))
    // Impostazioni dello studio (colori, dottori)
    const unsubS = onSnapshot(doc(db, 'settings', 'studio'), { includeMetadataChanges: true },
      (s) => { setSettings(mergeSettings(s.data())); track('settings', s) }, fail('le impostazioni'))
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
  const pending = Object.values(sync).some((v) => v?.pending)
  const cached = Object.values(sync).some((v) => v?.fromCache)
  const noCachedData = !online && sync.patients === null && sync.appointments === null
  useEffect(() => {
    if (!isAdmin && tab === 'settings') setTab('appointments')
  }, [isAdmin, tab])

  if (user === undefined) return <p className="center-note">Caricamento…</p>
  if (!user) return <Login online={online} />

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <img
            src="/iconv2-192.png"
            alt="Logo Studio Dentistico"
            width="28" height="28"
            style={{ objectFit: 'contain', borderRadius: '6px' }}
          />
          <span>Studio Dentistico</span>
        </div>
        <nav aria-label="Sezioni">
          <button className={tab === 'appointments' ? 'on' : ''} onClick={() => setTab('appointments')}>
            Appuntamenti
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
          <NotificationControl n={notif} />
          <span className="email">{user.email}{isAdmin ? ' · admin' : ''}</span>
          <button className="ghost" onClick={() => signOut(auth)}>
            Esci
          </button>
        </div>
      </header>

      {(!online || cached || pending) && (
        <div className="offline-banner" role="status">
          {!online ? 'Connessione assente. ' : cached ? 'Dati dalla cache locale. ' : ''}
          {pending ? 'Ci sono modifiche locali in attesa di conferma dal server. ' : ''}
          {noCachedData ? 'Se è il primo accesso su questo dispositivo, i dati potrebbero non essere disponibili. ' : ''}
          {!pending && !online ? 'Le modifiche effettuate qui saranno sincronizzate quando Firestore tornerà raggiungibile.' : ''}
        </div>
      )}
      {dataError && <div className="data-error" role="alert">{dataError} <button onClick={() => setDataError('')}>Chiudi</button></div>}

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
