import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { post, auth } from '../api'
import { Card, CardContent } from '../components/ui/Card'
import { Input, Textarea } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs'
import { X } from 'lucide-react'

/* helpers */
const DAY_NAMES = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб']
const MON_NAMES = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек']
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r }
function fmtShort(d) { return `${d.getDate()} ${MON_NAMES[d.getMonth()]}` }

export default function Create() {
  const { user } = useAuth()
  const [tab, setTab] = useState('workout')
  const [exercises, setExercises] = useState([])
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  // Workout state
  const [name, setName] = useState('')
  const [daysCount, setDaysCount] = useState(3)
  const [pause, setPause] = useState(0)
  const [startAt, setStartAt] = useState('')
  const [days, setDays] = useState({})
  const [activeDay, setActiveDay] = useState(1)
  const [periodic, setPeriodic] = useState(false)

  // Note state
  const [noteText, setNoteText] = useState('')

  useEffect(() => {
    post('/get_exercises/').then(setExercises).catch(() => {})
  }, [])

  useEffect(() => {
    setDays(prev => {
      const d = {}
      for (let i = 1; i <= daysCount; i++) d[`day${i}`] = prev[`day${i}`] || []
      return d
    })
    if (activeDay > daysCount) setActiveDay(1)
  }, [daysCount, activeDay])

  const addExercise = (dayKey, exId, exName, sets) => {
    setDays(prev => ({
      ...prev,
      [dayKey]: [...(prev[dayKey] || []), { id: exId, name: exName, sets }]
    }))
  }

  const removeExercise = (dayKey, idx) => {
    setDays(prev => ({
      ...prev,
      [dayKey]: prev[dayKey].filter((_, i) => i !== idx)
    }))
  }

  const submitWorkout = async (e) => {
    e.preventDefault()
    setError('')
    setMsg('')

    const descriptions = Object.values(days).map(exs => {
      if (!exs.length) return 'Нет упражнений'
      return exs.map((ex, i) => {
        if (ex.name === 'Отдых') return 'Отдых'
        return `${i + 1}. ${ex.name}: ${ex.sets}`
      }).join('<br>')
    })

    try {
      await post('/create_cycle/', auth(user, {
        name, days_count: daysCount, pause, start_at: startAt,
        descriptions, data_cycle: days,
      }))
      setMsg('Тренировка создана!')
      setName(''); setDays({}); setDaysCount(3); setPause(0); setStartAt('')
    } catch (err) {
      setError(err.message)
    }
  }

  const submitNote = async (e) => {
    e.preventDefault()
    setError('')
    setMsg('')
    try {
      await post('/create_note/', auth(user, { name: '', descriptions: noteText }))
      setMsg('Заметка создана!')
      setNoteText('')
    } catch (err) {
      setError(err.message)
    }
  }

  const dayKey = `day${activeDay}`

  /* compute 3-week schedule preview */
  const schedulePreview = useMemo(() => {
    if (!startAt) return []
    const start = new Date(startAt + 'T00:00:00')
    if (isNaN(start)) return []
    const period = daysCount + pause
    const items = []
    for (let i = 0; i < 21; i++) {
      const date = addDays(start, i)
      const idx = i % period
      const isTraining = idx < daysCount
      items.push({ date, dayNum: isTraining ? idx + 1 : 0, isTraining })
    }
    return items
  }, [startAt, daysCount, pause])

  return (
    <div className="p-4">
      {/* Tabs */}
      <Card className="mb-4">
        <div className="flex">
          <button
            className={`flex-1 py-4 text-center font-medium text-sm uppercase tracking-wide transition-colors ${
              tab === 'workout' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}
            onClick={() => setTab('workout')}
          >
            Тренировка
          </button>
          <button
            className={`flex-1 py-4 text-center font-medium text-sm uppercase tracking-wide transition-colors ${
              tab === 'note' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}
            onClick={() => setTab('note')}
          >
            Заметка
          </button>
        </div>
      </Card>

      {msg && (
        <div className="bg-green-100 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm">
          {msg}
        </div>
      )}
      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
          {error}
        </div>
      )}

      {tab === 'workout' && (
        <form onSubmit={submitWorkout}>
          <Card className="mb-4">
            <CardContent className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Название</label>
                <Input value={name} onChange={e => setName(e.target.value)} required />
              </div>

              {/* periodic toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={periodic} 
                  onChange={e => { setPeriodic(e.target.checked); if (!e.target.checked) setPause(0) }}
                  className="w-5 h-5 rounded border-border"
                />
                <span className="text-sm">Периодичная тренировка</span>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Дней тренировок</label>
                  <Input 
                    type="number" 
                    min="1" 
                    max="7" 
                    value={daysCount}
                    onChange={e => setDaysCount(parseInt(e.target.value) || 1)} 
                  />
                </div>
                {periodic && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Дней отдыха</label>
                    <Input 
                      type="number" 
                      min="0" 
                      value={pause}
                      onChange={e => setPause(parseInt(e.target.value) || 0)} 
                    />
                  </div>
                )}
              </div>

              {periodic && pause > 0 && (
                <p className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-lg">
                  Цикл: {daysCount} дн. тренировок → {pause} дн. отдыха → повтор
                </p>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Дата начала</label>
                <Input 
                  type="date" 
                  value={startAt}
                  onChange={e => setStartAt(e.target.value)} 
                  required 
                />
              </div>
            </CardContent>
          </Card>

          {/* schedule preview */}
          {periodic && schedulePreview.length > 0 && (
            <Card className="mb-4">
              <CardContent className="p-4">
                <label className="block text-sm font-medium mb-3">Расписание на 3 недели</label>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {DAY_NAMES.map(d => (
                    <div key={d} className="text-xs text-muted-foreground font-medium py-1">{d}</div>
                  ))}
                  {/* pad first row to correct weekday */}
                  {schedulePreview.length > 0 && Array.from({ length: schedulePreview[0].date.getDay() }, (_, i) => (
                    <div key={`pad${i}`} />
                  ))}
                  {schedulePreview.map((s, i) => (
                    <div 
                      key={i} 
                      className={`rounded-lg py-2 text-xs ${
                        s.isTraining 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}
                      title={s.isTraining ? `День ${s.dayNum}` : 'Отдых'}
                    >
                      <div>{s.date.getDate()}</div>
                      <div className="text-[10px]">
                        {s.isTraining ? `Д${s.dayNum}` : '—'}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="mb-4">
            <CardContent className="p-4">
              <label className="block text-sm font-medium mb-3">Упражнения по дням</label>
              <div className="flex flex-wrap gap-2 mb-4">
                {Array.from({ length: daysCount }, (_, i) => i + 1).map(d => (
                  <button 
                    type="button" 
                    key={d}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      activeDay === d 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                    onClick={() => setActiveDay(d)}
                  >
                    День {d}
                  </button>
                ))}
              </div>

              <div className="space-y-2 mb-4">
                {(days[dayKey] || []).map((ex, i) => (
                  <div 
                    className="flex items-center justify-between bg-muted rounded-lg px-4 py-3" 
                    key={i}
                  >
                    <div className="flex-1">
                      <span className="font-medium">{ex.name}</span>
                      <span className="text-muted-foreground ml-2">{ex.sets} подх.</span>
                    </div>
                    <button 
                      type="button" 
                      className="text-muted-foreground hover:text-destructive p-1"
                      onClick={() => removeExercise(dayKey, i)}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {!(days[dayKey] || []).length && (
                  <p className="text-center text-muted-foreground py-4">Нет упражнений</p>
                )}
              </div>

              <AddExerciseRow exercises={exercises} onAdd={(id, name, sets) => addExercise(dayKey, id, name, sets)} />
            </CardContent>
          </Card>

          <Button className="w-full" type="submit">
            Создать тренировку
          </Button>
        </form>
      )}

      {tab === 'note' && (
        <form onSubmit={submitNote}>
          <Card className="mb-4">
            <CardContent className="p-4">
              <label className="block text-sm font-medium mb-2">Что нового?</label>
              <Textarea 
                value={noteText}
                onChange={e => setNoteText(e.target.value)} 
                required
                placeholder="Напишите что-нибудь..." 
              />
            </CardContent>
          </Card>
          <Button className="w-full" type="submit">
            Опубликовать
          </Button>
        </form>
      )}
    </div>
  )
}

function AddExerciseRow({ exercises, onAdd }) {
  const [selId, setSelId] = useState('')
  const [sets, setSets] = useState(3)

  const add = () => {
    if (!selId) return
    const ex = exercises.find(e => String(e.id) === selId)
    if (ex) {
      onAdd(ex.id, ex.name, sets)
      setSelId('')
      setSets(3)
    }
  }

  return (
    <div className="flex gap-2">
      <select 
        value={selId} 
        onChange={e => setSelId(e.target.value)}
        className="flex-1 h-11 rounded-lg border border-border bg-input px-3 text-sm"
      >
        <option value="">Упражнение...</option>
        {exercises.map(ex => (
          <option key={ex.id} value={ex.id}>{ex.name}</option>
        ))}
      </select>
      <Input 
        type="number" 
        min="1" 
        max="10" 
        value={sets}
        onChange={e => setSets(parseInt(e.target.value) || 1)}
        className="w-16"
      />
      <Button type="button" onClick={add}>+</Button>
    </div>
  )
}
