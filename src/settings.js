export const STATI = ['Programmato', 'Confermato', 'Rimandato', 'Completato', 'Annullato']

export const DEFAULT_STATUS_COLORS = {
  Programmato: '#5b8c9a',
  Confermato: '#2e9e5b',
  Rimandato: '#e3b023',
  Completato: '#8a9a9d',
  Annullato: '#d0453b'
}

export const DOCTOR_PALETTE = ['#1f7886', '#7c5cbf', '#d9730d', '#c2417a', '#3f6fd1', '#5a8f29']

// Unisce le impostazioni salvate con i valori predefiniti
export const mergeSettings = (s) => ({
  statusColors: { ...DEFAULT_STATUS_COLORS, ...(s?.statusColors || {}) },
  doctors: s?.doctors || []
})
