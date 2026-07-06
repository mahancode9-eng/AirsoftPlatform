from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------- Auth ----------
class RegisterIn(BaseModel):
    phone: str = Field(min_length=10, max_length=15)
    full_name: str = Field(min_length=2, max_length=100)
    password: str = Field(min_length=6, max_length=128)
    email: str | None = None


class LoginIn(BaseModel):
    phone: str
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(ORMModel):
    id: int
    phone: str
    email: str | None
    full_name: str
    role: str
    created_at: datetime


class UserUpdateIn(BaseModel):
    full_name: str | None = None
    email: str | None = None
    password: str | None = Field(default=None, min_length=6)


# ---------- Fields ----------
class FieldOut(ORMModel):
    id: int
    name: str
    slug: str
    description: str
    field_type: str
    address: str
    capacity: int
    features: dict
    photos: list
    is_active: bool


class FieldIn(BaseModel):
    name: str
    slug: str
    description: str = ""
    field_type: str = "outdoor"
    address: str = ""
    capacity: int = 20
    features: dict = {}
    photos: list = []
    is_active: bool = True


# ---------- Sessions ----------
class SessionOut(ORMModel):
    id: int
    field_id: int
    title: str
    session_type: str
    start_time: datetime
    end_time: datetime
    capacity: int
    price_per_player: int
    is_active: bool
    remaining_capacity: int | None = None
    field: FieldOut | None = None


class SessionIn(BaseModel):
    field_id: int
    title: str = ""
    session_type: str = "open_play"
    start_time: datetime
    end_time: datetime
    capacity: int = 20
    price_per_player: int = 0
    is_active: bool = True


# ---------- Equipment ----------
class EquipmentOut(ORMModel):
    id: int
    name: str
    description: str
    category: str
    price_per_session: int
    stock: int
    photo: str
    is_active: bool


class EquipmentIn(BaseModel):
    name: str
    description: str = ""
    category: str = "package"
    price_per_session: int = 0
    stock: int = 0
    photo: str = ""
    is_active: bool = True


# ---------- Bookings ----------
class BookingEquipmentIn(BaseModel):
    equipment_id: int
    quantity: int = Field(ge=1, default=1)


class BookingCreateIn(BaseModel):
    session_id: int
    num_players: int = Field(ge=1, le=100, default=1)
    is_group: bool = False
    group_name: str = ""
    note: str = ""
    equipment: list[BookingEquipmentIn] = []


class BookingEquipmentOut(ORMModel):
    equipment_id: int
    quantity: int
    unit_price: int
    item: EquipmentOut | None = None


class WaiverOut(ORMModel):
    id: int
    full_name: str
    national_id: str
    emergency_phone: str
    accepted_rules: bool
    signed_at: datetime


class BookingOut(ORMModel):
    id: int
    code: str
    session_id: int
    num_players: int
    is_group: bool
    group_name: str
    note: str
    status: str
    total_amount: int
    created_at: datetime
    session: SessionOut | None = None
    equipment: list[BookingEquipmentOut] = []
    waiver: WaiverOut | None = None


class WaiverIn(BaseModel):
    booking_id: int
    full_name: str = Field(min_length=3)
    national_id: str = Field(min_length=8, max_length=12)
    emergency_phone: str = Field(min_length=10, max_length=15)
    accepted_rules: bool


# ---------- Events ----------
class EventOut(ORMModel):
    id: int
    title: str
    description: str
    event_type: str
    field_id: int | None
    start_time: datetime
    end_time: datetime
    ticket_price: int
    capacity: int
    cover_photo: str
    is_active: bool
    sold_tickets: int | None = None


class EventIn(BaseModel):
    title: str
    description: str = ""
    event_type: str = "scenario"
    field_id: int | None = None
    start_time: datetime
    end_time: datetime
    ticket_price: int = 0
    capacity: int = 50
    cover_photo: str = ""
    is_active: bool = True


