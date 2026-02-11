from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm import Session

Base = declarative_base()
factory = None


def global_init(db_file: str):
    global factory

    if factory:
        return

    if not db_file or not db_file.strip():
        raise Exception("Database file path is required.")

    conn_str = f'sqlite:///{db_file.strip()}?check_same_thread=False'

    engine = create_engine(conn_str, echo=False)
    factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    from . import __all_models

    Base.metadata.create_all(bind=engine)
    _run_migrations(engine)


def _run_migrations(engine):
    """Add new columns to existing tables (safe to run multiple times)."""
    from sqlalchemy import text
    migrations = [
        "ALTER TABLE users ADD COLUMN bio TEXT DEFAULT ''",
        "ALTER TABLE cycles ADD COLUMN is_public INTEGER DEFAULT 0",
    ]
    with engine.connect() as conn:
        for sql in migrations:
            try:
                conn.execute(text(sql))
                conn.commit()
            except Exception:
                pass


def create_session() -> Session:
    global factory
    return factory()
