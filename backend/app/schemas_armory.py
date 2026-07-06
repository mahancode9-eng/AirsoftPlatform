"""Pydantic schemas for the armory module (guns, attachments, loadouts) — تسک ۶۰."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from .models import AttachmentSlot, GunCategory


class AttachmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    slot: AttachmentSlot
    brand: str
    description: str
    price_per_session: int
    stock: int
    photo: str
    stat_modifiers: dict


class GunListOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    brand: str
    category: GunCategory
    power_source: str
    fps: int
    price_per_session: int
    stock: int
    photos: list
    stats: dict
    is_featured: bool


class GunDetailOut(GunListOut):
    weight_grams: int
    length_mm: int
    magazine_capacity: int
    description: str
    attachments: list[AttachmentOut] = []


class LoadoutIn(BaseModel):
    name: str = Field(default="لوداوت من", max_length=255)
    gun_id: int
    attachment_ids: list[int] = []


class LoadoutItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    attachment: AttachmentOut


class LoadoutOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    gun: GunListOut
    items: list[LoadoutItemOut]
    created_at: datetime
    total_price: int = 0


# ---------- ورودی‌های ادمین ----------


class GunIn(BaseModel):
    name: str
    slug: str
    brand: str = ""
    category: GunCategory = GunCategory.rifle
    power_source: str = "aeg"
    fps: int = 0
    weight_grams: int = 0
    length_mm: int = 0
    magazine_capacity: int = 0
    description: str = ""
    price_per_session: int = 0
    stock: int = 0
    photos: list = []
    stats: dict = Field(default_factory=dict)
    is_featured: bool = False
    is_active: bool = True
    attachment_ids: list[int] = []


class AttachmentIn(BaseModel):
    name: str
    slug: str
    slot: AttachmentSlot
    brand: str = ""
    description: str = ""
    price_per_session: int = 0
    stock: int = 0
    photo: str = ""
    stat_modifiers: dict = Field(default_factory=dict)
    is_active: bool = True
    gun_ids: list[int] = []
