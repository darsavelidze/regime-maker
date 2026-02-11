import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { get, post, auth } from '../api'
import WorkoutCard from '../components/WorkoutCard'

export default function UserProfile() {
  const { username } = useParams()
  const { user } = useAuth()
  const nav = useNavigate()
  const [profile, setProfile] = useState(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('workouts')
  const [followers, setFollowers] = useState([])
  const [following, setFollowing] = useState([])
  const [cloneMsg, setCloneMsg] = useState('')

  const load = useCallback(async () => {
    try {
      const [prof, fData, fgData] = await Promise.all([
        get(`/profile/${username}/`),
        get(`/followers/${username}/`),
        get(`/following/${username}/`),
      ])
      setProfile(prof)
      setFollowers(fData.followers || [])
      setFollowing(fgData.following || [])
      if (user && user.username !== username) {
        setIsFollowing((fData.followers || []).includes(user.username))
      }
    } catch {}
    finally { setLoading(false) }
  }, [username, user])

  useEffect(() => { load() }, [load])

  const toggleFollow = async () => {
    const endpoint = isFollowing ? '/unfollow/' : '/follow/'
    try {
      await post(endpoint, auth(user, { target_user: username }))
      setIsFollowing(!isFollowing)
      load()
    } catch {}
  }

  const toggleLike = async (cycle) => {
    const endpoint = cycle.is_liked ? '/unlike_cycle/' : '/like_cycle/'
    try {
      const res = await post(endpoint, auth(user, { cycle_id: cycle.id }))
      setProfile(prev => ({
        ...prev,
        public_cycles: prev.public_cycles.map(c =>
          c.id === cycle.id
            ? { ...c, is_liked: !c.is_liked, likes_count: res.likes_count }
            : c
        ),
      }))
    } catch {}
  }

  const cloneCycle = async (cycle) => {
    const today = new Date().toISOString().split('T')[0]
    try {
      const res = await post('/clone_cycle/', auth(user, {
        cycle_id: cycle.id,
        start_at: today,
      }))
      setCloneMsg(res.verdict || 'Добавлено!')
      setTimeout(() => setCloneMsg(''), 3000)
    } catch (err) {
      setCloneMsg(err.message || 'Ошибка')
      setTimeout(() => setCloneMsg(''), 3000)
    }
  }

  if (loading) return <div className="spinner">Загрузка...</div>
  if (!profile) return <div className="empty"><p>Пользователь не найден</p></div>

  const isOwn = user?.username === username

  return (
    <div>
      <div className="page-head">
        <button className="back-btn" onClick={() => nav(-1)}>←</button>
        <h1>{username}</h1>
      </div>

      {/* Profile header */}
      <div className="prof-head">
        <div className="avatar avatar-lg">{username[0]}</div>
        <div className="prof-info">
          <div className="prof-name">{username}</div>
          {profile.bio && <div className="prof-bio">{profile.bio}</div>}
          {!isOwn && user && (
            <button
              className={`btn ${isFollowing ? 'btn-following' : 'btn-follow'}`}
              onClick={toggleFollow}
              style={{ marginTop: 8 }}
            >
              {isFollowing ? '✓ Подписка' : '+ Подписаться'}
            </button>
          )}
          {isOwn && (
            <button className="btn btn-sm btn-outline" onClick={() => nav('/profile')}
              style={{ marginTop: 8 }}>
              Мой профиль →
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="prof-stats">
        <div className="prof-stat">
          <span className="n">{profile.cycles_count || 0}</span>
          <span className="l">тренировок</span>
        </div>
        <div className="prof-stat">
          <span className="n">{profile.total_likes || 0}</span>
          <span className="l">лайков</span>
        </div>
        <div className="prof-stat clickable" onClick={() => setTab('followers')}>
          <span className="n">{profile.followers_count || 0}</span>
          <span className="l">подписчиков</span>
        </div>
        <div className="prof-stat clickable" onClick={() => setTab('following')}>
          <span className="n">{profile.following_count || 0}</span>
          <span className="l">подписок</span>
        </div>
      </div>

      {/* Clone success toast */}
      {cloneMsg && (
        <div className="toast">{cloneMsg}</div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${tab === 'workouts' ? 'active' : ''}`}
          onClick={() => setTab('workouts')}>Тренировки</button>
        <button className={`tab ${tab === 'followers' ? 'active' : ''}`}
          onClick={() => setTab('followers')}>Подписчики</button>
        <button className={`tab ${tab === 'following' ? 'active' : ''}`}
          onClick={() => setTab('following')}>Подписки</button>
      </div>

      {/* Workouts tab */}
      {tab === 'workouts' && (
        <div className="section">
          {profile.public_cycles?.length > 0 ? profile.public_cycles.map(c => (
            <div key={c.id}>
              <WorkoutCard cycle={c} showAuthor={false}
                onLike={user ? toggleLike : null} />
              {!isOwn && user && (
                <div className="card-extra-actions">
                  <button className="btn btn-sm btn-outline"
                    onClick={() => cloneCycle(c)}>
                    📥 Добавить к себе
                  </button>
                  <button className="btn btn-sm btn-outline"
                    onClick={() => nav('/analytics', {
                      state: { cycleName: c.name, targetUser: username }
                    })}>
                    📊 Анализ
                  </button>
                </div>
              )}
            </div>
          )) : (
            <div className="empty">
              <p>Нет публичных тренировок</p>
            </div>
          )}
        </div>
      )}

      {/* Followers tab */}
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

      {/* Following tab */}
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
    </div>
  )
}
