from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import (
    Booking,
    BookingEquipment,
    BookingStatus,
    EquipmentItem,
    Event,
    EventTicket,
    Field,
    GalleryImage,
    GameSession,
    League,
    Match,
    Order,
    OrderItem,
    Payment,
    PaymentStatus,
    PlayerStats,
    Product,
    Review,
    Team,
    User,
    UserRole,
)
from ..payments import GATEWAY_NAMES
from ..schemas import (
    BookingOut,
    EquipmentIn,
    EquipmentOut,
    EventIn,
    EventOut,
    FieldIn,
    FieldOut,
    GalleryIn,
    GalleryOut,
    LeagueIn,
    LeagueOut,
    MatchIn,
    MatchOut,
    MatchResultIn,
    OrderOut,
    PaymentOut,
    ProductIn,
    ProductOut,
    ReviewOut,
    SessionIn,
    SessionOut,
    UserOut,
)
from ..security import require_admin, require_superadmin
from ..settings_service import DEFAULTS, all_settings, set_setting

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


# ---------- Dashboard ----------
@router.get("/stats")
def dashboard_stats(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    month_ago = now - timedelta(days=30)
    revenue_total = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(Payment.status == PaymentStatus.paid)
        .scalar()
    )
    revenue_month = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(Payment.status == PaymentStatus.paid, Payment.created_at >= month_ago)
        .scalar()
    )
    return {
        "users": db.query(User).count(),
        "bookings_total": db.query(Booking).count(),
        "bookings_confirmed": db.query(Booking)
        .filter(Booking.status == BookingStatus.confirmed)
        .count(),
        "upcoming_sessions": db.query(GameSession)
        .filter(GameSession.start_time >= now, GameSession.is_active.is_(True))
        .count(),
        "events": db.query(Event).filter(Event.end_time >= now).count(),
        "teams": db.query(Team).count(),
        "orders_pending": db.query(Order).filter(Order.status == "paid").count(),
        "revenue_total": int(revenue_total or 0),
        "revenue_month": int(revenue_month or 0),
        "pending_reviews": db.query(Review).filter(Review.is_approved.is_(False)).count(),
    }


# ---------- Fields ----------
@router.post("/fields", response_model=FieldOut)
def create_field(data: FieldIn, db: Session = Depends(get_db)):
    if db.query(Field).filter(Field.slug == data.slug).first():
        raise HTTPException(status_code=400, detail="اسلاگ تکراری است")
    field = Field(**data.model_dump())
    db.add(field)
    db.commit()
    db.refresh(field)
    return field


@router.put("/fields/{field_id}", response_model=FieldOut)
def update_field(field_id: int, data: FieldIn, db: Session = Depends(get_db)):
    field = db.get(Field, field_id)
    if not field:
        raise HTTPException(status_code=404, detail="زمین پیدا نشد")
    for key, value in data.model_dump().items():
        setattr(field, key, value)
    db.commit()
    db.refresh(field)
    return field


@router.get("/fields", response_model=list[FieldOut])
def admin_fields(db: Session = Depends(get_db)):
    return db.query(Field).order_by(Field.id).all()


# ---------- Sessions ----------
@router.post("/sessions", response_model=SessionOut)
def create_session(data: SessionIn, db: Session = Depends(get_db)):
    if not db.get(Field, data.field_id):
        raise HTTPException(status_code=404, detail="زمین پیدا نشد")
    session = GameSession(**data.model_dump())
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.put("/sessions/{session_id}", response_model=SessionOut)
def update_session(session_id: int, data: SessionIn, db: Session = Depends(get_db)):
    session = db.get(GameSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="سانس پیدا نشد")
    for key, value in data.model_dump().items():
        setattr(session, key, value)
    db.commit()
    db.refresh(session)
    return session


@router.get("/sessions", response_model=list[SessionOut])
def admin_sessions(db: Session = Depends(get_db)):
    return (
        db.query(GameSession)
        .options(joinedload(GameSession.field))
        .order_by(GameSession.start_time.desc())
        .limit(200)
        .all()
    )


