from sqlalchemy import Column, Integer, String, DateTime, UniqueConstraint
from .db_session import Base
import datetime


class Like(Base):
    __tablename__ = 'likes'

    id = Column(Integer, primary_key=True, index=True)
    user = Column(String(50), nullable=False, index=True)
    cycle_id = Column(Integer, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('user', 'cycle_id', name='uq_like'),
    )

    def __repr__(self):
        return f"{self.user} ♥ cycle#{self.cycle_id}"
