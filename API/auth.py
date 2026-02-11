from passlib.context import CryptContext
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from data.users import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against a stored hash.
    Falls back to plaintext comparison for legacy passwords.
    """
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        # Legacy plaintext passwords
        return plain_password == hashed_password


def authenticate_user(username: str, password: str, db: Session) -> User:
    """
    Authenticate a user by username and password.
    Returns the User object on success, raises HTTPException on failure.
    """
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="This user does not exist.",
        )
    if not verify_password(password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password.",
        )
    return user
