import { Link } from 'react-router-dom'

export default function WorkoutCard({ cycle, onIn, showAuthor = true, showDate = false }) {
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
      {onIn && (
        <div className="card-actions">
          <button
            className={`in-btn ${cycle.is_in ? 'active' : ''}`}
            onClick={() => onIn(cycle)}
          >
            <span className="in-label">IN</span>
            <span className="in-count">{cycle.ins_count || 0}</span>
          </button>
        </div>
      )}
    </div>
  )
}
