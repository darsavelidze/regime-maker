from sqlalchemy import Column, Integer, String, DateTime, JSON
from .db_session import Base
import datetime


class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password = Column(String(255))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    days = Column(JSON)
    bio = Column(String(500), default="")

    def __str__(self):
        return self.username

    def __repr__(self):
        return self.username
