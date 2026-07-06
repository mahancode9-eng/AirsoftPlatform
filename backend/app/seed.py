"""Create tables, initial admin user, and demo data on first startup."""

import logging
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from .config import get_settings
from .database import Base, SessionLocal, engine
from .models import (
    EquipmentItem,
    Field,
    GameSession,
    Product,
    User,
    UserRole,
)
from .security import hash_password

logger = logging.getLogger(__name__)


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        _seed_admin(db)
        _seed_demo(db)
        db.commit()
    finally:
        db.close()


def _seed_admin(db: Session) -> None:
    settings = get_settings()
    admin = db.query(User).filter(User.role == UserRole.admin).first()
    if admin:
        return
    admin = User(
        phone=settings.ADMIN_PHONE,
        full_name=settings.ADMIN_NAME,
        password_hash=hash_password(settings.ADMIN_PASSWORD),
        role=UserRole.admin,
    )
    db.add(admin)
    logger.info("Created initial admin user: %s", settings.ADMIN_PHONE)


def _seed_demo(db: Session) -> None:
    """Small demo dataset so the site is not empty on first run."""
    if db.query(Field).count() > 0:
        return

    field1 = Field(
        name="زمین جنگلی آلفا",
        slug="alpha-forest",
        description="زمین فضای باز با پوشش جنگلی، سنگرهای طبیعی و دکورهای میدانی. مناسب سناریوهای تیمی بزرگ.",
        field_type="forest",
        capacity=30,
        features={"parking": True, "rental": True, "night_game": True},
    )
    field2 = Field(
        name="سالن CQB براوو",
        slug="bravo-cqb",
        description="محیط سرپوشیده شهری با اتاق‌ها و راهروهای تاکتیکال. مناسب بازی سریع و نزدیک.",
        field_type="cqb",
        capacity=16,
        features={"parking": True, "rental": True, "indoor": True},
    )
    db.add_all([field1, field2])
    db.flush()

    now = datetime.utcnow()
    for day in range(1, 8):
        start = (now + timedelta(days=day)).replace(hour=10, minute=0, second=0, microsecond=0)
        db.add(
            GameSession(
                field_id=field1.id,
                title="بازی آزاد صبح",
                session_type="open_play",
                start_time=start,
                end_time=start + timedelta(hours=3),
                capacity=30,
                price_per_player=350_000,
            )
        )
        start2 = (now + timedelta(days=day)).replace(hour=16, minute=0, second=0, microsecond=0)
        db.add(
            GameSession(
                field_id=field2.id,
                title="سانس CQB عصر",
                session_type="open_play",
                start_time=start2,
                end_time=start2 + timedelta(hours=2),
                capacity=16,
                price_per_player=450_000,
            )
        )

    db.add_all(
        [
            EquipmentItem(
                name="پکیج کامل مبتدی",
                description="تفنگ AEG + ماسک + جلیقه + ۲۰۰۰ ساچمه",
                category="package",
                price_per_session=250_000,
                stock=20,
            ),
            EquipmentItem(
                name="ماسک فول‌فیس",
                category="mask",
                price_per_session=50_000,
                stock=40,
            ),
            EquipmentItem(
                name="بسته ساچمه ۰.۲۵ گرم (۳۰۰۰ عدد)",
                category="bb",
                price_per_session=120_000,
                stock=100,
            ),
        ]
    )

    db.add_all(
        [
            Product(
                name="ساچمه ۰.۲۵ گرم - بسته ۳۰۰۰ تایی",
                category="bb",
                price=180_000,
                stock=50,
                description="ساچمه درجه یک مناسب مسابقه",
            ),
            Product(
                name="دستکش تاکتیکال",
                category="clothing",
                price=450_000,
                stock=15,
            ),
            Product(
                name="گیفت کارت یک سانس بازی",
                category="giftcard",
                price=350_000,
                stock=100,
                description="هدیه بدید به دوستان، یک سانس بازی آزاد",
            ),
        ]
    )
    logger.info("Seeded demo data")
