import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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

  const load = useCallback(async () => {
    try {
      const prof = await get(`/profile/${username}/`)
      setProfile(prof)
      if (user && user.username !== username) {
        const f = await get(`/followers/${username}/`)
        setIsFollowing((f.followers || []).includes(user.username))
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

  if (loading) return <div className="spinner">Загрузка...</div>
  if (!profile) return <div className="empty"><p>Пользователь не найден</p></div>

  const isOwn = user?.username === username

  return (
    <div>
      <div className="page-head">
        <button className="back-btn" onClick={() => nav(-1)}>←</button>
        <h1>{username}</h1>
      </div>

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

      <div className="prof-stats">
        <div className="prof-stat">
          <span className="n">{profile.cycles_count}</span>
          <span className="l">тренировок</span>
        </div>
        <div className="prof-stat">
          <span className="n">{profile.public_cycles_count}</span>
          <span className="l">публичных</span>
        </div>
        <div className="prof-stat">
          <span className="n">{profile.followers_count}</span>
          <span className="l">подписчиков</span>
        </div>
        <div className="prof-stat">
          <span className="n">{profile.following_count}</span>
          <span className="l">подписок</span>
        </div>
      </div>

      {profile.public_cycles?.length > 0 ? (
        <div style={{ padding: '12px 0' }}>
          {profile.public_cycles.map(c => (
            <WorkoutCard key={c.id} cycle={c} showAuthor={false}
              onLike={user ? toggleLike : null} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <p>Нет публичных тренировок</p>
        </div>
      )}
    </div>
  )
}
