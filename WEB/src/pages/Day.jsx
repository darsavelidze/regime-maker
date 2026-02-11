import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { post, auth } from '../api'

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь',
  'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']

function getDaysInMonth(y, m) {
  return new Date(y, m + 1, 0).getDate()
}
function getFirstDayOfWeek(y, m) {
  const d = new Date(y, m, 1).getDay()
  return d === 0 ? 6 : d - 1 // Monday=0
}
function pad(n) { return String(n).padStart(2, '0') }
function toISO(y, m, d) { return `${y}-${pad(m + 1)}-${pad(d)}` }

function dayColor(count, max) {
  if (count === 0) return 'transparent'
  if (max <= 0) return 'transparent'
  const ratio = Math.min(count / max, 1)
  // yellow → red-burgundy interpolation
  const r = Math.round(200 + 55 * ratio)       // 200→255
  const g = Math.round(180 * (1 - ratio))       // 180→0
  const b = Math.round(30 * (1 - ratio * 0.7))  // 30→9
  return `rgb(${r},${g},${b})`
}

export default function Day() {
  const { user } = useAuth()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState(toISO(today.getFullYear(), today.getMonth(), today.getDate()))
  const [monthData, setMonthData] = useState({})
  const [maxDuties, setMaxDuties] = useState(0)
  const [duties, setDuties] = useState(null)
  const [loading, setLoading] = useState(false)
  const [dayLoading, setDayLoading] = useState(false)

  const loadMonth = useCallback(async () => {
    setLoading(true)
    try {
      const data = await post('/month_duties/', auth(user, { year, month: month + 1 }))
      setMonthData(data.days || {})
      setMaxDuties(data.max || 0)
    } catch { setMonthData({}); setMaxDuties(0) }
    finally { setLoading(false) }
  }, [user, year, month])

  useEffect(() => { loadMonth() }, [loadMonth])

  const loadDay = useCallback(async (dateStr) => {
    setDayLoading(true)
    try {
      const data = await post('/day/', auth(user, { day: dateStr }))
      setDuties(data.duties || {})
    } catch { setDuties(null) }
    finally { setDayLoading(false) }
  }, [user])

  useEffect(() => { if (selectedDate) loadDay(selectedDate) }, [selectedDate, loadDay])

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const selectDay = (d) => {
    const dateStr = toISO(year, month, d)
    setSelectedDate(dateStr)
  }

  const toggleDuty = async (dutyName) => {
    try {
      const data = await post('/duty/', auth(user, { selected_date: selectedDate, duty_name: dutyName }))
      const updated = data.duties?.[selectedDate] || data.duties || {}
      setDuties(updated)
      loadMonth()
    } catch {}
  }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfWeek(year, month)
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const entries = duties ? Object.entries(duties) : []
  const done = entries.filter(([, v]) => v).length
  const todayISO = toISO(today.getFullYear(), today.getMonth(), today.getDate())

  return (
    <div className="section">
      {/* Calendar header */}
      <div className="cal-header">
        <button className="cal-nav" onClick={prevMonth}>‹</button>
        <span className="cal-title">{MONTHS[month]} {year}</span>
        <button className="cal-nav" onClick={nextMonth}>›</button>
      </div>

      {/* Weekday labels */}
      <div className="cal-grid">
        {WEEKDAYS.map(w => (
          <div key={w} className="cal-weekday">{w}</div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={`e${i}`} className="cal-cell empty" />
          const dateStr = toISO(year, month, d)
          const count = monthData[dateStr] || 0
          const isSelected = dateStr === selectedDate
          const isToday = dateStr === todayISO
          const bg = dayColor(count, maxDuties)
          return (
            <div
              key={d}
              className={`cal-cell${isSelected ? ' selected' : ''}${isToday ? ' today' : ''}`}
              style={{ backgroundColor: bg }}
              onClick={() => selectDay(d)}
            >
              {d}
              {count > 0 && <span className="cal-dot" />}
            </div>
          )
        })}
      </div>

      {/* Selected day duties */}
      <div className="cal-day-label">{selectedDate}</div>

      {dayLoading && <div className="spinner">Загрузка...</div>}

      {!dayLoading && duties !== null && (
        entries.length > 0 ? (
          <>
            <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-2)' }}>
              Выполнено {done} из {entries.length}
            </div>
            {entries.map(([name, completed]) => (
              <div className="duty-item" key={name} onClick={() => toggleDuty(name)}>
                <div className={`duty-check ${completed ? 'done' : ''}`}>
                  {completed && '✓'}
                </div>
                <span
                  className={`duty-text ${completed ? 'done' : ''}`}
                  dangerouslySetInnerHTML={{ __html: name }}
                />
              </div>
            ))}
          </>
        ) : (
          <div className="empty">
            <p>На эту дату нет задач</p>
          </div>
        )
      )}
    </div>
  )
}
