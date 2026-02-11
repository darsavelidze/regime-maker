import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { post, auth } from '../api'

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
    <div>
      <div className="page-head">
        <button className="back-btn" onClick={() => nav(-1)}>←</button>
        <h1>Анализ: {cycleName}{targetUser ? ` (@${targetUser})` : ''}</h1>
      </div>

      {loading && <div className="spinner">Загрузка...</div>}
      {error && <div className="error" style={{ padding: 16 }}>{error}</div>}

      {data && (
        <div className="section">
          {/* Muscle load */}
          {data.load_status && (
            <>
              <div className="section-title">Нагрузка на мышцы</div>
              {Object.entries(data.load_status).map(([muscle, info]) => (
                <div className="muscle-item" key={muscle}>
                  <div className="muscle-name">
                    <span>{muscle}</span>
                    <span>{info.pr}%</span>
                  </div>
                  <div className="bar-bg">
                    <div className="bar-fill"
                      style={{
                        width: `${Math.min(info.pr, 100)}%`,
                        background: info.color || '#4caf50',
                      }}
                    />
                  </div>
                  <div className="muscle-status">{info.status}</div>
                </div>
              ))}
            </>
          )}

          {/* Recommendations */}
          {data.recommendations?.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div className="section-title">Рекомендации</div>
              {data.recommendations.map((rec, i) => (
                <div className="rec-item" key={i}>
                  {rec.message || rec}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && !data && !error && (
        <div className="empty">
          <p>Не указана тренировка для анализа</p>
        </div>
      )}
    </div>
  )
}
