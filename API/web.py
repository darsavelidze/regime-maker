import json
import datetime
import logging

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import uvicorn

from data import db_session
from data.users import User
from data.cycles import Cycle
from data.notes import Note
from data.follows import Follow
from data.likes import Like
from data.muscles import MUSCLE_GROUPS
from schemas import (
    UserAuth,
    SignUpRequest,
    CycleCreate,
    CycleDelete,
    UserCyclesRequest,
    DayRequest,
    DutyRequest,
    NoteCreate,
    NoteDelete,
    NotesRequest,
    AnalyticsRequest,
    PublishCycleRequest,
    FollowRequest,
    LikeCycleRequest,
    UpdateProfileRequest,
    FeedRequest,
    SearchRequest,
    MonthRequest,
    CloneCycleRequest,
    AnalyticsPublicRequest,
    CommentCreate,
    CommentDelete,
    CommentsRequest,
    InUsersRequest,
)
from data.comments import Comment
import calendar as cal_mod
from auth import hash_password, authenticate_user

# --------------- Logging ---------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("regime-maker")

# --------------- App ---------------

app = FastAPI(title="IN API", version="4.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
db_session.global_init("db/db.db")


# --------------- Exception Handlers ---------------


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    errors = exc.errors()
    msg = errors[0].get("msg", "Validation error") if errors else "Validation error"
    return JSONResponse(status_code=422, content={"error": msg})


# --------------- Dependencies ---------------


def get_db():
    session = db_session.create_session()
    try:
        yield session
    finally:
        session.close()


# --------------- Helpers ---------------


def _cycle_to_dict(cycle: Cycle, db: Session, current_user: str = "") -> dict:
    """Convert a Cycle ORM object to a response dict with social stats."""
    ins_count = db.query(Like).filter(Like.cycle_id == cycle.id).count()
    is_in = False
    if current_user:
        is_in = (
            db.query(Like)
            .filter(Like.cycle_id == cycle.id, Like.user == current_user)
            .first()
            is not None
        )
    return {
        "id": cycle.id,
        "name": cycle.name,
        "user": cycle.user,
        "days_count": cycle.days_count,
        "pause": cycle.pause,
        "descriptions": cycle.descriptions,
        "data": cycle.data,
        "start_at": cycle.start_at,
        "is_public": bool(getattr(cycle, "is_public", 0)),
        "original_author": getattr(cycle, "original_author", "") or "",
        "ins_count": ins_count,
        "is_in": is_in,
        "author": {
            "username": cycle.user,
            "bio": "",
            "followers_count": 0,
        },
    }


def _cycles_to_dicts(cycles: list, db: Session, current_user: str = "") -> list:
    """Batch-convert cycles with optimized queries."""
    from sqlalchemy import func
    if not cycles:
        return []
    cycle_ids = [c.id for c in cycles]
    # Batch count likes
    counts = dict(
        db.query(Like.cycle_id, func.count(Like.id))
        .filter(Like.cycle_id.in_(cycle_ids))
        .group_by(Like.cycle_id)
        .all()
    )
    # Batch check user's likes
    user_likes = set()
    if current_user:
        user_likes = {
            row.cycle_id for row in
            db.query(Like.cycle_id)
            .filter(Like.cycle_id.in_(cycle_ids), Like.user == current_user)
            .all()
        }
    result = []
    for c in cycles:
        result.append({
            "id": c.id,
            "name": c.name,
            "user": c.user,
            "days_count": c.days_count,
            "pause": c.pause,
            "descriptions": c.descriptions,
            "data": c.data,
            "start_at": c.start_at,
            "is_public": bool(getattr(c, "is_public", 0)),
            "original_author": getattr(c, "original_author", "") or "",
            "ins_count": counts.get(c.id, 0),
            "is_in": c.id in user_likes,
            "author": {"username": c.user, "bio": "", "followers_count": 0},
        })
    return result


# ======================== AUTH ========================


@app.get("/")
def index():
    return {"message": "Hello World"}


@app.post("/user/")
async def user(body: UserAuth, db: Session = Depends(get_db)):
    """Verify that a user exists and credentials are valid."""
    authenticate_user(body.username, body.password, db)
    logger.info("User login: %s", body.username)
    return {"verdict": "This user exists."}


@app.post("/sign_up/")
async def sign_up(body: SignUpRequest, db: Session = Depends(get_db)):
    """Register a new user with a hashed password."""
    existing = db.query(User).filter(User.username == body.username).first()
    if existing:
        raise HTTPException(status_code=409, detail="This name is already taken.")
    new_user = User(
        username=body.username,
        password=hash_password(body.password),
        days={},
        bio="",
    )
    db.add(new_user)
    db.commit()
    logger.info("New user registered: %s", body.username)
    return {"verdict": f"You successful sign up with username: {body.username}."}


# ======================== CYCLES ========================


@app.post("/create_cycle/")
async def create_cycle(body: CycleCreate, db: Session = Depends(get_db)):
    """Create a new training cycle for the user."""
    try:
        datetime.datetime.strptime(body.start_at, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid start_at date format. Use YYYY-MM-DD.")
    if body.days_count != len(body.descriptions):
        raise HTTPException(status_code=400, detail="Invalid count elements in descriptions.")
    authenticate_user(body.user, body.password, db)
    if db.query(Cycle).filter(Cycle.user == body.user, Cycle.name == body.name).first():
        raise HTTPException(status_code=409, detail="You already have this cycle name.")
    new_cycle = Cycle(
        name=body.name,
        user=body.user,
        days_count=body.days_count,
        pause=body.pause,
        descriptions=body.descriptions,
        data=body.data_cycle,
        start_at=body.start_at,
        is_public=0,
    )
    db.add(new_cycle)
    db.commit()
    logger.info("Cycle created: %s by %s", body.name, body.user)
    return {"verdict": f"You successful create new cycle with name: {body.name}"}


@app.post("/delete_cycle/")
async def delete_cycle(body: CycleDelete, db: Session = Depends(get_db)):
    """Delete a training cycle and its associated likes."""
    authenticate_user(body.user, body.password, db)
    cycle = db.query(Cycle).filter(Cycle.user == body.user, Cycle.name == body.cycle_name).first()
    if not cycle:
        user_cycles = [c.name for c in db.query(Cycle).filter(Cycle.user == body.user)]
        raise HTTPException(status_code=404, detail=f"Cycle not found. Your cycles: {user_cycles}")
    db.query(Like).filter(Like.cycle_id == cycle.id).delete()
    db.delete(cycle)
    db.commit()
    logger.info("Cycle deleted: %s by %s", body.cycle_name, body.user)
    return {"verdict": f"Successful delete cycle: {body.cycle_name}"}


@app.post("/user_cycles/")
async def get_cycles(body: UserCyclesRequest, db: Session = Depends(get_db)):
    """Get all training cycles for a user."""
    authenticate_user(body.user, body.password, db)
    user_cycles = list(db.query(Cycle).filter(Cycle.user == body.user))
    return {"verdict": "Successful getting cycles.", "cycles": user_cycles}


# ======================== DAY / DUTIES ========================


@app.post("/day/")
async def day(body: DayRequest, db: Session = Depends(get_db)):
    """Get or create the duty list for a specific day."""
    user_obj = authenticate_user(body.user, body.password, db)
    try:
        date = datetime.datetime.strptime(body.day, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid day format. Use YYYY-MM-DD.")

    duties = {}
    for cycle in db.query(Cycle).filter(Cycle.user == body.user).all():
        cycle_date = datetime.datetime.strptime(cycle.start_at, "%Y-%m-%d").date()
        days_diff = (date - cycle_date).days
        day_index = days_diff % (cycle.days_count + cycle.pause)
        try:
            duties[cycle.descriptions[abs(day_index)]] = 0
        except IndexError:
            pass

    if body.day in user_obj.days:
        existing = user_obj.days[body.day].copy()
        for key in duties:
            if key in existing:
                duties[key] = existing[key]

    user_days = user_obj.days.copy()
    user_days[body.day] = duties
    user_obj.days = user_days.copy()
    db.commit()
    return {"verdict": "Successful getting duties.", "duties": duties}


@app.post("/duty/")
async def duty(body: DutyRequest, db: Session = Depends(get_db)):
    """Toggle the completion state of a duty."""
    user_obj = authenticate_user(body.user, body.password, db)
    day_data = user_obj.days.get(body.selected_date)
    if not day_data or body.duty_name not in day_data:
        raise HTTPException(status_code=404, detail="Duty not found for the selected date.")
    current = day_data[body.duty_name]
    new_days = user_obj.days.copy()
    new_days[body.selected_date][body.duty_name] = 1 - current
    user_obj.days = new_days.copy()
    db.commit()
    return {"verdict": "Successful change of duty completion.", "duties": user_obj.days.copy()}


@app.post("/month_duties/")
async def month_duties(body: MonthRequest, db: Session = Depends(get_db)):
    """Get duty counts for each day in a month (for calendar coloring)."""
    authenticate_user(body.user, body.password, db)
    user_cycles = list(db.query(Cycle).filter(Cycle.user == body.user).all())
    _, days_in_month = cal_mod.monthrange(body.year, body.month)
    result = {}
    for d in range(1, days_in_month + 1):
        date = datetime.date(body.year, body.month, d)
        date_str = date.isoformat()
        count = 0
        for cycle in user_cycles:
            try:
                cycle_date = datetime.datetime.strptime(cycle.start_at, "%Y-%m-%d").date()
            except (ValueError, TypeError):
                continue
            days_diff = (date - cycle_date).days
            total = cycle.days_count + cycle.pause
            if total <= 0:
                continue
            day_index = days_diff % total
            try:
                if cycle.descriptions[abs(day_index)] and cycle.descriptions[abs(day_index)] != "Нет упражнений":
                    count += 1
            except (IndexError, TypeError):
                pass
        result[date_str] = count
    return {"days": result, "max": max(result.values()) if result else 0}


# ======================== NOTES ========================


@app.post("/create_note/")
async def create_note(body: NoteCreate, db: Session = Depends(get_db)):
    """Create a new note for the user."""
    authenticate_user(body.user, body.password, db)
    import uuid
    note_name = body.name if body.name.strip() else f"note_{uuid.uuid4().hex[:8]}"
    if db.query(Note).filter(Note.user == body.user, Note.name == note_name).first():
        note_name = f"{note_name}_{uuid.uuid4().hex[:6]}"
    db.add(Note(name=note_name, user=body.user, descriptions=body.descriptions))
    db.commit()
    return {"verdict": f"Note created."}


@app.post("/get_notes/")
async def get_notes(body: NotesRequest, db: Session = Depends(get_db)):
    """Get all notes for a user."""
    authenticate_user(body.user, body.password, db)
    notes = list(db.query(Note).filter(Note.user == body.user).order_by(Note.id.desc()))
    return {"verdict": "Successful getting notes.", "notes": [{
        "id": n.id, "name": n.name, "user": n.user,
        "descriptions": n.descriptions,
        "created_at": n.created_at.isoformat() if getattr(n, 'created_at', None) else "",
    } for n in notes]}


@app.post("/delete_note/")
async def delete_note(body: NoteDelete, db: Session = Depends(get_db)):
    """Delete a note by name."""
    authenticate_user(body.user, body.password, db)
    note = db.query(Note).filter(Note.user == body.user, Note.name == body.note_name).first()
    if not note:
        user_notes = [n.name for n in db.query(Note).filter(Note.user == body.user)]
        raise HTTPException(status_code=404, detail=f"Note not found. Your notes: {user_notes}")
    db.delete(note)
    db.commit()
    return {"verdict": f"Successful delete note: {body.note_name}"}


# ======================== ANALYTICS ========================


@app.post("/analytics/")
async def analytics(body: AnalyticsRequest, db: Session = Depends(get_db)):
    """Calculate muscle load analytics for a training cycle."""
    authenticate_user(body.user, body.password, db)
    try:
        with open("db/exercises.json", "r", encoding="utf-8") as f:
            exercises_db = json.load(f)
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Exercises database not found.")

    cycle = db.query(Cycle).filter(Cycle.user == body.user, Cycle.name == body.cycle_name).first()
    if not cycle:
        raise HTTPException(status_code=404, detail=f"Cycle '{body.cycle_name}' not found.")
    if not cycle.data:
        raise HTTPException(status_code=400, detail="Cycle data is empty.")

    daily_analytics = {}
    total_analytics = {m: 0.0 for m in MUSCLE_GROUPS}
    days_count = len(cycle.data)

    for day_name, day_exercises in cycle.data.items():
        day_load = {m: 0.0 for m in MUSCLE_GROUPS}
        for ex in day_exercises:
            ex_id = str(ex.get("id", ""))
            if not ex_id:
                continue
            sets = int(ex.get("sets", 3))
            info = exercises_db[int(ex_id)]
            if not info:
                continue
            for muscle, pr in info.get("muscles", {}).items():
                wl = round(sets * float(pr) * (7 / days_count), 2)
                if muscle in day_load:
                    day_load[muscle] += wl
                if muscle in total_analytics:
                    total_analytics[muscle] += wl
        daily_analytics[day_name] = day_load

    avg_daily = {m: 0.0 for m in MUSCLE_GROUPS}
    if days_count > 0:
        for m in MUSCLE_GROUPS:
            avg_daily[m] = round(
                sum(daily_analytics[d][m] for d in daily_analytics) * (7 / days_count), 2
            )

    optimal_prs = {}
    for mid, load in total_analytics.items():
        opt = MUSCLE_GROUPS.get(mid, {}).get("optimal_weekly", 10)
        optimal_prs[mid] = round((load / opt) * 100, 1) if opt > 0 else 0

    THRESHOLDS = [
        (130, "overloaded", "#ff4444"),
        (80, "optimal", "#44ff44"),
        (40, "moderate", "#ffa500"),
        (10, "underloaded", "#ffff00"),
        (0, "untrained", "#cccccc"),
    ]
    load_status = {}
    for mid, pr in optimal_prs.items():
        for thr, lbl, clr in THRESHOLDS:
            if pr > thr:
                load_status[mid] = {"status": lbl, "color": clr, "pr": pr}
                break

    MSGS = {
        "overloaded": ("Перегрузка ({pr}%). Снизьте нагрузку.", "high"),
        "optimal": ("Оптимально ({pr}%).", "low"),
        "moderate": ("Средняя нагрузка ({pr}%). Можно увеличить.", "medium"),
        "underloaded": ("Недогруз ({pr}%). Добавьте упражнения.", "high"),
        "untrained": ("Не тренируется ({pr}%).", "high"),
    }
    recs = []
    for mid, data in load_status.items():
        name = MUSCLE_GROUPS[mid]["name"]
        tmpl, prio = MSGS[data["status"]]
        recs.append({
            "message": f"{name}: {tmpl.format(pr=data['pr'])}",
            "priority": prio,
            "muscle": name,
        })
    recs.sort(key=lambda x: {"high": 0, "medium": 1, "low": 2}[x["priority"]])

    return {
        "verdict": "Analytics calculated successfully",
        "cycle_name": body.cycle_name,
        "days_count": days_count,
        "daily_analytics": daily_analytics,
        "total_analytics": total_analytics,
        "average_daily": avg_daily,
        "optimal_percentages": optimal_prs,
        "load_status": load_status,
        "recommendations": recs[:5],
    }


@app.post("/get_exercises/")
async def exercises():
    """Return all available exercises."""
    try:
        with open("db/exercises.json", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Exercises database not found.")


# ======================== SOCIAL: PUBLISH ========================


@app.post("/publish_cycle/")
async def publish_cycle(body: PublishCycleRequest, db: Session = Depends(get_db)):
    """Make a training cycle public. Only original (non-cloned) cycles can be published."""
    authenticate_user(body.user, body.password, db)
    cycle = db.query(Cycle).filter(Cycle.user == body.user, Cycle.name == body.cycle_name).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Cycle not found.")
    if getattr(cycle, "original_author", ""):
        raise HTTPException(status_code=403, detail="Cloned cycles cannot be published. Only your own creations can be public.")
    cycle.is_public = 1
    db.commit()
    logger.info("Cycle published: %s by %s", body.cycle_name, body.user)
    return {"verdict": f"Cycle '{body.cycle_name}' is now public."}


@app.post("/unpublish_cycle/")
async def unpublish_cycle(body: PublishCycleRequest, db: Session = Depends(get_db)):
    """Make a training cycle private."""
    authenticate_user(body.user, body.password, db)
    cycle = db.query(Cycle).filter(Cycle.user == body.user, Cycle.name == body.cycle_name).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Cycle not found.")
    cycle.is_public = 0
    db.commit()
    logger.info("Cycle unpublished: %s by %s", body.cycle_name, body.user)
    return {"verdict": f"Cycle '{body.cycle_name}' is now private."}


# ======================== SOCIAL: FOLLOW ========================


@app.post("/follow/")
async def follow_user(body: FollowRequest, db: Session = Depends(get_db)):
    """Follow another user."""
    authenticate_user(body.user, body.password, db)
    if body.user == body.target_user:
        raise HTTPException(status_code=400, detail="You cannot follow yourself.")
    target = db.query(User).filter(User.username == body.target_user).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")
    existing = db.query(Follow).filter(
        Follow.follower == body.user, Follow.following == body.target_user
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Already following this user.")
    db.add(Follow(follower=body.user, following=body.target_user))
    db.commit()
    logger.info("%s followed %s", body.user, body.target_user)
    return {"verdict": f"You are now following {body.target_user}."}


@app.post("/unfollow/")
async def unfollow_user(body: FollowRequest, db: Session = Depends(get_db)):
    """Unfollow a user."""
    authenticate_user(body.user, body.password, db)
    follow_obj = db.query(Follow).filter(
        Follow.follower == body.user, Follow.following == body.target_user
    ).first()
    if not follow_obj:
        raise HTTPException(status_code=404, detail="You are not following this user.")
    db.delete(follow_obj)
    db.commit()
    logger.info("%s unfollowed %s", body.user, body.target_user)
    return {"verdict": f"You unfollowed {body.target_user}."}


@app.get("/followers/{username}/")
async def get_followers(username: str, db: Session = Depends(get_db)):
    """Get the list of followers for a user."""
    if not db.query(User).filter(User.username == username).first():
        raise HTTPException(status_code=404, detail="User not found.")
    followers = [f.follower for f in db.query(Follow).filter(Follow.following == username)]
    return {"username": username, "followers": followers, "count": len(followers)}


@app.get("/following/{username}/")
async def get_following(username: str, db: Session = Depends(get_db)):
    """Get the list of users that a user is following."""
    if not db.query(User).filter(User.username == username).first():
        raise HTTPException(status_code=404, detail="User not found.")
    following = [f.following for f in db.query(Follow).filter(Follow.follower == username)]
    return {"username": username, "following": following, "count": len(following)}


# ======================== SOCIAL: LIKES ========================


@app.post("/like_cycle/")
async def like_cycle(body: LikeCycleRequest, db: Session = Depends(get_db)):
    """IN a public training cycle — marks it and clones to user's private list."""
    authenticate_user(body.user, body.password, db)
    cycle = db.query(Cycle).filter(Cycle.id == body.cycle_id, Cycle.is_public == 1).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Public cycle not found.")
    existing = db.query(Like).filter(Like.user == body.user, Like.cycle_id == body.cycle_id).first()
    if existing:
        raise HTTPException(status_code=409, detail="Already IN.")
    db.add(Like(user=body.user, cycle_id=body.cycle_id))
    # Clone to user's private workouts
    if cycle.user != body.user:
        original = getattr(cycle, "original_author", "") or cycle.user
        base_name = cycle.name
        new_name = base_name
        counter = 1
        while db.query(Cycle).filter(Cycle.user == body.user, Cycle.name == new_name).first():
            counter += 1
            new_name = f"{base_name} ({counter})"
        today = datetime.date.today().isoformat()
        new_cycle = Cycle(
            name=new_name, user=body.user, days_count=cycle.days_count,
            pause=cycle.pause, descriptions=cycle.descriptions, data=cycle.data,
            start_at=today, is_public=0, original_author=original,
        )
        db.add(new_cycle)
    db.commit()
    ins_count = db.query(Like).filter(Like.cycle_id == body.cycle_id).count()
    logger.info("%s IN cycle #%d", body.user, body.cycle_id)
    return {"verdict": "IN!", "ins_count": ins_count}


@app.post("/unlike_cycle/")
async def unlike_cycle(body: LikeCycleRequest, db: Session = Depends(get_db)):
    """Remove a like from a training cycle."""
    authenticate_user(body.user, body.password, db)
    like_obj = db.query(Like).filter(Like.user == body.user, Like.cycle_id == body.cycle_id).first()
    if not like_obj:
        raise HTTPException(status_code=404, detail="Like not found.")
    db.delete(like_obj)
    db.commit()
    ins_count = db.query(Like).filter(Like.cycle_id == body.cycle_id).count()
    logger.info("%s un-IN cycle #%d", body.user, body.cycle_id)
    return {"verdict": "Removed.", "ins_count": ins_count}


# ======================== SOCIAL: FEED & SEARCH ========================


@app.post("/feed/")
async def feed(body: FeedRequest, db: Session = Depends(get_db)):
    """Get public cycles: from followed users, or top by IN count globally."""
    from sqlalchemy import func
    authenticate_user(body.user, body.password, db)
    following = [f.following for f in db.query(Follow).filter(Follow.follower == body.user)]
    sources = following + [body.user]  # include own published
    if following:
        cycles = (
            db.query(Cycle)
            .filter(Cycle.user.in_(sources), Cycle.is_public == 1)
            .order_by(Cycle.id.desc())
            .limit(50)
            .all()
        )
    else:
        # No subscriptions — show global top by IN count + own published
        from sqlalchemy import or_
        cycles = (
            db.query(Cycle)
            .outerjoin(Like, Like.cycle_id == Cycle.id)
            .filter(Cycle.is_public == 1)
            .group_by(Cycle.id)
            .order_by(func.count(Like.id).desc(), Cycle.id.desc())
            .limit(50)
            .all()
        )
    result = _cycles_to_dicts(cycles, db, body.user)
    return {"verdict": f"Feed loaded. {len(result)} cycles.", "cycles": result}


@app.post("/search_cycles/")
async def search_cycles(body: SearchRequest, db: Session = Depends(get_db)):
    """Search public training cycles by name. Auth is optional (for is_liked)."""
    current_user = ""
    if body.user and body.password:
        try:
            authenticate_user(body.user, body.password, db)
            current_user = body.user
        except HTTPException:
            pass

    q = body.query.strip()
    query = db.query(Cycle).filter(Cycle.is_public == 1)
    if q:
        query = query.filter(Cycle.name.ilike(f"%{q}%"))
    cycles = query.order_by(Cycle.id.desc()).limit(50).all()

    result = _cycles_to_dicts(cycles, db, current_user)
    return {"verdict": f"Found {len(result)} cycles.", "cycles": result}


@app.post("/search_users/")
async def search_users(body: SearchRequest, db: Session = Depends(get_db)):
    """Search users by username."""
    q = body.query.strip()
    if not q:
        return {"users": []}
    users = db.query(User).filter(User.username.ilike(f"%{q}%")).limit(20).all()
    result = []
    for u in users:
        cycles_count = db.query(Cycle).filter(Cycle.user == u.username).count()
        followers_count = db.query(Follow).filter(Follow.following == u.username).count()
        result.append({
            "username": u.username,
            "bio": getattr(u, "bio", "") or "",
            "cycles_count": cycles_count,
            "followers_count": followers_count,
        })
    return {"users": result}


@app.post("/clone_cycle/")
async def clone_cycle(body: CloneCycleRequest, db: Session = Depends(get_db)):
    """Clone a public cycle to the authenticated user's account."""
    authenticate_user(body.user, body.password, db)
    cycle = db.query(Cycle).filter(Cycle.id == body.cycle_id, Cycle.is_public == 1).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Public cycle not found.")
    # Determine original author (follow chain)
    original = getattr(cycle, "original_author", "") or cycle.user
    # Generate unique name
    base_name = cycle.name
    new_name = base_name
    counter = 1
    while db.query(Cycle).filter(Cycle.user == body.user, Cycle.name == new_name).first():
        counter += 1
        new_name = f"{base_name} ({counter})"
    new_cycle = Cycle(
        name=new_name,
        user=body.user,
        days_count=cycle.days_count,
        pause=cycle.pause,
        descriptions=cycle.descriptions,
        data=cycle.data,
        start_at=body.start_at,
        is_public=0,
        original_author=original,
    )
    db.add(new_cycle)
    db.commit()
    logger.info("%s cloned cycle #%d ('%s') from %s", body.user, cycle.id, cycle.name, cycle.user)
    return {"verdict": f"Cycle '{new_name}' cloned successfully.", "new_name": new_name}


@app.post("/analytics_public/")
async def analytics_public(body: AnalyticsPublicRequest, db: Session = Depends(get_db)):
    """Calculate analytics for any user's public cycle."""
    authenticate_user(body.user, body.password, db)
    cycle = db.query(Cycle).filter(
        Cycle.user == body.target_user,
        Cycle.name == body.cycle_name,
        Cycle.is_public == 1,
    ).first()
    if not cycle:
        raise HTTPException(status_code=404, detail=f"Public cycle '{body.cycle_name}' not found for user '{body.target_user}'.")
    if not cycle.data:
        raise HTTPException(status_code=400, detail="Cycle data is empty.")

    try:
        with open("db/exercises.json", "r", encoding="utf-8") as f:
            exercises_db = json.load(f)
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Exercises database not found.")

    daily_analytics = {}
    total_analytics = {m: 0.0 for m in MUSCLE_GROUPS}
    days_count = len(cycle.data)
    for day_name, day_exercises in cycle.data.items():
        day_load = {m: 0.0 for m in MUSCLE_GROUPS}
        for ex in day_exercises:
            ex_id = str(ex.get("id", ""))
            if not ex_id:
                continue
            sets = int(ex.get("sets", 3))
            info = exercises_db[int(ex_id)]
            if not info:
                continue
            for muscle, pr in info.get("muscles", {}).items():
                wl = round(sets * float(pr) * (7 / days_count), 2)
                if muscle in day_load:
                    day_load[muscle] += wl
                if muscle in total_analytics:
                    total_analytics[muscle] += wl
        daily_analytics[day_name] = day_load

    optimal_prs = {}
    for mid, load in total_analytics.items():
        opt = MUSCLE_GROUPS.get(mid, {}).get("optimal_weekly", 10)
        optimal_prs[mid] = round((load / opt) * 100, 1) if opt > 0 else 0

    THRESHOLDS = [
        (130, "overloaded", "#ff4444"),
        (80, "optimal", "#44ff44"),
        (40, "moderate", "#ffa500"),
        (10, "underloaded", "#ffff00"),
        (0, "untrained", "#cccccc"),
    ]
    load_status = {}
    for mid, pr in optimal_prs.items():
        for thr, lbl, clr in THRESHOLDS:
            if pr > thr:
                load_status[mid] = {"status": lbl, "color": clr, "pr": pr}
                break

    MSGS = {
        "overloaded": ("Перегрузка ({pr}%). Снизьте нагрузку.", "high"),
        "optimal": ("Оптимально ({pr}%).", "low"),
        "moderate": ("Средняя нагрузка ({pr}%). Можно увеличить.", "medium"),
        "underloaded": ("Недогруз ({pr}%). Добавьте упражнения.", "high"),
        "untrained": ("Не тренируется ({pr}%).", "high"),
    }
    recs = []
    for mid, data in load_status.items():
        name = MUSCLE_GROUPS[mid]["name"]
        tmpl, prio = MSGS[data["status"]]
        recs.append({
            "message": f"{name}: {tmpl.format(pr=data['pr'])}",
            "priority": prio,
            "muscle": name,
        })
    recs.sort(key=lambda x: {"high": 0, "medium": 1, "low": 2}[x["priority"]])

    return {
        "verdict": "Analytics calculated successfully",
        "cycle_name": body.cycle_name,
        "days_count": days_count,
        "load_status": load_status,
        "recommendations": recs[:5],
    }


# ======================== SOCIAL: PROFILE ========================


@app.get("/profile/{username}/")
async def get_profile(username: str, db: Session = Depends(get_db)):
    """Get a user's public profile with stats."""
    user_obj = db.query(User).filter(User.username == username).first()
    if not user_obj:
        raise HTTPException(status_code=404, detail="User not found.")

    cycles_count = db.query(Cycle).filter(Cycle.user == username).count()
    public_cycles_count = db.query(Cycle).filter(
        Cycle.user == username, Cycle.is_public == 1
    ).count()
    followers_count = db.query(Follow).filter(Follow.following == username).count()
    following_count = db.query(Follow).filter(Follow.follower == username).count()
    notes_count = db.query(Note).filter(Note.user == username).count()

    public_cycle_ids = [
        c.id for c in db.query(Cycle).filter(Cycle.user == username, Cycle.is_public == 1)
    ]
    total_ins = (
        db.query(Like).filter(Like.cycle_id.in_(public_cycle_ids)).count()
        if public_cycle_ids
        else 0
    )

    public_cycles = db.query(Cycle).filter(
        Cycle.user == username, Cycle.is_public == 1
    ).all()
    cycles_data = _cycles_to_dicts(public_cycles, db)

    return {
        "username": username,
        "bio": getattr(user_obj, "bio", "") or "",
        "cycles_count": cycles_count,
        "public_cycles_count": public_cycles_count,
        "followers_count": followers_count,
        "following_count": following_count,
        "notes_count": notes_count,
        "total_ins": total_ins,
        "public_cycles": cycles_data,
    }


@app.post("/update_profile/")
async def update_profile(body: UpdateProfileRequest, db: Session = Depends(get_db)):
    """Update the authenticated user's profile."""
    user_obj = authenticate_user(body.user, body.password, db)
    user_obj.bio = body.bio
    db.commit()
    logger.info("Profile updated: %s", body.user)
    return {"verdict": "Profile updated."}


# ======================== COMMENTS ========================


@app.post("/create_comment/")
async def create_comment(body: CommentCreate, db: Session = Depends(get_db)):
    """Create a comment on a cycle or note."""
    authenticate_user(body.user, body.password, db)
    if body.target_type not in ("cycle", "note"):
        raise HTTPException(status_code=400, detail="target_type must be 'cycle' or 'note'.")
    comment = Comment(
        user=body.user,
        target_type=body.target_type,
        target_id=body.target_id,
        text=body.text,
    )
    db.add(comment)
    db.commit()
    return {"verdict": "Comment created.", "comment": {
        "id": comment.id, "user": comment.user,
        "text": comment.text,
        "created_at": comment.created_at.isoformat() if comment.created_at else "",
    }}


@app.post("/delete_comment/")
async def delete_comment(body: CommentDelete, db: Session = Depends(get_db)):
    """Delete own comment."""
    authenticate_user(body.user, body.password, db)
    comment = db.query(Comment).filter(Comment.id == body.comment_id, Comment.user == body.user).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found or not yours.")
    db.delete(comment)
    db.commit()
    return {"verdict": "Comment deleted."}


@app.post("/get_comments/")
async def get_comments(body: CommentsRequest, db: Session = Depends(get_db)):
    """Get comments for a cycle or note."""
    comments = (
        db.query(Comment)
        .filter(Comment.target_type == body.target_type, Comment.target_id == body.target_id)
        .order_by(Comment.id.desc())
        .limit(100)
        .all()
    )
    return {"comments": [{
        "id": c.id, "user": c.user, "text": c.text,
        "created_at": c.created_at.isoformat() if c.created_at else "",
    } for c in comments]}


@app.post("/get_in_users/")
async def get_in_users(body: InUsersRequest, db: Session = Depends(get_db)):
    """Get list of users who IN'd a cycle."""
    likes = db.query(Like).filter(Like.cycle_id == body.cycle_id).all()
    return {"users": [l.user for l in likes]}


# ======================== MAIN ========================


if __name__ == "__main__":
    uvicorn.run("web:app", host="127.0.0.1", port=8001, reload=True, log_level="info")
