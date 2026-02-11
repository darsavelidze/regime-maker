import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { post, auth } from '../api'
import WorkoutCard from '../components/WorkoutCard'

const RECENT_KEY = 'in_recent_searches'
const MAX_RECENT = 8

function getRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] }
}
function saveRecent(q) {
  const list = getRecent().filter(x => x !== q)
  list.unshift(q)
  localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)))
}
function clearRecent() { localStorage.removeItem(RECENT_KEY) }

export default function Explore() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [searchTab, setSearchTab] = useState('workouts')
  const [cycleResults, setCycleResults] = useState(null)
  const [userResults, setUserResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [recent, setRecent] = useState(getRecent)

  const search = async (q) => {
    const term = (q || query).trim()
    if (!term) return
    saveRecent(term)
    setRecent(getRecent())
    setLoading(true)
    try {
      const [cycles, users] = await Promise.all([
        post('/search_cycles/', auth(user, { query: term })),
        post('/search_users/', auth(user, { query: term })),
      ])
      setCycleResults(cycles.cycles || [])
      setUserResults(users.users || [])
    } catch {
      setCycleResults([])
      setUserResults([])
    }
    finally { setLoading(false) }
  }

  const handleSubmit = (e) => { e?.preventDefault(); search() }

  const pickRecent = (q) => { setQuery(q); search(q) }

  const doClean = () => { clearRecent(); setRecent([]) }

  const toggleIn = async (cycle) => {
    const endpoint = cycle.is_in ? '/unlike_cycle/' : '/like_cycle/'
    try {
      const res = await post(endpoint, auth(user, { cycle_id: cycle.id }))
      setCycleResults(prev => prev.map(c =>
        c.id === cycle.id
          ? { ...c, is_in: !c.is_in, ins_count: res.ins_count }
          : c
      ))
    } catch {}
  }

  const hasResults = cycleResults !== null || userResults !== null

  return (
    <div>
      <div className="search-bar">
        <form onSubmit={handleSubmit}>
          <input
            className="search-input"
            placeholder="Поиск тренировок и пользователей..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </form>
      </div>

      {/* Recent searches */}
      {!hasResults && !loading && recent.length > 0 && (
        <div className="section">
          <div className="section-title">
            <span>Недавние</span>
            <button className="btn btn-sm btn-outline" onClick={doClean}>Очистить</button>
          </div>
          <div className="recent-chips">
            {recent.map(q => (
              <button key={q} className="recent-chip" onClick={() => pickRecent(q)}>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {hasResults && !loading && (
        <div className="search-tabs">
          <button className={`search-tab ${searchTab === 'workouts' ? 'active' : ''}`}
            onClick={() => setSearchTab('workouts')}>
            Тренировки {cycleResults?.length ? `(${cycleResults.length})` : ''}
          </button>
          <button className={`search-tab ${searchTab === 'users' ? 'active' : ''}`}
            onClick={() => setSearchTab('users')}>
            Пользователи {userResults?.length ? `(${userResults.length})` : ''}
          </button>
        </div>
      )}

      {loading && <div className="spinner">Поиск...</div>}

      {hasResults && !loading && searchTab === 'workouts' && (
        <div style={{ padding: '0 0 12px' }}>
          {cycleResults.length > 0 ? (
            cycleResults.map(c => (
              <WorkoutCard key={c.id} cycle={c} onIn={toggleIn} />
            ))
          ) : (
            <div className="empty"><p>Тренировки не найдены</p></div>
          )}
        </div>
      )}

      {hasResults && !loading && searchTab === 'users' && (
        <div style={{ padding: '0 0 12px' }}>
          {userResults.length > 0 ? (
            userResults.map(u => (
              <Link to={`/user/${u.username}`} key={u.username} className="user-list-item">
                <div className="avatar">{u.username[0]}</div>
                <div className="user-list-info">
                  <span className="user-list-name">{u.username}</span>
                  {u.bio && <span className="user-list-bio">{u.bio}</span>}
                  <span className="user-list-meta">
                    {u.cycles_count} тренировок · {u.followers_count} подписчиков
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <div className="empty"><p>Пользователи не найдены</p></div>
          )}
        </div>
      )}

      {!hasResults && !loading && (
        <div className="empty">
          <p style={{ fontSize: 40 }}>🔍</p>
          <p>Найдите тренировки и пользователей</p>
          <p>Нажмите Enter для поиска</p>
        </div>
      )}
    </div>
  )
}
