import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { post, auth } from '../api'

export default function WorkoutCard({ cycle, onIn, showAuthor = true, showDate = false }) {
  const { user } = useAuth()
  const [inUsers, setInUsers] = useState(null)
  const [showTooltip, setShowTooltip] = useState(false)
  const [comments, setComments] = useState([])
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const tooltipTimer = useRef(null)

  const handleMouseEnter = () => {
    tooltipTimer.current = setTimeout(async () => {
      try {
        const res = await post('/get_in_users/', { cycle_id: cycle.id })
        setInUsers(res.users || [])
        setShowTooltip(true)
      } catch {}
    }, 400)
  }

  const handleMouseLeave = () => {
    clearTimeout(tooltipTimer.current)
    setShowTooltip(false)
  }

  const loadComments = async () => {
    try {
      const res = await post('/get_comments/', { target_type: 'cycle', target_id: cycle.id })
      setComments(res.comments || [])
    } catch {}
  }

  const toggleComments = () => {
    if (!showComments) loadComments()
    setShowComments(!showComments)
  }

  const submitComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim() || !user) return
    try {
      await post('/create_comment/', auth(user, {
        target_type: 'cycle', target_id: cycle.id, text: commentText,
      }))
      setCommentText('')
      loadComments()
    } catch {}
  }

  const deleteComment = async (id) => {
    try {
      await post('/delete_comment/', auth(user, { comment_id: id }))
      loadComments()
    } catch {}
  }

  return (
    <div className="card">
      {showDate && cycle.start_at && (
        <div className="card-date">{cycle.start_at}</div>
      )}
      {showAuthor && cycle.author && (
        <div className="card-head">
          <div className="avatar">{cycle.author.username?.[0]}</div>
          <Link to={`/user/${cycle.author.username}`} className="card-user">
            {cycle.author.username}
          </Link>
        </div>
      )}
      <div className="card-body">
        <div className="card-title">{cycle.name}</div>
        <div className="card-meta">
          {cycle.days_count} дн · пауза {cycle.pause} дн
        </div>
        {cycle.original_author && (
          <div className="original-author">
            от <Link to={`/user/${cycle.original_author}`}>@{cycle.original_author}</Link>
          </div>
        )}
        {cycle.descriptions?.length > 0 && (
          <ul className="card-desc">
            {cycle.descriptions.map((d, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: d }} />
            ))}
          </ul>
        )}
      </div>
      <div className="card-actions">
        {onIn && (
          <div className="in-btn-wrap"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}>
            <button
              className={`in-btn ${cycle.is_in ? 'active' : ''}`}
              onClick={() => onIn(cycle)}
            >
              <span className="in-label">IN</span>
              <span className="in-count">{cycle.ins_count || 0}</span>
            </button>
            {showTooltip && inUsers && inUsers.length > 0 && (
              <div className="in-tooltip">
                {inUsers.slice(0, 10).map(u => (
                  <span key={u}>{u}</span>
                ))}
                {inUsers.length > 10 && <span>+{inUsers.length - 10}</span>}
              </div>
            )}
          </div>
        )}
        <button className="comment-toggle-btn" onClick={toggleComments}>
          💬
        </button>
      </div>

      {showComments && (
        <div className="comments-section">
          {user && (
            <form className="comment-form" onSubmit={submitComment}>
              <input
                className="comment-input"
                placeholder="Комментарий..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
              />
              <button type="submit" className="comment-send" disabled={!commentText.trim()}>→</button>
            </form>
          )}
          {comments.length > 0 ? comments.map(c => (
            <div className="comment-item" key={c.id}>
              <Link to={`/user/${c.user}`} className="comment-user">{c.user}</Link>
              <span className="comment-text">{c.text}</span>
              {user && c.user === user.username && (
                <button className="comment-del" onClick={() => deleteComment(c.id)}>×</button>
              )}
            </div>
          )) : (
            <div className="comment-empty">Нет комментариев</div>
          )}
        </div>
      )}
    </div>
  )
}
