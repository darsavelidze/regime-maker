import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { post, auth } from '../api'
import WorkoutCard from '../components/WorkoutCard'

export default function Explore() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  const search = async (e) => {
    e?.preventDefault()
    setLoading(true)
    try {
      const data = await post('/search_cycles/', auth(user, { query }))
      setResults(data.cycles || [])
    } catch { setResults([]) }
    finally { setLoading(false) }
  }

  const toggleLike = async (cycle) => {
    const endpoint = cycle.is_liked ? '/unlike_cycle/' : '/like_cycle/'
    try {
      const res = await post(endpoint, auth(user, { cycle_id: cycle.id }))
      setResults(prev => prev.map(c =>
        c.id === cycle.id
          ? { ...c, is_liked: !c.is_liked, likes_count: res.likes_count }
          : c
      ))
    } catch {}
  }

  return (
    <div>
      <div className="search-bar">
        <form onSubmit={search}>
          <input
            className="search-input"
            placeholder="Поиск тренировок..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </form>
      </div>

      {loading && <div className="spinner">Поиск...</div>}

      {results !== null && !loading && (
        <div style={{ padding: '0 0 12px' }}>
          {results.length > 0 ? (
            <>
              <div className="section">
                <span className="card-meta">Найдено: {results.length}</span>
              </div>
              {results.map(c => (
                <WorkoutCard key={c.id} cycle={c} onLike={toggleLike} />
              ))}
            </>
          ) : (
            <div className="empty">
              <p>Ничего не найдено</p>
            </div>
          )}
        </div>
      )}

      {results === null && !loading && (
        <div className="empty">
          <p style={{ fontSize: 40 }}>🔍</p>
          <p>Найдите тренировки других пользователей</p>
          <p>Нажмите Enter для поиска</p>
        </div>
      )}
    </div>
  )
}
