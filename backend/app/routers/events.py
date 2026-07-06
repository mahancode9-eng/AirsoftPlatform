from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Event, EventTicket, User
from ..schemas import EventOut, TicketBuyIn, TicketOut
from ..security import get_current_user

router = APIRouter(tags=["events"])


def _sold_tickets(db: Session, event_id: int) -> int:
    total = (
        db.query(func.coalesce(func.sum(EventTicket.quantity), 0))
        .filter(
            EventTicket.event_id == event_id,
            EventTicket.status.in_(["pending_payment", "paid"]),
        )
        .scalar()
    )
    return int(total or 0)


def _event_out(db: Session, event: Event) -> EventOut:
    out = EventOut.model_validate(event)
    out.sold_tickets = _sold_tickets(db, event.id)
    return out


@router.get("/events", response_model=list[EventOut])
def list_events(db: Session = Depends(get_db)):
    rows = (
        db.query(Event)
        .filter(Event.is_active.is_(True), Event.end_time >= datetime.utcnow())
        .order_by(Event.start_time)
        .all()
    )
    return [_event_out(db, e) for e in rows]


@router.get("/events/{event_id}", response_model=EventOut)
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = db.get(Event, event_id)
    if not event or not event.is_active:
        raise HTTPException(status_code=404, detail="رویداد پیدا نشد")
    return _event_out(db, event)


@router.post("/events/tickets", response_model=TicketOut)
def buy_ticket(
    data: TicketBuyIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    event = db.get(Event, data.event_id)
    if not event or not event.is_active:
        raise HTTPException(status_code=404, detail="رویداد پیدا نشد")
    if event.start_time <= datetime.utcnow():
        raise HTTPException(status_code=400, detail="زمان این رویداد گذشته است")
    remaining = event.capacity - _sold_tickets(db, event.id)
    if data.quantity > remaining:
        raise HTTPException(
            status_code=400,
            detail=f"ظرفیت کافی نیست. ظرفیت باقی‌مانده: {remaining}",
        )
    total = event.ticket_price * data.quantity
    ticket = EventTicket(
        event_id=event.id,
        user_id=user.id,
        quantity=data.quantity,
        total_amount=total,
        status="paid" if total == 0 else "pending_payment",
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


@router.get("/events/tickets/my", response_model=list[TicketOut])
def my_tickets(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(EventTicket)
        .options(joinedload(EventTicket.event))
        .filter(EventTicket.user_id == user.id)
        .order_by(EventTicket.created_at.desc())
        .all()
    )
