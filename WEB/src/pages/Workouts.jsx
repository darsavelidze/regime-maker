import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { post, auth } from '../api'
import { MoreVertical, Globe, Lock, BarChart2, Trash2, Loader2 } from 'lucide-react'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
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
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-lg">{c.name}</h3>
                <Badge variant={c.is_public ? 'success' : 'muted'}>
                  {c.is_public ? 'Публичная' : 'Приватная'}
                </Badge>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 rounded-full hover:bg-muted">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
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
            
            <p className="text-sm text-muted-foreground mb-2">
              {c.days_count} дн · пауза {c.pause} дн · с {c.start_at}
            </p>
            
            {c.original_author && (
              <p className="text-xs text-muted-foreground mb-2">
                от <Link to={`/user/${c.original_author}`} className="text-primary hover:underline">@{c.original_author}</Link>
              </p>
            )}
            
            {c.descriptions?.length > 0 && (
              <ul className="text-sm space-y-1 mt-3 pl-4 list-disc text-muted-foreground">
                {c.descriptions.map((d, i) => (
                  <li key={i} dangerouslySetInnerHTML={{ __html: d }} />
                ))}
              </ul>
            )}
            
            <div className="flex gap-2 mt-4 pt-4 border-t border-border">
              {!c.original_author && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => togglePublish(c)}
                >
                  {c.is_public ? (
                    <>
                      <Lock className="w-4 h-4 mr-1" />
                      Скрыть
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4 mr-1" />
                      Опубликовать
                    </>
                  )}
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => nav('/analytics', { state: { cycleName: c.name } })}
              >
                <BarChart2 className="w-4 h-4 mr-1" />
                Анализ
              </Button>
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
