import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { post, auth } from '../api'
import WorkoutCard from '../components/WorkoutCard'
import { Loader2 } from 'lucide-react'

export default function Feed() {
  const { user } = useAuth()
  const [cycles, setCycles] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const data = await post('/feed/', auth(user))
      setCycles(data.cycles || [])
    } catch { setCycles([]) }
    finally { setLoading(false) }
  }, [user])

  useEffect(() => { load() }, [load])

  const toggleIn = async (cycle) => {
    const endpoint = cycle.is_in ? '/unlike_cycle/' : '/like_cycle/'
    try {
      const res = await post(endpoint, auth(user, { cycle_id: cycle.id }))
      setCycles(prev => prev.map(c =>
        c.id === cycle.id
          ? { ...c, is_in: !c.is_in, ins_count: res.ins_count }
          : c
      ))
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!cycles.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <span className="text-5xl mb-4">📭</span>
        <p className="text-lg font-medium">Лента пуста</p>
        <p className="text-muted-foreground">Подпишитесь на пользователей или исследуйте тренировки</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      {cycles.map(c => (
        <WorkoutCard key={c.id} cycle={c} onIn={toggleIn} showDate />
      ))}
    </div>
  )
}
