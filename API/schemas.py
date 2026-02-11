from pydantic import BaseModel, field_validator


class UserAuth(BaseModel):
    """Schema for user login (username + password)."""

    username: str
    password: str

    @field_validator("username", "password")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Field must not be empty.")
        return v.strip()


class SignUpRequest(UserAuth):
    """Schema for user registration."""

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v.strip()) <= 3:
            raise ValueError("Password must be longer than 3 characters.")
        return v.strip()


class CycleCreate(BaseModel):
    """Schema for creating a new training cycle."""

    name: str
    user: str
    days_count: int
    pause: int = 0
    descriptions: list
    data_cycle: dict
    password: str
    start_at: str

    @field_validator("pause")
    @classmethod
    def pause_non_negative(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Pause must not be negative.")
        return v


class CycleDelete(BaseModel):
    """Schema for deleting a training cycle."""

    cycle_name: str
    user: str
    password: str


class UserCyclesRequest(BaseModel):
    """Schema for fetching user's training cycles."""

    user: str
    password: str


class DayRequest(BaseModel):
    """Schema for fetching duties for a specific day."""

    user: str
    day: str
    password: str


class NoteCreate(BaseModel):
    """Schema for creating a new note."""

    name: str
    user: str
    descriptions: str
    password: str


class NoteDelete(BaseModel):
    """Schema for deleting a note."""

    note_name: str
    user: str
    password: str


class NotesRequest(BaseModel):
    """Schema for fetching user's notes."""

    user: str
    password: str


class DutyRequest(BaseModel):
    """Schema for toggling a duty completion."""

    selected_date: str
    duty_name: str
    user: str
    password: str


class AnalyticsRequest(BaseModel):
    """Schema for requesting cycle analytics."""

    cycle_name: str
    user: str
    password: str


# ======================== Social ========================


class PublishCycleRequest(BaseModel):
    """Schema for publishing/unpublishing a cycle."""

    cycle_name: str
    user: str
    password: str


class FollowRequest(BaseModel):
    """Schema for following/unfollowing a user."""

    target_user: str
    user: str
    password: str


class LikeCycleRequest(BaseModel):
    """Schema for liking/unliking a cycle."""

    cycle_id: int
    user: str
    password: str


class UpdateProfileRequest(BaseModel):
    """Schema for updating user profile."""

    bio: str = ""
    user: str
    password: str


class FeedRequest(BaseModel):
    """Schema for fetching the social feed."""

    user: str
    password: str


class SearchRequest(BaseModel):
    """Schema for searching public cycles (auth optional)."""

    query: str = ""
    user: str = ""
    password: str = ""


class CloneCycleRequest(BaseModel):
    """Schema for cloning a public cycle."""

    cycle_id: int
    user: str
    password: str
    start_at: str


class AnalyticsPublicRequest(BaseModel):
    """Schema for analyzing any user's cycle."""

    cycle_name: str
    target_user: str
    user: str
    password: str
