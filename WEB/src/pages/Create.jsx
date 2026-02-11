import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { post, auth } from '../api'

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
    <div>
      <div className="tabs">
        <button className={`tab ${tab === 'workout' ? 'active' : ''}`} onClick={() => setTab('workout')}>
          Тренировка
        </button>
        <button className={`tab ${tab === 'note' ? 'active' : ''}`} onClick={() => setTab('note')}>
          Заметка
        </button>
      </div>

      {msg && <div className="success-msg">{msg}</div>}
      {error && <div className="error" style={{ padding: 16 }}>{error}</div>}

      {tab === 'workout' && (
        <form onSubmit={submitWorkout} className="figma-card">
          <div className="form-group">
            <label className="form-label">Название</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} required />
          </div>

          {/* periodic toggle */}
          <label className="periodic-toggle">
            <input type="checkbox" checked={periodic} onChange={e => { setPeriodic(e.target.checked); if (!e.target.checked) setPause(0) }} />
            <span>Периодичная тренировка</span>
          </label>

          <div className="actions-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Дней тренировок</label>
              <input className="input" type="number" min="1" max="7" value={daysCount}
                onChange={e => setDaysCount(parseInt(e.target.value) || 1)} />
            </div>
            {periodic && (
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Дней отдыха</label>
                <input className="input" type="number" min="0" value={pause}
                  onChange={e => setPause(parseInt(e.target.value) || 0)} />
              </div>
            )}
          </div>

          {periodic && pause > 0 && (
            <div className="schedule-hint">
              Цикл: {daysCount} дн. тренировок → {pause} дн. отдыха → повтор
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Дата начала</label>
            <input className="input" type="date" value={startAt}
              onChange={e => setStartAt(e.target.value)} required />
          </div>

          {/* schedule preview */}
          {periodic && schedulePreview.length > 0 && (
            <div className="schedule-preview">
              <label className="form-label">Расписание на 3 недели</label>
              <div className="schedule-grid">
                {DAY_NAMES.map(d => <div key={d} className="schedule-hdr">{d}</div>)}
                {/* pad first row to correct weekday */}
                {schedulePreview.length > 0 && Array.from({ length: schedulePreview[0].date.getDay() }, (_, i) => (
                  <div key={`pad${i}`} className="schedule-cell schedule-empty" />
                ))}
                {schedulePreview.map((s, i) => (
                  <div key={i} className={`schedule-cell ${s.isTraining ? 'schedule-train' : 'schedule-rest'}`}
                    title={s.isTraining ? `День ${s.dayNum}` : 'Отдых'}>
                    <span className="schedule-date">{s.date.getDate()}</span>
                    {s.isTraining
                      ? <span className="schedule-day-label">Д{s.dayNum}</span>
                      : <span className="schedule-rest-label">—</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <label className="form-label">Упражнения по дням</label>
          <div className="day-tabs">
            {Array.from({ length: daysCount }, (_, i) => i + 1).map(d => (
              <button type="button" key={d}
                className={`day-tab ${activeDay === d ? 'active' : ''}`}
                onClick={() => setActiveDay(d)}>
                День {d}
              </button>
            ))}
          </div>

          <div className="mt-12 mb-8">
            {(days[dayKey] || []).map((ex, i) => (
              <div className="ex-item" key={i}>
                <div className="ex-info">
                  <span>{ex.name}</span>
                  <span className="ex-sets">{ex.sets} подх.</span>
                </div>
                <button type="button" className="ex-rm" onClick={() => removeExercise(dayKey, i)}>×</button>
              </div>
            ))}
            {!(days[dayKey] || []).length && (
              <div className="empty">
                <p>Нет упражнений</p>
              </div>
            )}
          </div>

          <AddExerciseRow exercises={exercises} onAdd={(id, name, sets) => addExercise(dayKey, id, name, sets)} />

          <button className="btn btn-primary btn-block mt-12" type="submit">
            Создать тренировку
          </button>
        </form>
      )}

      {tab === 'note' && (
        <form onSubmit={submitNote} className="figma-card">
          <div className="form-group">
            <label className="form-label">Что нового?</label>
            <textarea className="input" rows={4} value={noteText}
              onChange={e => setNoteText(e.target.value)} required
              placeholder="Напишите что-нибудь..." />
          </div>
          <button className="btn btn-primary btn-block" type="submit">
            Опубликовать
          </button>
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
    <div className="add-row">
      <select value={selId} onChange={e => setSelId(e.target.value)}>
        <option value="">Упражнение...</option>
        {exercises.map(ex => (
          <option key={ex.id} value={ex.id}>{ex.name}</option>
        ))}
      </select>
      <input type="number" min="1" max="10" value={sets}
        onChange={e => setSets(parseInt(e.target.value) || 1)} />
      <button type="button" className="btn btn-sm btn-primary" onClick={add}>+</button>
    </div>
  )
}
