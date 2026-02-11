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
    <div>
      {/* Calendar Card */}
      <div className="cal-card">
        <div className="cal-header">
          <button className="cal-nav" onClick={prevMonth}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span className="cal-title">{MONTHS[month]} {year}</span>
          <button className="cal-nav" onClick={nextMonth}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        <div className="cal-weekdays">
          {WEEKDAYS.map(w => (
            <div key={w} className="cal-weekday">{w}</div>
          ))}
        </div>
        <div className="cal-grid">
          {cells.map((d, i) => {
            if (d === null) return <div key={`e${i}`} className="cal-cell empty" />
            const dateStr = toISO(year, month, d)
            const count = monthData[dateStr] || 0
            const isSelected = dateStr === selectedDate
            const isToday = dateStr === todayISO
            const hasWorkout = count > 0
            return (
              <div
                key={d}
                className={`cal-cell${isSelected ? ' selected' : ''}${isToday ? ' today' : ''}${hasWorkout ? ' has-workout' : ''}`}
                onClick={() => selectDay(d)}
              >
                {d}
              </div>
            )
          })}
        </div>
      </div>

      {/* Selected day details */}
      <div className="day-detail-card">
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{selectedDate}</div>

        {dayLoading && <div className="spinner">Загрузка...</div>}

        {!dayLoading && duties !== null && (
          entries.length > 0 ? (
            <>
              <div className="card-meta mb-8">
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
    </div>
  )
}
