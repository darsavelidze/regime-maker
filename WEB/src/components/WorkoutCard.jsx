import { Link } from 'react-router-dom'

const HeartOutline = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
)

const HeartFilled = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
)

export default function WorkoutCard({ cycle, onLike, showAuthor = true }) {
  return (
    <div className="card">
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
        {cycle.descriptions?.length > 0 && (
          <ul className="card-desc">
            {cycle.descriptions.map((d, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: d }} />
            ))}
          </ul>
        )}
      </div>
      {onLike && (
        <div className="card-actions">
          <button
            className={`like-btn ${cycle.is_liked ? 'liked' : ''}`}
            onClick={() => onLike(cycle)}
          >
            {cycle.is_liked ? <HeartFilled /> : <HeartOutline />}
            {cycle.likes_count}
          </button>
        </div>
      )}
    </div>
  )
}
