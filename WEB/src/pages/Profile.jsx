import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { post, get, auth } from '../api'

export default function Profile() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const [tab, setTab] = useState('workouts')
  const [profile, setProfile] = useState(null)
  const [cycles, setCycles] = useState([])
  const [notes, setNotes] = useState([])
  const [followers, setFollowers] = useState([])
  const [following, setFollowing] = useState([])
  const [bio, setBio] = useState('')
  const [editBio, setEditBio] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [prof, cyc, nt, fData, fgData] = await Promise.all([
        get(`/profile/${user.username}/`),
        post('/user_cycles/', auth(user)),
        post('/get_notes/', auth(user)),
        get(`/followers/${user.username}/`),
        get(`/following/${user.username}/`),
      ])
      setProfile(prof)
      setCycles(cyc.cycles || [])
      setNotes(nt.notes || [])
      setFollowers(fData.followers || [])
      setFollowing(fgData.following || [])
      setBio(prof.bio || '')
    } catch {}
    finally { setLoading(false) }
  }, [user])

  useEffect(() => { load() }, [load])

  const saveBio = async () => {
    try {
      await post('/update_profile/', auth(user, { bio }))
      setEditBio(false)
      load()
    } catch {}
  }

  const togglePublish = async (cycle) => {
    const endpoint = cycle.is_public ? '/unpublish_cycle/' : '/publish_cycle/'
    try {
      await post(endpoint, auth(user, { cycle_name: cycle.name }))
      load()
    } catch {}
  }

  const deleteCycle = async (name) => {
    if (!confirm('Удалить тренировку?')) return
    try {
      await post('/delete_cycle/', auth(user, { cycle_name: name }))
      load()
    } catch {}
  }

  const deleteNote = async (name) => {
    if (!confirm('Удалить заметку?')) return
    try {
      await post('/delete_note/', auth(user, { note_name: name }))
      load()
    } catch {}
  }

  const doLogout = () => { logout(); nav('/login') }

  if (loading) return <div className="spinner">Загрузка...</div>

  return (
    <div>
      {/* Header */}
      <div className="prof-head">
        <div className="avatar avatar-lg">{user.username[0]}</div>
        <div className="prof-info">
          <div className="prof-name">{user.username}</div>
          {editBio ? (
            <div className="bio-form">
              <textarea className="input" value={bio} onChange={e => setBio(e.target.value)}
                placeholder="О себе..." rows={2} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <button className="btn btn-sm btn-primary" onClick={saveBio}>✓</button>
                <button className="btn btn-sm btn-outline" onClick={() => setEditBio(false)}>✕</button>
              </div>
            </div>
          ) : (
            <div className="prof-bio" onClick={() => setEditBio(true)} style={{ cursor: 'pointer' }}>
              {profile?.bio || 'Нажмите, чтобы добавить описание...'}
            </div>
          )}
        </div>
      </div>

      <div className="prof-stats">
        <div className="prof-stat">
          <span className="n">{profile?.cycles_count || 0}</span>
          <span className="l">тренировок</span>
        </div>
        <div className="prof-stat">
          <span className="n">{profile?.total_likes || 0}</span>
          <span className="l">лайков</span>
        </div>
        <div className="prof-stat clickable" onClick={() => setTab('followers')}>
          <span className="n">{profile?.followers_count || 0}</span>
          <span className="l">подписчиков</span>
        </div>
        <div className="prof-stat clickable" onClick={() => setTab('following')}>
          <span className="n">{profile?.following_count || 0}</span>
          <span className="l">подписок</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${tab === 'workouts' ? 'active' : ''}`}
          onClick={() => setTab('workouts')}>Тренировки</button>
        <button className={`tab ${tab === 'notes' ? 'active' : ''}`}
          onClick={() => setTab('notes')}>Заметки</button>
        <button className={`tab ${tab === 'followers' ? 'active' : ''}`}
          onClick={() => setTab('followers')}>Подписчики</button>
        <button className={`tab ${tab === 'following' ? 'active' : ''}`}
          onClick={() => setTab('following')}>Подписки</button>
      </div>

      {/* Workouts */}
      {tab === 'workouts' && (
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
              </div>
              <div className="card-meta">
                {c.days_count} дн · пауза {c.pause} дн · с {c.start_at}
              </div>
              {c.original_author && (
                <div className="original-author">
                  📎 от <Link to={`/user/${c.original_author}`}>@{c.original_author}</Link>
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
                <button className="btn btn-sm btn-outline"
                  onClick={() => togglePublish(c)}>
                  {c.is_public ? '🔒 Скрыть' : '🌐 Опубликовать'}
                </button>
                <button className="btn btn-sm btn-outline"
                  onClick={() => nav('/analytics', { state: { cycleName: c.name } })}>
                  📊 Анализ
                </button>
                <button className="btn btn-sm btn-danger"
                  onClick={() => deleteCycle(c.name)}>
                  Удалить
                </button>
              </div>
            </div>
          )) : (
            <div className="empty">
              <p>Нет тренировок</p>
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {tab === 'notes' && (
        <div className="section">
          {notes.length > 0 ? notes.map((n, i) => (
            <div className="card" key={i} style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="note-title">{n.name}</div>
                <button className="btn btn-sm btn-danger" onClick={() => deleteNote(n.name)}>
                  Удалить
                </button>
              </div>
              <div className="note-body">{n.descriptions}</div>
            </div>
          )) : (
            <div className="empty">
              <p>Нет заметок</p>
            </div>
          )}
        </div>
      )}

      {/* Followers */}
      {tab === 'followers' && (
        <div className="section">
          {followers.length > 0 ? followers.map(f => (
            <Link to={`/user/${f}`} key={f} className="user-list-item">
              <div className="avatar">{f[0]}</div>
              <span className="user-list-name">{f}</span>
            </Link>
          )) : (
            <div className="empty"><p>Нет подписчиков</p></div>
          )}
        </div>
      )}

      {/* Following */}
      {tab === 'following' && (
        <div className="section">
          {following.length > 0 ? following.map(f => (
            <Link to={`/user/${f}`} key={f} className="user-list-item">
              <div className="avatar">{f[0]}</div>
              <span className="user-list-name">{f}</span>
            </Link>
          )) : (
            <div className="empty"><p>Нет подписок</p></div>
          )}
        </div>
      )}

      {/* Logout */}
      <div className="section text-center">
        <button className="btn btn-outline" onClick={doLogout}>Выйти</button>
      </div>
    </div>
  )
}
