import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { get, post, auth } from '../api'
import WorkoutCard from '../components/WorkoutCard'
import { ArrowLeft, UserPlus, UserCheck, BarChart2, Loader2 } from 'lucide-react'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Avatar, AvatarFallback } from '../components/ui/Avatar'

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

  const toggleIn = async (cycle) => {
    const endpoint = cycle.is_in ? '/unlike_cycle/' : '/like_cycle/'
    try {
      const res = await post(endpoint, auth(user, { cycle_id: cycle.id }))
      setProfile(prev => ({
        ...prev,
        public_cycles: prev.public_cycles.map(c =>
          c.id === cycle.id
            ? { ...c, is_in: !c.is_in, ins_count: res.ins_count }
            : c
        ),
      }))
    } catch {}
  }

  // Redirect to own profile
  if (user?.username === username) {
    return <Navigate to="/profile" replace />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }
  
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground">Пользователь не найден</p>
      </div>
    )
  }

  const tabs = [
    { id: 'workouts', label: 'Тренировки' },
    { id: 'followers', label: 'Подписчики' },
    { id: 'following', label: 'Подписки' },
  ]

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button 
          className="p-2 rounded-full hover:bg-muted transition-colors"
          onClick={() => nav(-1)}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">{username}</h1>
      </div>

      {/* Profile card */}
      <Card className="mb-4">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="w-20 h-20">
              <AvatarFallback className="text-2xl">{username[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{username}</h2>
              {profile.bio && (
                <p className="text-sm text-muted-foreground mt-1">{profile.bio}</p>
              )}
              {user && (
                <Button
                  className="mt-3"
                  variant={isFollowing ? 'outline' : 'default'}
                  size="sm"
                  onClick={toggleFollow}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4 mr-1" />
                      Подписка
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-1" />
                      Подписаться
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 mt-6">
            <div className="text-center">
              <p className="text-xl font-bold">{profile.cycles_count || 0}</p>
              <p className="text-xs text-muted-foreground">тренировок</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">{profile.total_ins || 0}</p>
              <p className="text-xs text-muted-foreground">IN</p>
            </div>
            <button className="text-center hover:bg-muted rounded-lg py-1" onClick={() => setTab('followers')}>
              <p className="text-xl font-bold">{profile.followers_count || 0}</p>
              <p className="text-xs text-muted-foreground">подписчиков</p>
            </button>
            <button className="text-center hover:bg-muted rounded-lg py-1" onClick={() => setTab('following')}>
              <p className="text-xl font-bold">{profile.following_count || 0}</p>
              <p className="text-xs text-muted-foreground">подписок</p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex bg-muted rounded-xl p-1 mb-4">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id 
                ? 'bg-card shadow-sm text-foreground' 
                : 'text-muted-foreground'
            }`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Workouts tab */}
      {tab === 'workouts' && (
        <div>
          {profile.public_cycles?.length > 0 ? profile.public_cycles.map(c => (
            <div key={c.id}>
              <WorkoutCard cycle={c} showAuthor={false} onIn={user ? toggleIn : null} />
              {user && (
                <div className="flex justify-end -mt-2 mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => nav('/analytics', {
                      state: { cycleName: c.name, targetUser: username }
                    })}
                  >
                    <BarChart2 className="w-4 h-4 mr-1" />
                    Анализ
                  </Button>
                </div>
              )}
            </div>
          )) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Нет публичных тренировок</p>
            </div>
          )}
        </div>
      )}

      {/* Followers tab */}
      {tab === 'followers' && (
        <div className="space-y-2">
          {followers.length > 0 ? followers.map(f => (
            <Link 
              to={f === user?.username ? '/profile' : `/user/${f}`} 
              key={f} 
              className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border hover:bg-muted transition-colors"
            >
              <Avatar>
                <AvatarFallback>{f[0]}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{f}</span>
            </Link>
          )) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Нет подписчиков</p>
            </div>
          )}
        </div>
      )}

      {/* Following tab */}
      {tab === 'following' && (
        <div className="space-y-2">
          {following.length > 0 ? following.map(f => (
            <Link 
              to={f === user?.username ? '/profile' : `/user/${f}`} 
              key={f} 
              className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border hover:bg-muted transition-colors"
            >
              <Avatar>
                <AvatarFallback>{f[0]}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{f}</span>
            </Link>
          )) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Нет подписок</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
