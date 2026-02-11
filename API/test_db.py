"""Utility script to inspect the database contents."""

from data.db_session import create_session, global_init
from data.users import User
from data.cycles import Cycle
from data.notes import Note

global_init("db/db.db")


def show_all():
    db = create_session()
    try:
        print("=== Users ===")
        for user in db.query(User).all():
            print(f"  id={user.id}  username={user.username}  days_count={len(user.days) if user.days else 0}")

        print("\n=== Cycles ===")
        for cycle in db.query(Cycle).all():
            print(f"  id={cycle.id}  name={cycle.name}  user={cycle.user}  days={cycle.days_count}  pause={cycle.pause}")

        print("\n=== Notes ===")
        for note in db.query(Note).all():
            print(f"  id={note.id}  name={note.name}  user={note.user}")
    finally:
        db.close()


if __name__ == "__main__":
    show_all()
