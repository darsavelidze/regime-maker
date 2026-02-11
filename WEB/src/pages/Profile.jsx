import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { post, get, auth } from '../api'
import WorkoutCard from '../components/WorkoutCard'

export default function Profile() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const [tab, setTab] = useState('workouts')
  const [profile, setProfile] = useState(null)
  const [notes, setNotes] = useState([])
  const [followers, setFollowers] = useState([])
  const [following, setFollowing] = useState([])
  const [bio, setBio] = useState('')
  const [editBio, setEditBio] = useState(false)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(null)
  const [noteComments, setNoteComments] = useState({})
  const [openComments, setOpenComments] = useState({})
  const [commentTexts, setCommentTexts] = useState({})

  const load = useCallback(async () => {
    try {
      const [prof, nt, fData, fgData] = await Promise.all([
        get(`/profile/${user.username}/`),
        post('/get_notes/', auth(user)),
        get(`/followers/${user.username}/`),
        get(`/following/${user.username}/`),
      ])
      setProfile(prof)
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

  const deleteNote = async (name) => {
    if (!confirm('Удалить заметку?')) return
    setMenuOpen(null)
    try {
      await post('/delete_note/', auth(user, { note_name: name }))
      load()
    } catch {}
  }

  const loadNoteComments = async (noteId) => {
    try {
      const res = await post('/get_comments/', { target_type: 'note', target_id: noteId })
      setNoteComments(prev => ({ ...prev, [noteId]: res.comments || [] }))
    } catch {}
  }

  const toggleNoteComments = (noteId) => {
    const isOpen = openComments[noteId]
    if (!isOpen) loadNoteComments(noteId)
    setOpenComments(prev => ({ ...prev, [noteId]: !isOpen }))
  }

  const submitNoteComment = async (e, noteId) => {
    e.preventDefault()
    const text = (commentTexts[noteId] || '').trim()
    if (!text) return
    try {
      await post('/create_comment/', auth(user, {
        target_type: 'note', target_id: noteId, text,
      }))
      setCommentTexts(prev => ({ ...prev, [noteId]: '' }))
      loadNoteComments(noteId)
    } catch {}
  }

  const deleteComment = async (commentId, noteId) => {
    try {
      await post('/delete_comment/', auth(user, { comment_id: commentId }))
      loadNoteComments(noteId)
    } catch {}
  }

  const doLogout = () => { logout(); nav('/login') }

  if (loading) return <div className="spinner">Загрузка...</div>

  const timeAgo = (iso) => {
    if (!iso) return ''
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'только что'
    if (mins < 60) return `${mins} мин`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs} ч`
    const days = Math.floor(hrs / 24)
    return `${days} дн`
  }

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
          <span className="n">{profile?.total_ins || 0}</span>
          <span className="l">IN</span>
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

      {/* Public workouts */}
      {tab === 'workouts' && (
        <div className="section">
          {profile?.public_cycles?.length > 0 ? profile.public_cycles.map(c => (
            <div key={c.id}>
              <WorkoutCard cycle={c} showAuthor={false}
                onIn={async (cycle) => {
                  const endpoint = cycle.is_in ? '/unlike_cycle/' : '/like_cycle/'
                  try {
                    const res = await post(endpoint, auth(user, { cycle_id: cycle.id }))
                    setProfile(prev => ({
                      ...prev,
                      public_cycles: prev.public_cycles.map(cc =>
                        cc.id === cycle.id
                          ? { ...cc, is_in: !cc.is_in, ins_count: res.ins_count }
                          : cc
                      ),
                    }))
                  } catch {}
                }} />
              <div className="card-extra-actions">
                <button className="btn btn-sm btn-outline"
                  onClick={() => nav('/analytics', {
                    state: { cycleName: c.name, targetUser: user.username }
                  })}>
                  📊 Анализ
                </button>
              </div>
            </div>
          )) : (
            <div className="empty">
              <p>Нет публичных тренировок</p>
              <Link to="/workouts" className="btn btn-sm btn-primary mt-12">Мои тренировки</Link>
            </div>
          )}
        </div>
      )}

      {/* Notes as tweets */}
      {tab === 'notes' && (
        <div className="section">
          {notes.length > 0 ? notes.map(n => (
            <div className="tweet-card" key={n.id}>
              <div className="tweet-head">
                <div className="avatar">{user.username[0]}</div>
                <div className="tweet-author">
                  <span className="tweet-name">{user.username}</span>
                  <span className="tweet-time">{timeAgo(n.created_at)}</span>
                </div>
                <div className="dot-menu-wrap" style={{ marginLeft: 'auto' }}>
                  <button className="dot-menu-btn"
                    onClick={() => setMenuOpen(menuOpen === `n${n.id}` ? null : `n${n.id}`)}>⋮</button>
                  {menuOpen === `n${n.id}` && (
                    <div className="dot-menu-dropdown">
                      <button className="danger" onClick={() => deleteNote(n.name)}>Удалить</button>
                    </div>
                  )}
                </div>
              </div>
              <div className="tweet-body">{n.descriptions}</div>
              <div className="tweet-actions">
                <button className="comment-toggle-btn" onClick={() => toggleNoteComments(n.id)}>
                  💬 {(noteComments[n.id] || []).length || ''}
                </button>
              </div>
              {openComments[n.id] && (
                <div className="comments-section">
                  <form className="comment-form" onSubmit={(e) => submitNoteComment(e, n.id)}>
                    <input
                      className="comment-input"
                      placeholder="Комментарий..."
                      value={commentTexts[n.id] || ''}
                      onChange={e => setCommentTexts(prev => ({ ...prev, [n.id]: e.target.value }))}
                    />
                    <button type="submit" className="comment-send"
                      disabled={!(commentTexts[n.id] || '').trim()}>→</button>
                  </form>
                  {(noteComments[n.id] || []).length > 0 ? (noteComments[n.id]).map(c => (
                    <div className="comment-item" key={c.id}>
                      <Link to={`/user/${c.user}`} className="comment-user">{c.user}</Link>
                      <span className="comment-text">{c.text}</span>
                      {c.user === user.username && (
                        <button className="comment-del" onClick={() => deleteComment(c.id, n.id)}>×</button>
                      )}
                    </div>
                  )) : (
                    <div className="comment-empty">Нет комментариев</div>
                  )}
                </div>
              )}
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
            <Link to={f === user.username ? '/profile' : `/user/${f}`} key={f} className="user-list-item">
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
            <Link to={f === user.username ? '/profile' : `/user/${f}`} key={f} className="user-list-item">
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