# ---------- Equipment ----------
@router.post("/equipment", response_model=EquipmentOut)
def create_equipment(data: EquipmentIn, db: Session = Depends(get_db)):
    item = EquipmentItem(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/equipment/{item_id}", response_model=EquipmentOut)
def update_equipment(item_id: int, data: EquipmentIn, db: Session = Depends(get_db)):
    item = db.get(EquipmentItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="تجهیزات پیدا نشد")
    for key, value in data.model_dump().items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@router.get("/equipment", response_model=list[EquipmentOut])
def admin_equipment(db: Session = Depends(get_db)):
    return db.query(EquipmentItem).order_by(EquipmentItem.id).all()


# ---------- Bookings ----------
@router.get("/bookings", response_model=list[BookingOut])
def admin_bookings(status: str | None = None, db: Session = Depends(get_db)):
    q = db.query(Booking).options(
        joinedload(Booking.session).joinedload(GameSession.field),
        joinedload(Booking.equipment).joinedload(BookingEquipment.item),
        joinedload(Booking.waiver),
    )
    if status:
        q = q.filter(Booking.status == status)
    return q.order_by(Booking.created_at.desc()).limit(300).all()


@router.post("/bookings/{booking_id}/status", response_model=BookingOut)
def set_booking_status(booking_id: int, status: str, db: Session = Depends(get_db)):
    booking = db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="رزرو پیدا نشد")
    try:
        booking.status = BookingStatus(status)
    except ValueError:
        raise HTTPException(status_code=400, detail="وضعیت نامعتبر")
    db.commit()
    db.refresh(booking)
    return booking


# ---------- Events ----------
@router.post("/events", response_model=EventOut)
def create_event(data: EventIn, db: Session = Depends(get_db)):
    event = Event(**data.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.put("/events/{event_id}", response_model=EventOut)
def update_event(event_id: int, data: EventIn, db: Session = Depends(get_db)):
    event = db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="رویداد پیدا نشد")
    for key, value in data.model_dump().items():
        setattr(event, key, value)
    db.commit()
    db.refresh(event)
    return event


@router.get("/events", response_model=list[EventOut])
def admin_events(db: Session = Depends(get_db)):
    return db.query(Event).order_by(Event.start_time.desc()).limit(100).all()


@router.get("/events/{event_id}/tickets")
def event_tickets(event_id: int, db: Session = Depends(get_db)):
    rows = (
        db.query(EventTicket)
        .options(joinedload(EventTicket.user))
        .filter(EventTicket.event_id == event_id)
        .order_by(EventTicket.created_at.desc())
        .all()
    )
    return [
        {
            "id": t.id,
            "code": t.code,
            "quantity": t.quantity,
            "total_amount": t.total_amount,
            "status": t.status,
            "user_name": t.user.full_name if t.user else "",
            "user_phone": t.user.phone if t.user else "",
            "created_at": t.created_at,
        }
        for t in rows
    ]


# ---------- Leagues & matches ----------
@router.post("/leagues", response_model=LeagueOut)
def create_league(data: LeagueIn, db: Session = Depends(get_db)):
    league = League(**data.model_dump())
    db.add(league)
    db.commit()
    db.refresh(league)
    return league


@router.put("/leagues/{league_id}", response_model=LeagueOut)
def update_league(league_id: int, data: LeagueIn, db: Session = Depends(get_db)):
    league = db.get(League, league_id)
    if not league:
        raise HTTPException(status_code=404, detail="لیگ پیدا نشد")
    for key, value in data.model_dump().items():
        setattr(league, key, value)
    db.commit()
    db.refresh(league)
    return league


@router.post("/matches", response_model=MatchOut)
def create_match(data: MatchIn, db: Session = Depends(get_db)):
    if data.team_a_id == data.team_b_id:
        raise HTTPException(status_code=400, detail="دو تیم باید متفاوت باشند")
    for team_id in (data.team_a_id, data.team_b_id):
        if not db.get(Team, team_id):
            raise HTTPException(status_code=404, detail="تیم پیدا نشد")
    match = Match(**data.model_dump())
    db.add(match)
    db.commit()
    db.refresh(match)
    return match


@router.post("/matches/{match_id}/result", response_model=MatchOut)
def set_match_result(match_id: int, data: MatchResultIn, db: Session = Depends(get_db)):
    match = db.get(Match, match_id)
    if not match:
        raise HTTPException(status_code=404, detail="مسابقه پیدا نشد")
    match.score_a = data.score_a
    match.score_b = data.score_b
    match.status = "played"
    # Update simple player stats for both teams
    winner_id = None
    if data.score_a > data.score_b:
        winner_id = match.team_a_id
    elif data.score_b > data.score_a:
        winner_id = match.team_b_id
    for team_id in (match.team_a_id, match.team_b_id):
        team = db.get(Team, team_id)
        if not team:
            continue
        for member in team.members:
            stats = (
                db.query(PlayerStats).filter(PlayerStats.user_id == member.user_id).first()
            )
            if not stats:
                stats = PlayerStats(user_id=member.user_id)
                db.add(stats)
            stats.games_played += 1
            if winner_id is None:
                continue
            if team_id == winner_id:
                stats.wins += 1
            else:
                stats.losses += 1
    db.commit()
    db.refresh(match)
    return match


