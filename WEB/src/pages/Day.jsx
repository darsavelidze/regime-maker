import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { post, auth } from '../api'
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react'
import { Card, CardContent } from '../components/ui/Card'

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
  if (count === 0) return ''
  if (max <= 0) return ''
  const ratio = Math.min(count / max, 1)
  // from light to burgundy
  const r = Math.round(139 + (116 * (1 - ratio)))  // 139 → 255
  const g = Math.round(0 + (200 * (1 - ratio)))    // 0 → 200
  const b = Math.round(0 + (200 * (1 - ratio)))    // 0 → 200
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
    <div className="p-4">
      {/* Calendar header */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <button 
              className="p-2 rounded-full hover:bg-muted transition-colors"
              onClick={prevMonth}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-lg">{MONTHS[month]} {year}</span>
            <button 
              className="p-2 rounded-full hover:bg-muted transition-colors"
              onClick={nextMonth}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Weekday labels */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map(w => (
              <div key={w} className="text-center text-xs text-muted-foreground font-medium py-1">
                {w}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (d === null) return <div key={`e${i}`} className="aspect-square" />
              const dateStr = toISO(year, month, d)
              const count = monthData[dateStr] || 0
              const isSelected = dateStr === selectedDate
              const isToday = dateStr === todayISO
              const bg = dayColor(count, maxDuties)
              
              return (
                <button
                  key={d}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all relative ${
                    isSelected 
                      ? 'ring-2 ring-primary ring-offset-2' 
                      : ''
                  } ${
                    isToday 
                      ? 'font-bold' 
                      : ''
                  } ${
                    count > 0 
                      ? 'text-white' 
                      : 'hover:bg-muted'
                  }`}
                  style={{ backgroundColor: bg || undefined }}
                  onClick={() => selectDay(d)}
                >
                  {d}
                  {count > 0 && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-white/70" />
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected day duties */}
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground mb-4">{selectedDate}</div>

          {dayLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!dayLoading && duties !== null && (
            entries.length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Выполнено {done} из {entries.length}
                </p>
                <div className="space-y-2">
                  {entries.map(([name, completed]) => (
                    <button 
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors text-left"
                      key={name} 
                      onClick={() => toggleDuty(name)}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        completed 
                          ? 'bg-green-500 text-white' 
                          : 'border-2 border-border'
                      }`}>
                        {completed && <Check className="w-4 h-4" />}
                      </div>
                      <span
                        className={completed ? 'line-through text-muted-foreground' : ''}
                        dangerouslySetInnerHTML={{ __html: name }}
                      />
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>На эту дату нет задач</p>
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  )
}
