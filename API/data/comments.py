from sqlalchemy import Column, Integer, String, DateTime
from .db_session import Base
import datetime


class Comment(Base):
    __tablename__ = 'comments'

    id = Column(Integer, primary_key=True, index=True)
    user = Column(String(50), nullable=False, index=True)
    # target_type: 'cycle' or 'note'
    target_type = Column(String(10), nullable=False)
    target_id = Column(Integer, nullable=False, index=True)
    text = Column(String(500), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    def __repr__(self):
        return f"{self.user} → {self.target_type}#{self.target_id}"
