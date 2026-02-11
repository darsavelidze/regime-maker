import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { post, auth } from '../api'
import { MessageCircle } from 'lucide-react'
import { Card, CardContent } from './ui/Card'
import { Avatar, AvatarFallback } from './ui/Avatar'
import { Button } from './ui/Button'
import { Input } from './ui/Input'

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
    <Card className="mb-4">
      <CardContent className="p-4">
        {showDate && cycle.start_at && (
          <div className="text-xs text-muted-foreground mb-2">{cycle.start_at}</div>
        )}
        
        {showAuthor && cycle.author && (
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback>{cycle.author.username?.[0]}</AvatarFallback>
            </Avatar>
            <Link 
              to={`/user/${cycle.author.username}`} 
              className="font-medium hover:underline"
            >
              {cycle.author.username}
            </Link>
          </div>
        )}

        <div className="space-y-2">
          <h3 className="font-bold text-lg">{cycle.name}</h3>
          <p className="text-sm text-muted-foreground">
            {cycle.days_count} дн · пауза {cycle.pause} дн
          </p>
          
          {cycle.original_author && (
            <p className="text-xs text-muted-foreground">
              от <Link to={`/user/${cycle.original_author}`} className="text-primary hover:underline">@{cycle.original_author}</Link>
            </p>
          )}
          
          {cycle.descriptions?.length > 0 && (
            <ul className="text-sm space-y-1 mt-3 pl-4 list-disc text-muted-foreground">
              {cycle.descriptions.map((d, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: d }} />
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
          {onIn && (
            <div 
              className="relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all ${
                  cycle.is_in 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
                onClick={() => onIn(cycle)}
              >
                <span>IN</span>
                <span>{cycle.ins_count || 0}</span>
              </button>
              
              {showTooltip && inUsers && inUsers.length > 0 && (
                <div className="absolute left-0 bottom-full mb-2 bg-card border border-border rounded-lg p-2 shadow-lg z-10 min-w-[120px]">
                  {inUsers.slice(0, 10).map(u => (
                    <span key={u} className="block text-xs py-0.5">{u}</span>
                  ))}
                  {inUsers.length > 10 && <span className="text-xs text-muted-foreground">+{inUsers.length - 10}</span>}
                </div>
              )}
            </div>
          )}
          
          <button 
            className="p-2 rounded-full hover:bg-muted transition-colors"
            onClick={toggleComments}
          >
            <MessageCircle className="w-5 h-5" />
          </button>
        </div>

        {showComments && (
          <div className="mt-4 pt-4 border-t border-border space-y-3">
            {user && (
              <form className="flex gap-2" onSubmit={submitComment}>
                <Input
                  className="flex-1"
                  placeholder="Комментарий..."
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                />
                <Button type="submit" size="sm" disabled={!commentText.trim()}>→</Button>
              </form>
            )}
            
            {comments.length > 0 ? comments.map(c => (
              <div className="flex items-start gap-2" key={c.id}>
                <Link to={`/user/${c.user}`} className="font-medium text-sm hover:underline">{c.user}</Link>
                <span className="text-sm flex-1">{c.text}</span>
                {user && c.user === user.username && (
                  <button 
                    className="text-muted-foreground hover:text-destructive text-sm"
                    onClick={() => deleteComment(c.id)}
                  >×</button>
                )}
              </div>
            )) : (
              <p className="text-sm text-muted-foreground text-center py-2">Нет комментариев</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