class TicketBuyIn(BaseModel):
    event_id: int
    quantity: int = Field(ge=1, le=20, default=1)


class TicketOut(ORMModel):
    id: int
    code: str
    event_id: int
    quantity: int
    total_amount: int
    status: str
    created_at: datetime
    event: EventOut | None = None


# ---------- Teams & Leagues ----------
class TeamCreateIn(BaseModel):
    name: str = Field(min_length=2, max_length=50)
    tag: str = Field(max_length=10, default="")


class TeamMemberOut(ORMModel):
    user_id: int
    joined_at: datetime
    user: UserOut | None = None


class TeamOut(ORMModel):
    id: int
    name: str
    tag: str
    logo: str
    captain_id: int
    created_at: datetime
    members: list[TeamMemberOut] = []


class LeagueOut(ORMModel):
    id: int
    name: str
    season: str
    description: str
    status: str


class LeagueIn(BaseModel):
    name: str
    season: str = ""
    description: str = ""
    status: str = "open"


class MatchOut(ORMModel):
    id: int
    league_id: int
    team_a_id: int
    team_b_id: int
    field_id: int | None
    scheduled_at: datetime
    score_a: int
    score_b: int
    status: str
    team_a: TeamOut | None = None
    team_b: TeamOut | None = None


class MatchIn(BaseModel):
    league_id: int
    team_a_id: int
    team_b_id: int
    field_id: int | None = None
    scheduled_at: datetime


class MatchResultIn(BaseModel):
    score_a: int = Field(ge=0)
    score_b: int = Field(ge=0)


class StandingOut(BaseModel):
    team_id: int
    team_name: str
    team_tag: str
    played: int
    wins: int
    draws: int
    losses: int
    points: int


# ---------- Reviews / Gallery ----------
class ReviewIn(BaseModel):
    field_id: int
    rating: int = Field(ge=1, le=5)
    comment: str = Field(max_length=2000, default="")


class ReviewOut(ORMModel):
    id: int
    field_id: int
    rating: int
    comment: str
    created_at: datetime
    is_approved: bool
    user: UserOut | None = None


class GalleryOut(ORMModel):
    id: int
    title: str
    image_url: str
    field_id: int | None
    created_at: datetime


class GalleryIn(BaseModel):
    title: str = ""
    image_url: str
    field_id: int | None = None


# ---------- Shop ----------
class ProductOut(ORMModel):
    id: int
    name: str
    description: str
    category: str
    price: int
    stock: int
    photo: str
    is_active: bool


class ProductIn(BaseModel):
    name: str
    description: str = ""
    category: str = "accessory"
    price: int = 0
    stock: int = 0
    photo: str = ""
    is_active: bool = True


class OrderItemIn(BaseModel):
    product_id: int
    quantity: int = Field(ge=1, default=1)


class OrderCreateIn(BaseModel):
    items: list[OrderItemIn] = Field(min_length=1)
    shipping_address: str = ""


class OrderItemOut(ORMModel):
    product_id: int
    quantity: int
    unit_price: int
    product: ProductOut | None = None


class OrderOut(ORMModel):
    id: int
    code: str
    status: str
    total_amount: int
    shipping_address: str
    created_at: datetime
    items: list[OrderItemOut] = []


# ---------- Payments ----------
class PaymentInitIn(BaseModel):
    kind: str  # booking / event / order
    ref_id: int


class PaymentInitOut(BaseModel):
    payment_id: int
    redirect_url: str


class PaymentOut(ORMModel):
    id: int
    kind: str
    ref_id: int
    gateway: str
    amount: int
    status: str
    gateway_ref: str
    created_at: datetime
    verified_at: datetime | None


# ---------- Player profile ----------
class PlayerStatsOut(ORMModel):
    games_played: int
    wins: int
    losses: int
    kills: int
    deaths: int


class ProfileOut(BaseModel):
    user: UserOut
    stats: PlayerStatsOut | None = None
    team: TeamOut | None = None
