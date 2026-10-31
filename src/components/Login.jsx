import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'

const messages = {
  'auth/invalid-credential': 'Email o password non corrette.',
  'auth/invalid-email': 'Controlla l\'indirizzo email.',
  'auth/too-many-requests': 'Troppi tentativi. Riprova tra qualche minuto.',
  'auth/network-request-failed': 'Nessuna connessione: controlla la connesione internet.'
}

export default function Login({ online }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
    } catch (err) {
      setError(messages[err.code] || 'Accesso non riuscito. Riprova.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login">
      <div className="login-panel">
        <h1>Studio Dentistico</h1>
        <p className="muted">Accesso riservato al personale dello studio.</p>
        <form onSubmit={submit}>
          <label>
            Email
            <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            Password
            <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {error && <p className="error" role="alert">{error}</p>}
          {!online && <p className="error">Sei offline: per accedere serve la connessione a internet.</p>}
          <button className="primary" disabled={busy}>{busy ? 'Accesso in corso…' : 'Accedi'}</button>
        </form>
      </div>
    </div>
  )
}