# ---------- Shop ----------
@router.post("/products", response_model=ProductOut)
def create_product(data: ProductIn, db: Session = Depends(get_db)):
    product = Product(**data.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.put("/products/{product_id}", response_model=ProductOut)
def update_product(product_id: int, data: ProductIn, db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="محصول پیدا نشد")
    for key, value in data.model_dump().items():
        setattr(product, key, value)
    db.commit()
    db.refresh(product)
    return product


@router.get("/products", response_model=list[ProductOut])
def admin_products(db: Session = Depends(get_db)):
    return db.query(Product).order_by(Product.id.desc()).all()


@router.get("/orders", response_model=list[OrderOut])
def admin_orders(db: Session = Depends(get_db)):
    return (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product))
        .order_by(Order.created_at.desc())
        .limit(300)
        .all()
    )


@router.post("/orders/{order_id}/status", response_model=OrderOut)
def set_order_status(order_id: int, status: str, db: Session = Depends(get_db)):
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="سفارش پیدا نشد")
    allowed = ["pending_payment", "paid", "shipped", "delivered", "cancelled"]
    if status not in allowed:
        raise HTTPException(status_code=400, detail="وضعیت نامعتبر")
    order.status = status
    db.commit()
    db.refresh(order)
    return order


# ---------- Reviews & gallery ----------
@router.get("/reviews", response_model=list[ReviewOut])
def admin_reviews(db: Session = Depends(get_db)):
    return (
        db.query(Review)
        .options(joinedload(Review.user))
        .order_by(Review.created_at.desc())
        .limit(200)
        .all()
    )


@router.post("/reviews/{review_id}/approve", response_model=ReviewOut)
def approve_review(review_id: int, db: Session = Depends(get_db)):
    review = db.get(Review, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="نظر پیدا نشد")
    review.is_approved = True
    db.commit()
    db.refresh(review)
    return review


@router.delete("/reviews/{review_id}")
def delete_review(review_id: int, db: Session = Depends(get_db)):
    review = db.get(Review, review_id)
    if review:
        db.delete(review)
        db.commit()
    return {"ok": True}


@router.post("/gallery", response_model=GalleryOut)
def add_gallery(data: GalleryIn, db: Session = Depends(get_db)):
    image = GalleryImage(**data.model_dump())
    db.add(image)
    db.commit()
    db.refresh(image)
    return image


@router.delete("/gallery/{image_id}")
def delete_gallery(image_id: int, db: Session = Depends(get_db)):
    image = db.get(GalleryImage, image_id)
    if image:
        db.delete(image)
        db.commit()
    return {"ok": True}


# ---------- Users ----------
@router.get("/users", response_model=list[UserOut])
def admin_users(db: Session = Depends(get_db)):
    return db.query(User).order_by(User.created_at.desc()).limit(500).all()


@router.post("/users/{user_id}/role", response_model=UserOut)
def set_user_role(
    user_id: int,
    role: str,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_superadmin),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="کاربر پیدا نشد")
    try:
        user.role = UserRole(role)
    except ValueError:
        raise HTTPException(status_code=400, detail="نقش نامعتبر")
    db.commit()
    db.refresh(user)
    return user


# ---------- Payments ----------
@router.get("/payments", response_model=list[PaymentOut])
def admin_payments(db: Session = Depends(get_db)):
    return db.query(Payment).order_by(Payment.created_at.desc()).limit(300).all()


# ---------- Settings (payment gateway switch etc.) ----------
@router.get("/settings")
def get_admin_settings(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_superadmin),
):
    return {
        "settings": all_settings(db, include_secrets=False),
        "gateways": GATEWAY_NAMES,
    }


@router.put("/settings")
def update_admin_settings(
    updates: dict[str, str],
    db: Session = Depends(get_db),
    _admin: User = Depends(require_superadmin),
):
    allowed_keys = set(DEFAULTS.keys())
    applied = []
    for key, value in updates.items():
        if key not in allowed_keys:
            raise HTTPException(status_code=400, detail=f"کلید تنظیمات نامعتبر: {key}")
        if key == "payment.active_gateway" and value not in GATEWAY_NAMES:
            raise HTTPException(status_code=400, detail="درگاه نامعتبر")
        # Do not overwrite secrets with masked values
        if value.startswith("***"):
            continue
        set_setting(db, key, value)
        applied.append(key)
    db.commit()
    return {"ok": True, "applied": applied}
