import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { post, auth } from '../api'
import { MessageCircle } from 'lucide-react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'

const PREVIEW_COUNT = 2

export default function CommentSection({ targetType, targetId, isOpen: controlledOpen, onToggle, renderButton = true }) {
  const { user } = useAuth()
  const [comments, setComments] = useState([])
  const [internalOpen, setInternalOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [count, setCount] = useState(0)

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen

  const loadComments = useCallback(async () => {
    try {
      const res = await post('/get_comments/', { target_type: targetType, target_id: targetId })
      const list = res.comments || []
      setComments(list)
      setCount(list.length)
    } catch {}
  }, [targetType, targetId])

  // Load comments when isOpen becomes true (for controlled mode)
  useEffect(() => {
    if (isOpen && comments.length === 0) {
      loadComments()
    }
  }, [isOpen, loadComments, comments.length])

  const toggle = () => {
    if (!isOpen) {
      loadComments()
      setShowAll(false)
    }
    if (onToggle) {
      onToggle()
    } else {
      setInternalOpen(prev => !prev)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || !user || submitting) return
    setSubmitting(true)
    try {
      await post('/create_comment/', auth(user, {
        target_type: targetType,
        target_id: targetId,
        text: trimmed,
      }))
      setText('')
      await loadComments()
    } catch {}
    finally { setSubmitting(false) }
  }

  const remove = async (commentId) => {
    try {
      await post('/delete_comment/', auth(user, { comment_id: commentId }))
      await loadComments()
    } catch {}
  }

  const visible = showAll ? comments : comments.slice(0, PREVIEW_COUNT)
  const hasMore = comments.length > PREVIEW_COUNT && !showAll

  return (
    <>
      {/* Toggle button - only render if renderButton is true */}
      {renderButton && (
        <div className="mt-3 pt-3 border-t border-border">
          <button
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm transition-colors"
            onClick={toggle}
          >
            <MessageCircle className="w-4 h-4" />
            <span>{count > 0 ? count : ''}</span>
          </button>
        </div>
      )}

      {/* Comment panel */}
      {isOpen && (
        <div className="mt-3 space-y-3">
          {/* Comments list */}
          {visible.length > 0 ? (
            <div className="space-y-2.5">
              {visible.map(c => (
                <div className="flex items-start gap-2" key={c.id}>
                  <Link
                    to={`/user/${c.user}`}
                    className="font-medium text-sm hover:underline flex-shrink-0"
                  >
                    {c.user}
                  </Link>
                  <span className="text-sm flex-1 break-words" style={{ overflowWrap: 'anywhere' }}>
                    {c.text}
                  </span>
                  {user && c.user === user.username && (
                    <button
                      className="text-muted-foreground hover:text-destructive text-sm flex-shrink-0 leading-none"
                      onClick={() => remove(c.id)}
                      title="Удалить"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">Нет комментариев</p>
          )}

          {/* Show all button */}
          {hasMore && (
            <button
              className="text-sm text-primary hover:underline"
              onClick={() => setShowAll(true)}
            >
              Показать все ({comments.length})
            </button>
          )}

          {/* Input form */}
          {user && (
            <form className="flex gap-2" onSubmit={submit}>
              <Input
                className="flex-1"
                placeholder="Комментарий..."
                value={text}
                onChange={e => setText(e.target.value)}
              />
              <Button
                type="submit"
                size="sm"
                disabled={!text.trim() || submitting}
              >
                →
              </Button>
            </form>
          )}
        </div>
      )}
    </>
  )
}
