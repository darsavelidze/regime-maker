import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { post, auth } from '../api'

export default function Day() {
  const { user } = useAuth()
  const [date, setDate] = useState('')
  const [duties, setDuties] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadDay = async (e) => {
    e.preventDefault()
    if (!date) return
    setLoading(true)
    setError('')
    try {
      const data = await post('/day/', auth(user, { day: date }))
      setDuties(data.duties || {})
    } catch (err) {
      setError(err.message)
      setDuties(null)
    } finally {
      setLoading(false)
    }
  }

  const toggleDuty = async (dutyName) => {
    try {
      const data = await post('/duty/', auth(user, { selected_date: date, duty_name: dutyName }))
      const updated = data.duties?.[date] || data.duties || {}
      setDuties(updated)
    } catch {}
  }

  const entries = duties ? Object.entries(duties) : []
  const done = entries.filter(([, v]) => v).length

  return (
    <div className="section">
      <form onSubmit={loadDay} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input className="input" type="date" value={date}
          onChange={e => setDate(e.target.value)} required style={{ flex: 1 }} />
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? '...' : 'Показать'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {duties !== null && (
        <>
          {entries.length > 0 ? (
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
          )}
        </>
      )}

      {duties === null && !loading && !error && (
        <div className="empty">
          <p style={{ fontSize: 40 }}>📅</p>
          <p>Выберите дату, чтобы увидеть задачи</p>
        </div>
      )}
    </div>
  )
}
