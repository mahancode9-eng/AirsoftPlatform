from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import (
    Booking,
    BookingEquipment,
    BookingStatus,
    EquipmentItem,
    GameSession,
    User,
    UserRole,
    Waiver,
)
from ..schemas import BookingCreateIn, BookingOut, WaiverIn, WaiverOut
from ..security import get_current_user
from .catalog import _booked_players

router = APIRouter(tags=["bookings"])


@router.post("/bookings", response_model=BookingOut)
def create_booking(
    data: BookingCreateIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = db.get(GameSession, data.session_id)
    if not session or not session.is_active:
        raise HTTPException(status_code=404, detail="سانس پیدا نشد")
    if session.start_time <= datetime.utcnow():
        raise HTTPException(status_code=400, detail="زمان این سانس گذشته است")

    remaining = session.capacity - _booked_players(db, session.id)
    if data.num_players > remaining:
        raise HTTPException(
            status_code=400,
            detail=f"ظرفیت کافی نیست. ظرفیت باقی‌مانده: {remaining} نفر",
        )

    total = session.price_per_player * data.num_players
    equipment_rows: list[BookingEquipment] = []
    for eq in data.equipment:
        item = db.get(EquipmentItem, eq.equipment_id)
        if not item or not item.is_active:
            raise HTTPException(status_code=404, detail="تجهیزات انتخابی پیدا نشد")
        if eq.quantity > item.stock:
            raise HTTPException(
                status_code=400,
                detail=f"موجودی «{item.name}» کافی نیست (موجودی: {item.stock})",
            )
        total += item.price_per_session * eq.quantity
        equipment_rows.append(
            BookingEquipment(
                equipment_id=item.id,
                quantity=eq.quantity,
                unit_price=item.price_per_session,
            )
        )

    booking = Booking(
        user_id=user.id,
        session_id=session.id,
        num_players=data.num_players,
        is_group=data.is_group,
        group_name=data.group_name.strip(),
        note=data.note.strip(),
        total_amount=total,
        status=BookingStatus.confirmed if total == 0 else BookingStatus.pending_payment,
        equipment=equipment_rows,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return _load_booking(db, booking.id)


def _load_booking(db: Session, booking_id: int) -> Booking:
    return (
        db.query(Booking)
        .options(
            joinedload(Booking.session).joinedload(GameSession.field),
            joinedload(Booking.equipment).joinedload(BookingEquipment.item),
            joinedload(Booking.waiver),
        )
        .filter(Booking.id == booking_id)
        .first()
    )


@router.get("/bookings/my", response_model=list[BookingOut])
def my_bookings(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = (
        db.query(Booking)
        .options(
            joinedload(Booking.session).joinedload(GameSession.field),
            joinedload(Booking.equipment).joinedload(BookingEquipment.item),
            joinedload(Booking.waiver),
        )
        .filter(Booking.user_id == user.id)
        .order_by(Booking.created_at.desc())
        .all()
    )
    return rows


@router.get("/bookings/{booking_id}", response_model=BookingOut)
def get_booking(
    booking_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = _load_booking(db, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="رزرو پیدا نشد")
    if booking.user_id != user.id and user.role not in (UserRole.admin, UserRole.staff):
        raise HTTPException(status_code=403, detail="دسترسی غیرمجاز")
    return booking


@router.post("/bookings/{booking_id}/cancel", response_model=BookingOut)
def cancel_booking(
    booking_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = _load_booking(db, booking_id)
    if not booking or booking.user_id != user.id:
        raise HTTPException(status_code=404, detail="رزرو پیدا نشد")
    if booking.status not in (BookingStatus.pending_payment, BookingStatus.confirmed):
        raise HTTPException(status_code=400, detail="این رزرو قابل لغو نیست")
    if booking.session.start_time <= datetime.utcnow():
        raise HTTPException(status_code=400, detail="زمان سانس گذشته و لغو ممکن نیست")
    booking.status = BookingStatus.cancelled
    db.commit()
    db.refresh(booking)
    return booking


@router.post("/waivers", response_model=WaiverOut)
def sign_waiver(
    data: WaiverIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not data.accepted_rules:
        raise HTTPException(status_code=400, detail="پذیرش قوانین الزامی است")
    booking = db.get(Booking, data.booking_id)
    if not booking or booking.user_id != user.id:
        raise HTTPException(status_code=404, detail="رزرو پیدا نشد")
    if booking.waiver:
        raise HTTPException(status_code=400, detail="رضایت‌نامه قبلاً امضا شده است")
    waiver = Waiver(
        booking_id=booking.id,
        user_id=user.id,
        full_name=data.full_name.strip(),
        national_id=data.national_id.strip(),
        emergency_phone=data.emergency_phone.strip(),
        accepted_rules=True,
    )
    db.add(waiver)
    db.commit()
    db.refresh(waiver)
    return waiver
