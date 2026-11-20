from datetime import date, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models import User, Session as DBSession
from app.schemas import SessionCreate, SessionFinish, SessionResponse, DashboardStats
from app.auth import get_current_user

router = APIRouter(prefix="/sessions", tags=["Focus Sessions"])

@router.post("/start", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
def start_session(
    session_in: SessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if session_in.target_duration <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session duration must be greater than 0 minutes."
        )
    
    session = DBSession(
        user_id=current_user.id,
        target_duration=session_in.target_duration,
        status="InProgress"
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@router.post("/finish", response_model=SessionResponse)
def finish_session(
    finish_in: SessionFinish,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(DBSession).filter(
        DBSession.id == finish_in.session_id,
        DBSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found."
        )

    if finish_in.status not in ["Completed", "Failed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be either 'Completed' or 'Failed'."
        )

    session.status = finish_in.status
    today = date.today()

    if finish_in.status == "Completed":
        # Gamification: Update total focus minutes
        current_user.total_focus_minutes += session.target_duration

        # Gamification: Update streak logic
        if current_user.last_active_date is None:
            current_user.current_streak = 1
        elif current_user.last_active_date == today:
            # Already completed a session today, streak maintained
            pass
        elif current_user.last_active_date == today - timedelta(days=1):
            # Consecutive day!
            current_user.current_streak += 1
        else:
            # Missed a day or more, reset streak to 1
            current_user.current_streak = 1
        
        current_user.last_active_date = today

    db.commit()
    db.refresh(session)
    db.refresh(current_user)
    return session

@router.get("/history", response_model=List[SessionResponse])
def get_session_history(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sessions = (
        db.query(DBSession)
        .filter(DBSession.user_id == current_user.id)
        .order_by(desc(DBSession.created_at))
        .limit(limit)
        .all()
    )
    return sessions

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    all_sessions = (
        db.query(DBSession)
        .filter(DBSession.user_id == current_user.id)
        .order_by(desc(DBSession.created_at))
        .all()
    )

    completed_count = sum(1 for s in all_sessions if s.status == "Completed")
    failed_count = sum(1 for s in all_sessions if s.status == "Failed")
    total_count = completed_count + failed_count

    completion_rate = round((completed_count / total_count * 100), 1) if total_count > 0 else 0.0
    focus_hours = round(current_user.total_focus_minutes / 60.0, 1)

    return DashboardStats(
        current_streak=current_user.current_streak,
        total_focus_minutes=current_user.total_focus_minutes,
        total_focus_hours=focus_hours,
        total_sessions=total_count,
        completed_sessions=completed_count,
        failed_sessions=failed_count,
        completion_rate_percentage=completion_rate,
        recent_sessions=all_sessions[:10]
    )
