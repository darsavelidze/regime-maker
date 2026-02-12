import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { post, auth } from '../api'
import { Card, CardContent } from './ui/Card'
import { Avatar, AvatarFallback } from './ui/Avatar'
import { MessageCircle } from 'lucide-react'
import CommentSection from './CommentSection'

export default function WorkoutCard({ cycle, onIn, showAuthor = true, showDate = false }) {
  const { user } = useAuth()
  const [inUsers, setInUsers] = useState(null)
  const [showTooltip, setShowTooltip] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)
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

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
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

        <div className="space-y-2 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className="font-bold text-lg break-words">{cycle.name}</h3>
            <p className="text-sm text-muted-foreground">
              {cycle.days_count} дн · пауза {cycle.pause} дн
              {cycle.start_at && ` · с ${cycle.start_at}`}
            </p>
          </div>
          
          {cycle.public !== undefined && (
            <p className="text-sm text-muted-foreground">
              {cycle.public ? 'Публичная' : 'Приватная'}
            </p>
          )}
          
          {cycle.original_author && (
            <p className="text-xs text-muted-foreground">
              от <Link to={`/user/${cycle.original_author}`} className="text-primary hover:underline">@{cycle.original_author}</Link>
            </p>
          )}
          
          {cycle.descriptions?.length > 0 && (
            <ul className="text-sm space-y-1 mt-3 pl-4 list-disc text-muted-foreground overflow-hidden">
              {cycle.descriptions.map((d, i) => (
                <li key={i} className="break-words" style={{ overflowWrap: 'anywhere' }} dangerouslySetInnerHTML={{ __html: d }} />
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
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm transition-colors"
            onClick={() => setCommentsOpen(prev => !prev)}
          >
            <MessageCircle className="w-5 h-5" />
          </button>
        </div>

        <CommentSection 
          targetType="cycle" 
          targetId={cycle.id} 
          isOpen={commentsOpen}
          onToggle={() => setCommentsOpen(prev => !prev)}
          renderButton={false}
        />
      </CardContent>
    </Card>
  )
}
