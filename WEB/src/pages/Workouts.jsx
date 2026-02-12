import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { post, auth } from '../api'
import { MoreVertical, Globe, Lock, BarChart2, Trash2, Loader2, EyeOff } from 'lucide-react'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../components/ui/DropdownMenu'

export default function Workouts() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [cycles, setCycles] = useState([])
  const [loading, setLoading] = useState(true)

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
    try {
      await post('/delete_cycle/', auth(user, { cycle_name: name }))
      load()
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Мои тренировки</h1>
      
      {cycles.length > 0 ? cycles.map(c => (
        <Card className="mb-4" key={c.id}>
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <h3 className="font-bold text-base break-words">{c.name}</h3>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {c.days_count} дн · пауза {c.pause} дн{c.start_at ? ` · с ${c.start_at}` : ''}
                  </span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {c.is_public ? 'Публичная' : 'Приватная'}
                  </span>
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
                    onClick={() => nav('/analytics', { state: { cycleName: c.name } })}
                  >
                    <BarChart2 className="w-4 h-4 mr-2" />
                    Анализ
                  </DropdownMenuItem>
                  {!c.original_author && (
                    <DropdownMenuItem onClick={() => togglePublish(c)}>
                      {c.is_public ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-2" />
                          Скрыть
                        </>
                      ) : (
                        <>
                          <Globe className="w-4 h-4 mr-2" />
                          Опубликовать
                        </>
                      )}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={() => deleteCycle(c.name)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Удалить
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      )) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-medium mb-2">Нет тренировок</p>
          <Button onClick={() => nav('/create')}>
            Создать тренировку
          </Button>
        </div>
      )}
    </div>
  )
}
