const pad = (n) => String(n).padStart(2, '0')

export const toDateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export function startOfWeek(date) {
  const d = new Date(date)
  const day = (d.getDay() + 6) % 7 // lunedì = 0
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

export function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export const formatDay = (d) =>
  d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })

export const formatLong = (key) =>
  new Date(key + 'T00:00:00').toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

// "start" è salvato come stringa locale "YYYY-MM-DDTHH:mm"
export const minutesOf = (start) => {
  const [h, m] = start.slice(11, 16).split(':').map(Number)
  return h * 60 + m
}

export const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1)
export const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1)
export const hhmm = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`
