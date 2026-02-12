import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { post, get, auth } from '../api'
import { MoreVertical, LogOut, BarChart2, Loader2, Trash2, Check, X, EyeOff, MessageCircle } from 'lucide-react'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Avatar, AvatarFallback } from '../components/ui/Avatar'
import { Textarea } from '../components/ui/Input'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../components/ui/DropdownMenu'
import CommentSection from '../components/CommentSection'

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
  const [openComments, setOpenComments] = useState({})

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
    try {
      await post('/delete_note/', auth(user, { note_name: name }))
      load()
    } catch {}
  }

  const doLogout = () => { logout(); nav('/login') }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

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

  const tabs = [
    { id: 'workouts', label: 'Тренировки' },
    { id: 'notes', label: 'Заметки' },
    { id: 'followers', label: 'Подписчики' },
    { id: 'following', label: 'Подписки' },
  ]

  return (
    <div className="p-4">
      {/* Header */}
      <Card className="mb-4">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20 flex-shrink-0">
              <AvatarFallback className="text-2xl">{user.username[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold">{user.username}</h2>
              {editBio ? (
                <div className="mt-2 space-y-2">
                  <Textarea 
                    value={bio} 
                    onChange={e => setBio(e.target.value)}
                    placeholder="О себе..." 
                    className="min-h-[80px]"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveBio}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditBio(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <p 
                  className="text-sm text-muted-foreground mt-1 cursor-pointer hover:text-foreground"
                  onClick={() => setEditBio(true)}
                >
                  {profile?.bio || 'Нажмите, чтобы добавить описание...'}
                </p>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={doLogout} className="flex-shrink-0">
              <LogOut className="w-4 h-4 mr-1" />
              Выйти
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 mt-6">
            <div className="text-center py-1">
              <p className="text-xl font-bold">{profile?.cycles_count || 0}</p>
              <p className="text-xs text-muted-foreground">тренировок</p>
            </div>
            <div className="text-center py-1">
              <p className="text-xl font-bold">{profile?.total_ins || 0}</p>
              <p className="text-xs text-muted-foreground">IN</p>
            </div>
            <button className="text-center hover:bg-muted rounded-lg py-1" onClick={() => setTab('followers')}>
              <p className="text-xl font-bold">{profile?.followers_count || 0}</p>
              <p className="text-xs text-muted-foreground">подписчиков</p>
            </button>
            <button className="text-center hover:bg-muted rounded-lg py-1" onClick={() => setTab('following')}>
              <p className="text-xl font-bold">{profile?.following_count || 0}</p>
              <p className="text-xs text-muted-foreground">подписок</p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex bg-muted rounded-xl p-1 mb-4 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
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

      {/* Public workouts */}
      {tab === 'workouts' && (
        <div className="space-y-4">
          {profile?.public_cycles?.length > 0 ? profile.public_cycles.map(c => (
            <Card key={c.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <h3 className="font-bold text-base break-words">
                        {c.name}{c.ins_count ? ` (${c.ins_count})` : ''}
                      </h3>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {c.days_count} дн · пауза {c.pause} дн{c.start_at ? ` · с ${c.start_at}` : ''}
                      </span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">Публичная</span>
                    </div>
                    
                    {c.original_author && (
                      <p className="text-xs text-muted-foreground mt-1">
                        от <Link to={`/user/${c.original_author}`} className="text-primary hover:underline">@{c.original_author}</Link>
                      </p>
                    )}
                    
                    {c.descriptions?.length > 0 && (
                      <ul className="text-sm space-y-0.5 mt-2 pl-4 list-disc text-muted-foreground overflow-hidden">
                        {c.descriptions.map((d, i) => (
                          <li key={i} className="break-words" style={{ overflowWrap: 'anywhere' }} dangerouslySetInnerHTML={{ __html: d }} />
                        ))}
                      </ul>
                    )}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 rounded-full hover:bg-muted flex-shrink-0">
                        <MoreVertical className="w-5 h-5 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => nav('/analytics', {
                          state: { cycleName: c.name, targetUser: user.username }
                        })}
                      >
                        <BarChart2 className="w-4 h-4 mr-2" />
                        Анализ
                      </DropdownMenuItem>
                      {!c.original_author && (
                        <DropdownMenuItem
                          onClick={async () => {
                            try {
                              await post('/unpublish_cycle/', auth(user, { cycle_name: c.name }))
                              load()
                            } catch {}
                          }}
                        >
                          <EyeOff className="w-4 h-4 mr-2" />
                          Скрыть
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={async () => {
                          if (!confirm('Удалить тренировку?')) return
                          try {
                            await post('/delete_cycle/', auth(user, { cycle_name: c.name }))
                            load()
                          } catch {}
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Удалить
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
                  <button
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all ${
                      c.is_in 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                    onClick={async () => {
                      const endpoint = c.is_in ? '/unlike_cycle/' : '/like_cycle/'
                      try {
                        const res = await post(endpoint, auth(user, { cycle_id: c.id }))
                        setProfile(prev => ({
                          ...prev,
                          public_cycles: prev.public_cycles.map(cc =>
                            cc.id === c.id
                              ? { ...cc, is_in: !cc.is_in, ins_count: res.ins_count }
                              : cc
                          ),
                        }))
                      } catch {}
                    }}
                  >
                    <span>IN</span>
                    {(c.ins_count || 0) > 0 && <span>{c.ins_count}</span>}
                  </button>
                  
                  <button
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm transition-colors"
                    onClick={() => setOpenComments(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                  >
                    <MessageCircle className="w-5 h-5" />
                  </button>
                </div>

                <CommentSection 
                  targetType="cycle" 
                  targetId={c.id} 
                  isOpen={openComments[c.id] || false}
                  onToggle={() => setOpenComments(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                  renderButton={false}
                />
              </CardContent>
            </Card>
          )) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Нет публичных тренировок</p>
              <Link to="/workouts">
                <Button size="sm">Мои тренировки</Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {tab === 'notes' && (
        <div className="space-y-4">
          {notes.length > 0 ? notes.map(n => (
            <Card key={n.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback>{user.username[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{user.username}</span>
                      <span className="text-xs text-muted-foreground">{timeAgo(n.created_at)}</span>
                    </div>
                    <p className="mt-2 text-sm">{n.descriptions}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 rounded-full hover:bg-muted">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => deleteNote(n.name)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Удалить
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <CommentSection targetType="note" targetId={n.id} />
              </CardContent>
            </Card>
          )) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Нет заметок</p>
            </div>
          )}
        </div>
      )}

      {/* Followers */}
      {tab === 'followers' && (
        <div className="space-y-2">
          {followers.length > 0 ? followers.map(f => (
            <Link
              to={f === user.username ? '/profile' : `/user/${f}`}
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

      {/* Following */}
      {tab === 'following' && (
        <div className="space-y-2">
          {following.length > 0 ? following.map(f => (
            <Link
              to={f === user.username ? '/profile' : `/user/${f}`}
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
