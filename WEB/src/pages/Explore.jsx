import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { post, auth } from '../api'
import WorkoutCard from '../components/WorkoutCard'
import { Search, X, Loader2 } from 'lucide-react'
import { Card, CardContent } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Avatar, AvatarFallback } from '../components/ui/Avatar'

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
    <div className="p-4">
      {/* Search bar */}
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            className="pl-12"
            placeholder="Поиск тренировок и пользователей..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </form>

      {/* Recent searches */}
      {!hasResults && !loading && recent.length > 0 && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium">Недавние</span>
              <Button variant="ghost" size="sm" onClick={doClean}>
                Очистить
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recent.map(q => (
                <button 
                  key={q} 
                  className="px-3 py-1.5 bg-muted rounded-full text-sm hover:bg-muted/80 transition-colors"
                  onClick={() => pickRecent(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search tabs */}
      {hasResults && !loading && (
        <div className="flex bg-muted rounded-xl p-1 mb-4">
          <button 
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              searchTab === 'workouts' 
                ? 'bg-card shadow-sm' 
                : 'text-muted-foreground'
            }`}
            onClick={() => setSearchTab('workouts')}
          >
            Тренировки {cycleResults?.length ? `(${cycleResults.length})` : ''}
          </button>
          <button 
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              searchTab === 'users' 
                ? 'bg-card shadow-sm' 
                : 'text-muted-foreground'
            }`}
            onClick={() => setSearchTab('users')}
          >
            Пользователи {userResults?.length ? `(${userResults.length})` : ''}
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Workout results */}
      {hasResults && !loading && searchTab === 'workouts' && (
        <div>
          {cycleResults.length > 0 ? (
            cycleResults.map(c => (
              <WorkoutCard key={c.id} cycle={c} onIn={toggleIn} />
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Тренировки не найдены</p>
            </div>
          )}
        </div>
      )}

      {/* User results */}
      {hasResults && !loading && searchTab === 'users' && (
        <div className="space-y-2">
          {userResults.length > 0 ? (
            userResults.map(u => (
              <Link 
                to={`/user/${u.username}`} 
                key={u.username} 
                className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border hover:bg-muted transition-colors"
              >
                <Avatar className="w-12 h-12">
                  <AvatarFallback>{u.username[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{u.username}</p>
                  {u.bio && <p className="text-sm text-muted-foreground truncate">{u.bio}</p>}
                  <p className="text-xs text-muted-foreground">
                    {u.cycles_count} тренировок · {u.followers_count} подписчиков
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Пользователи не найдены</p>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!hasResults && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-5xl mb-4">🔍</span>
          <p className="text-lg font-medium">Найдите тренировки и пользователей</p>
          <p className="text-muted-foreground">Нажмите Enter для поиска</p>
        </div>
      )}
    </div>
  )
}
