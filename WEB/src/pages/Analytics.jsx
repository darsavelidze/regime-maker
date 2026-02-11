import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { post, auth } from '../api'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Card, CardContent } from '../components/ui/Card'

export default function Analytics() {
  const { user } = useAuth()
  const { state } = useLocation()
  const nav = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const cycleName = state?.cycleName || ''
  const targetUser = state?.targetUser || ''

  useEffect(() => {
    if (!cycleName) { setLoading(false); return }
    const endpoint = targetUser ? '/analytics_public/' : '/analytics/'
    const payload = targetUser
      ? auth(user, { cycle_name: cycleName, target_user: targetUser })
      : auth(user, { cycle_name: cycleName })
    post(endpoint, payload)
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [cycleName, targetUser, user])

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
        <div>
          <h1 className="text-lg font-bold">Анализ: {cycleName}</h1>
          {targetUser && <p className="text-sm text-muted-foreground">@{targetUser}</p>}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}
      
      {error && (
        <Card className="mb-4 border-destructive">
          <CardContent className="p-4 text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          {/* Muscle load */}
          {data.load_status && (
            <Card className="mb-4">
              <CardContent className="p-4">
                <h2 className="font-bold mb-4">Нагрузка на мышцы</h2>
                <div className="space-y-4">
                  {Object.entries(data.load_status).map(([muscle, info]) => (
                    <div key={muscle}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{muscle}</span>
                        <span className="text-muted-foreground">{info.pr}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(info.pr, 100)}%`,
                            backgroundColor: info.color || '#4caf50',
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{info.status}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {data.recommendations?.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h2 className="font-bold mb-4">Рекомендации</h2>
                <div className="space-y-2">
                  {data.recommendations.map((rec, i) => (
                    <div 
                      key={i} 
                      className="p-3 bg-muted rounded-lg text-sm"
                    >
                      {rec.message || rec}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!loading && !data && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted-foreground">Не указана тренировка для анализа</p>
        </div>
      )}
    </div>
  )
}
