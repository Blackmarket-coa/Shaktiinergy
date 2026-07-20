'use client'

/**
 * Month-grid calendar fed by FBM events (each event carries a dates[]
 * array of ISO UTC instants — recurring events appear on every date).
 *
 * Client component, rendered only after mount: dates are shown in the
 * visitor's local timezone (same convention as FBM Connect embeds), and
 * mount-gating avoids a server/client timezone hydration mismatch. The
 * server-rendered event list in Storefront stays the crawlable fallback.
 */

import { useMemo, useState, useEffect } from 'react'
import { type FBMEvent } from '@/lib/fbm'

interface DayEvent {
  ev: FBMEvent
  date: Date
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function EventsCalendar({ events }: { events: FBMEvent[] }) {
  const [mounted, setMounted] = useState(false)
  const [month, setMonth] = useState<Date | null>(null)

  useEffect(() => {
    const now = new Date()
    setMonth(new Date(now.getFullYear(), now.getMonth(), 1))
    setMounted(true)
  }, [])

  // date-key → occurrences on that local day
  const byDay = useMemo(() => {
    const map = new Map<string, DayEvent[]>()
    for (const ev of events) {
      for (const iso of ev.dates ?? []) {
        const date = new Date(iso)
        if (Number.isNaN(date.getTime())) continue
        const key = dayKey(date)
        const list = map.get(key) ?? []
        list.push({ ev, date })
        map.set(key, list)
      }
    }
    return map
  }, [events])

  const [selected, setSelected] = useState<string | null>(null)

  if (!mounted || !month) return null

  const year = month.getFullYear()
  const monthIdx = month.getMonth()
  const firstWeekday = new Date(year, monthIdx, 1).getDay()
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate()
  const today = dayKey(new Date())

  const cells: Array<{ day: number; key: string; events: DayEvent[] } | null> = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const key = dayKey(new Date(year, monthIdx, d))
    cells.push({ day: d, key, events: byDay.get(key) ?? [] })
  }

  const selectedEvents = selected ? (byDay.get(selected) ?? []) : []
  const monthLabel = month.toLocaleString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="fbm-calendar">
      <div className="cal-head">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => {
            setSelected(null)
            setMonth(new Date(year, monthIdx - 1, 1))
          }}
        >
          ←
        </button>
        <div className="cal-month">{monthLabel}</div>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => {
            setSelected(null)
            setMonth(new Date(year, monthIdx + 1, 1))
          }}
        >
          →
        </button>
      </div>

      <div className="cal-grid cal-weekdays">
        {WEEKDAYS.map((w) => (
          <div key={w} className="cal-weekday">
            {w}
          </div>
        ))}
      </div>

      <div className="cal-grid">
        {cells.map((cell, i) =>
          cell ? (
            <button
              type="button"
              key={cell.key}
              className={[
                'cal-day',
                cell.events.length ? 'has-events' : '',
                cell.key === today ? 'today' : '',
                cell.key === selected ? 'selected' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => setSelected(cell.events.length ? cell.key : null)}
              disabled={!cell.events.length}
            >
              <span className="num">{cell.day}</span>
              {cell.events.length > 0 && <span className="dot" aria-hidden />}
            </button>
          ) : (
            <div key={`pad-${i}`} className="cal-day pad" />
          ),
        )}
      </div>

      {selectedEvents.length > 0 && (
        <div className="cal-selected">
          {selectedEvents.map(({ ev, date }) => (
            <a
              key={`${ev.id}-${date.toISOString()}`}
              href={ev.url ?? undefined}
              target="_blank"
              rel="noreferrer"
              className="cal-selected-event"
            >
              <span className="time">
                {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </span>
              <span className="name">{ev.title}</span>
              {ev.venue?.name && <span className="venue">{ev.venue.name}</span>}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
