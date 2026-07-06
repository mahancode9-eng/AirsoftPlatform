"""Public catalog: fields, sessions, equipment, reviews, gallery, site info."""

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import (
    Booking,
    BookingStatus,
    EquipmentItem,
    Field,
    GalleryImage,
    GameSession,
    Review,
    User,
)
from ..schemas import (
    EquipmentOut,
    FieldOut,
    GalleryOut,
    ReviewIn,
    ReviewOut,
    SessionOut,
)
from ..security import get_current_user
from ..settings_service import get_setting

router = APIRouter(tags=["catalog"])


def _booked_players(db: Session, session_id: int) -> int:
    total = (
        db.query(func.coalesce(func.sum(Booking.num_players), 0))
        .filter(
            Booking.session_id == session_id,
            Booking.status.in_([BookingStatus.pending_payment, BookingStatus.confirmed]),
        )
        .scalar()
    )
    return int(total or 0)


def session_to_out(db: Session, s: GameSession) -> SessionOut:
    out = SessionOut.model_validate(s)
    out.remaining_capacity = max(0, s.capacity - _booked_players(db, s.id))
    return out


@router.get("/site-info")
def site_info(db: Session = Depends(get_db)):
    return {
        "name": get_setting(db, "site.name"),
        "phone": get_setting(db, "site.phone"),
        "instagram": get_setting(db, "site.instagram"),
        "telegram": get_setting(db, "site.telegram"),
        "rules": get_setting(db, "site.rules"),
    }


@router.get("/fields", response_model=list[FieldOut])
def list_fields(db: Session = Depends(get_db)):
    return db.query(Field).filter(Field.is_active.is_(True)).order_by(Field.id).all()


@router.get("/fields/{slug}", response_model=FieldOut)
def get_field(slug: str, db: Session = Depends(get_db)):
    q = db.query(Field).filter(Field.is_active.is_(True))
    field = q.filter(Field.slug == slug).first()
    if not field and slug.isdigit():
        field = q.filter(Field.id == int(slug)).first()
    if not field:
        raise HTTPException(status_code=404, detail="زمین پیدا نشد")
    return field


@router.get("/sessions", response_model=list[SessionOut])
def list_sessions(
    field_id: int | None = None,
    days: int = Query(default=14, ge=1, le=60),
    db: Session = Depends(get_db),
):
    now = datetime.utcnow()
    q = (
        db.query(GameSession)
        .options(joinedload(GameSession.field))
        .filter(
            GameSession.is_active.is_(True),
            GameSession.start_time >= now,
            GameSession.start_time <= now + timedelta(days=days),
        )
        .order_by(GameSession.start_time)
    )
    if field_id:
        q = q.filter(GameSession.field_id == field_id)
    return [session_to_out(db, s) for s in q.all()]


@router.get("/sessions/{session_id}", response_model=SessionOut)
def get_session(session_id: int, db: Session = Depends(get_db)):
    s = (
        db.query(GameSession)
        .options(joinedload(GameSession.field))
        .filter(GameSession.id == session_id, GameSession.is_active.is_(True))
        .first()
    )
    if not s:
        raise HTTPException(status_code=404, detail="سانس پیدا نشد")
    return session_to_out(db, s)


@router.get("/equipment", response_model=list[EquipmentOut])
def list_equipment(db: Session = Depends(get_db)):
    return (
        db.query(EquipmentItem)
        .filter(EquipmentItem.is_active.is_(True), EquipmentItem.stock > 0)
        .order_by(EquipmentItem.category, EquipmentItem.id)
        .all()
    )


@router.get("/fields/{field_id}/reviews", response_model=list[ReviewOut])
def field_reviews(field_id: int, db: Session = Depends(get_db)):
    return (
        db.query(Review)
        .options(joinedload(Review.user))
        .filter(Review.field_id == field_id, Review.is_approved.is_(True))
        .order_by(Review.created_at.desc())
        .limit(50)
        .all()
    )


@router.post("/reviews", response_model=ReviewOut)
def create_review(
    data: ReviewIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not db.get(Field, data.field_id):
        raise HTTPException(status_code=404, detail="زمین پیدا نشد")
    review = Review(
        user_id=user.id,
        field_id=data.field_id,
        rating=data.rating,
        comment=data.comment.strip(),
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


@router.get("/gallery", response_model=list[GalleryOut])
def gallery(db: Session = Depends(get_db)):
    return db.query(GalleryImage).order_by(GalleryImage.created_at.desc()).limit(100).all()
