import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { post, auth } from '../api'

export default function Workouts() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [cycles, setCycles] = useState([])
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(null)

  const load = useCallback(async () => {
    try {
      const data = await post('/user_cycles/', auth(user))
      setCycles(data.cycles || [])
    } catch {}
    finally { setLoading(false) }
  }, [user])

  useEffect(() => { load() }, [load])

  const togglePublish = async (cycle) => {
    const endpoint = cycle.is_public ? '/unpublish_cycle/' : '/publish_cycle/'
    try {
      await post(endpoint, auth(user, { cycle_name: cycle.name }))
      load()
    } catch (err) {
      alert(err.message || 'Ошибка')
    }
  }

  const deleteCycle = async (name) => {
    if (!confirm('Удалить тренировку?')) return
    setMenuOpen(null)
    try {
      await post('/delete_cycle/', auth(user, { cycle_name: name }))
      load()
    } catch {}
  }

  if (loading) return <div className="spinner">Загрузка...</div>

  return (
    <div>
      <div className="page-head">
        <h1>Мои тренировки</h1>
      </div>
      <div className="section">
        {cycles.length > 0 ? cycles.map(c => (
          <div className="card own-card" key={c.id}>
            <div className="own-card-head">
              <h3>
                {c.name}
                <span className={`badge ${c.is_public ? 'badge-pub' : 'badge-priv'}`}>
                  {c.is_public ? 'Публичная' : 'Приватная'}
                </span>
              </h3>
              <div className="dot-menu-wrap">
                <button className="dot-menu-btn"
                  onClick={() => setMenuOpen(menuOpen === c.id ? null : c.id)}>⋮</button>
                {menuOpen === c.id && (
                  <div className="dot-menu-dropdown">
                    <button onClick={() => deleteCycle(c.name)} className="danger">Удалить</button>
                  </div>
                )}
              </div>
            </div>
            <div className="card-meta">
              {c.days_count} дн · пауза {c.pause} дн · с {c.start_at}
            </div>
            {c.original_author && (
              <div className="original-author">
                от <Link to={`/user/${c.original_author}`}>@{c.original_author}</Link>
              </div>
            )}
            {c.descriptions?.length > 0 && (
              <ul className="card-desc" style={{ marginTop: 8 }}>
                {c.descriptions.map((d, i) => (
                  <li key={i} dangerouslySetInnerHTML={{ __html: d }} />
                ))}
              </ul>
            )}
            <div className="own-card-actions">
              {!c.original_author && (
                <button className="btn btn-sm btn-outline"
                  onClick={() => togglePublish(c)}>
                  {c.is_public ? '🔒 Скрыть' : '🌐 Опубликовать'}
                </button>
              )}
              <button className="btn btn-sm btn-outline"
                onClick={() => nav('/analytics', { state: { cycleName: c.name } })}>
                📊 Анализ
              </button>
            </div>
          </div>
        )) : (
          <div className="empty">
            <p>Нет тренировок</p>
            <button className="btn btn-primary" onClick={() => nav('/create')} style={{ marginTop: 12 }}>
              Создать тренировку
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
