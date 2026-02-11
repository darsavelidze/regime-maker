from sqlalchemy import Column, Integer, String, DateTime, UniqueConstraint
from .db_session import Base
import datetime


class Follow(Base):
    __tablename__ = 'follows'

    id = Column(Integer, primary_key=True, index=True)
    follower = Column(String(50), nullable=False, index=True)
    following = Column(String(50), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('follower', 'following', name='uq_follow'),
    )

    def __repr__(self):
        return f"{self.follower} → {self.following}"
