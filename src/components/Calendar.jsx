import { useEffect, useRef, useState } from 'react'
import { addDays, hhmm, minutesOf, startOfMonth, startOfWeek, toDateKey } from '../dates'

// Griglia oraria: modifica questi valori per cambiare l'orario visibile e l'altezza delle ore
const START = 7
const END = 21
const HOUR_PX = 56
const PPM = HOUR_PX / 60
const hours = Array.from({ length: END - START }, (_, i) => START + i)

const evStyle = (a, settings) => ({
  '--st': settings.statusColors[a.stato] || '#8a9a9d',
  '--dr': settings.doctors.find((d) => d.id === a.doctorId)?.colore || 'var(--line)'
})

// Dispone fianco a fianco gli appuntamenti che si sovrappongono (come Google Calendar)
function layoutDay(list) {
  const evs = list
    .map((a) => ({ a, s: minutesOf(a.start), e: minutesOf(a.start) + a.durata }))
    .sort((x, y) => x.s - y.s || y.e - x.e)
  const out = []
  let cluster = []
  let clusterEnd = 0
  const flush = () => {
    const cols = []
    for (const ev of cluster) {
      let c = cols.findIndex((end) => end <= ev.s)
      if (c === -1) { c = cols.length; cols.push(ev.e) } else cols[c] = ev.e
      ev.col = c
    }
    cluster.forEach((ev) => { ev.cols = cols.length; out.push(ev) })
    cluster = []
  }
  for (const ev of evs) {
    if (cluster.length && ev.s >= clusterEnd) { flush(); clusterEnd = 0 }
    cluster.push(ev)
    clusterEnd = Math.max(clusterEnd, ev.e)
  }
  if (cluster.length) flush()
  return out
}

export default function Calendar({ view, date, byDay, settings, onSlot, onOpen, onDay }) {
  return view === 'month'
    ? <MonthView date={date} byDay={byDay} settings={settings} onSlot={onSlot} onOpen={onOpen} onDay={onDay} />
    : <TimeGrid view={view} date={date} byDay={byDay} settings={settings} onSlot={onSlot} onOpen={onOpen} onDay={onDay} />
}

function TimeGrid({ view, date, byDay, settings, onSlot, onOpen, onDay }) {
  const days = view === 'day' ? [date] : Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(date), i))
  const [now, setNow] = useState(new Date())
  const scroller = useRef(null)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  // All'apertura scorre verso l'ora corrente (o le 8:00)
  useEffect(() => {
    const m = Math.min(Math.max(now.getHours() * 60 + now.getMinutes(), 8 * 60), END * 60)
    scroller.current.scrollTop = Math.max(0, (m - START * 60 - 60) * PPM)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view])

  const todayKey = toDateKey(now)
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const cols = { gridTemplateColumns: `56px repeat(${days.length}, minmax(0, 1fr))` }

  function slotClick(e, key) {
    const y = e.clientY - e.currentTarget.getBoundingClientRect().top
    const min = Math.min(START * 60 + Math.floor(y / PPM / 15) * 15, END * 60 - 15)
    onSlot(key, hhmm(min))
  }

  return (
    <div className="cal-scroll" ref={scroller}>
      <div className={`cal-inner ${view}`}>
        <div className="cal-head" style={cols}>
          <div className="gutter" />
          {days.map((d) => {
            const k = toDateKey(d)
            return (
              <button key={k} className={`dh ${k === todayKey ? 'today' : ''}`} onClick={() => onDay(d)} title="Apri il giorno">
                <span className="dow">{d.toLocaleDateString('it-IT', { weekday: 'short' })}</span>
                <span className="dnum">{d.getDate()}</span>
              </button>
            )
          })}
        </div>

        <div className="cal-body" style={{ ...cols, height: (END - START) * HOUR_PX }}>
          <div className="gutter">
            {hours.map((h, i) => (
              <span key={h} style={{ top: i * HOUR_PX }}>{i === 0 ? '' : `${h}:00`}</span>
            ))}
          </div>
          {days.map((d) => {
            const k = toDateKey(d)
            return (
              <div key={k} className={`col ${k === todayKey ? 'today' : ''}`} onClick={(e) => slotClick(e, k)}>
                {layoutDay(byDay[k] || []).map(({ a, s, e, col, cols: n }) => {
                  const top = Math.max(0, s - START * 60) * PPM
                  const h = Math.max(22, (Math.min(e, END * 60) - Math.max(s, START * 60)) * PPM - 2)
                  return (
                    <button
                      key={a.id}
                      className="ev"
                      data-stato={a.stato}
                      style={{ ...evStyle(a, settings), top, height: h, left: `calc(${(col / n) * 100}% + 2px)`, width: `calc(${100 / n}% - 4px)` }}
                      onClick={(ev) => { ev.stopPropagation(); onOpen(a) }}
                    >
                      <span className="ev-title"><b>{a.start.slice(11, 16)}</b> {a.patientName || 'Paziente eliminato'}</span>
                      {h >= 44 && <span className="ev-sub">{a.trattamento}{a.stato !== 'Programmato' ? ` · ${a.stato}` : ''}</span>}
                      {h >= 66 && settings.doctors.find((d) => d.id === a.doctorId) && (
                        <span className="ev-sub">{settings.doctors.find((d) => d.id === a.doctorId).nome}</span>
                      )}
                    </button>
                  )
                })}
                {k === todayKey && nowMin >= START * 60 && nowMin <= END * 60 && (
                  <div className="now" style={{ top: (nowMin - START * 60) * PPM }} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function MonthView({ date, byDay, settings, onSlot, onOpen, onDay }) {
  const start = startOfWeek(startOfMonth(date))
  const all = Array.from({ length: 42 }, (_, i) => addDays(start, i))
  const cells = all[35].getMonth() === date.getMonth() ? all : all.slice(0, 35)
  const todayKey = toDateKey(new Date())

  return (
    <div className="month">
      <div className="mhead">
        {all.slice(0, 7).map((d) => (
          <span key={d.getDay()}>{d.toLocaleDateString('it-IT', { weekday: 'short' })}</span>
        ))}
      </div>
      <div className="mgrid" style={{ gridTemplateRows: `repeat(${cells.length / 7}, minmax(96px, 1fr))` }}>
        {cells.map((d) => {
          const k = toDateKey(d)
          const list = (byDay[k] || []).slice().sort((a, b) => a.start.localeCompare(b.start))
          return (
            <div key={k} className={`mcell ${d.getMonth() !== date.getMonth() ? 'other' : ''} ${k === todayKey ? 'today' : ''}`} onClick={() => onSlot(k, '09:00')}>
              <button className="mnum" onClick={(e) => { e.stopPropagation(); onDay(d) }}>{d.getDate()}</button>
              {list.slice(0, 3).map((a) => (
                <button key={a.id} className="chip" data-stato={a.stato} style={evStyle(a, settings)} onClick={(e) => { e.stopPropagation(); onOpen(a) }}>
                  <b>{a.start.slice(11, 16)}</b> {a.patientName || 'Paziente eliminato'}
                </button>
              ))}
              {list.length > 3 && (
                <button className="more" onClick={(e) => { e.stopPropagation(); onDay(d) }}>+{list.length - 3} altri</button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
