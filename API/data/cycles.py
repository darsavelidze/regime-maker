from sqlalchemy import Column, Integer, String, DateTime, JSON
from .db_session import Base
import datetime


class Cycle(Base):
    __tablename__ = 'cycles'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    user = Column(String(50), nullable=False)
    days_count = Column(Integer)
    descriptions = Column(JSON)
    data = Column(JSON)
    pause = Column(Integer)
    start_at = Column(String(50))
    is_public = Column(Integer, default=0)
    original_author = Column(String(50), default="")

    def __str__(self):
        return self.name

    def __repr__(self):
        return self.name
