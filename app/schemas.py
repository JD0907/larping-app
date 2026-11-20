from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserLogin(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    current_streak: int
    total_focus_minutes: int
    last_active_date: Optional[date] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenData(BaseModel):
    user_id: Optional[str] = None

class SessionCreate(BaseModel):
    target_duration: int  # minutes

class SessionFinish(BaseModel):
    session_id: str
    status: str  # 'Completed' or 'Failed'

class SessionResponse(BaseModel):
    id: str
    user_id: str
    target_duration: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    current_streak: int
    total_focus_minutes: int
    total_focus_hours: float
    total_sessions: int
    completed_sessions: int
    failed_sessions: int
    completion_rate_percentage: float
    recent_sessions: List[SessionResponse]
