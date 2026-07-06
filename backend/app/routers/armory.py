"""Armory: گان‌ها، اتچمنت‌های سازگار و لوداوت بازیکن‌ها (تسک ۶۰)."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload, selectinload

from ..database import get_db
from ..models import (
    Attachment,
    AttachmentSlot,
    Gun,
    GunCategory,
    Loadout,
    LoadoutItem,
    User,
)
from ..schemas_armory import (
    AttachmentIn,
    AttachmentOut,
    GunDetailOut,
    GunIn,
    GunListOut,
    LoadoutIn,
    LoadoutOut,
)
from ..security import get_current_user, require_admin

router = APIRouter(tags=["armory"])


def _gun_detail(gun: Gun) -> GunDetailOut:
    out = GunDetailOut.model_validate(gun)
    out.attachments = [AttachmentOut.model_validate(a) for a in gun.attachments if a.is_active]
    return out


def _loadout_query(db: Session):
    return db.query(Loadout).options(
        joinedload(Loadout.gun),
        selectinload(Loadout.items).joinedload(LoadoutItem.attachment),
    )


def _loadout_to_out(lo: Loadout) -> LoadoutOut:
    out = LoadoutOut.model_validate(lo)
    gun_price = lo.gun.price_per_session if lo.gun else 0
    out.total_price = gun_price + sum(it.attachment.price_per_session for it in lo.items if it.attachment)
    return out


# ---------------------------- عمومی ----------------------------


@router.get("/guns", response_model=list[GunListOut])
def list_guns(
    category: GunCategory | None = None,
    brand: str | None = None,
    featured: bool | None = None,
    db: Session = Depends(get_db),
):
    q = db.query(Gun).filter(Gun.is_active.is_(True))
    if category:
        q = q.filter(Gun.category == category)
    if brand:
        q = q.filter(Gun.brand == brand)
    if featured is not None:
        q = q.filter(Gun.is_featured.is_(featured))
    return q.order_by(Gun.category, Gun.id).all()


@router.get("/guns/{slug}", response_model=GunDetailOut)
def get_gun(slug: str, db: Session = Depends(get_db)):
    q = db.query(Gun).options(selectinload(Gun.attachments)).filter(Gun.is_active.is_(True))
    gun = q.filter(Gun.slug == slug).first()
    if not gun and slug.isdigit():
        gun = q.filter(Gun.id == int(slug)).first()
    if not gun:
        raise HTTPException(status_code=404, detail="گان پیدا نشد")
    return _gun_detail(gun)


@router.get("/attachments", response_model=list[AttachmentOut])
def list_attachments(
    slot: AttachmentSlot | None = None,
    gun_id: int | None = None,
    db: Session = Depends(get_db),
):
    q = db.query(Attachment).filter(Attachment.is_active.is_(True))
    if slot:
        q = q.filter(Attachment.slot == slot)
    if gun_id:
        q = q.filter(Attachment.guns.any(Gun.id == gun_id))
    return q.order_by(Attachment.slot, Attachment.id).all()


# ---------------------------- لوداوت کاربر ----------------------------


def _validate_loadout_payload(db: Session, data: LoadoutIn) -> tuple[Gun, list[Attachment]]:
    gun = db.get(Gun, data.gun_id)
    if not gun or not gun.is_active:
        raise HTTPException(status_code=404, detail="گان پیدا نشد")
    attachments: list[Attachment] = []
    if data.attachment_ids:
        wanted_ids = set(data.attachment_ids)
        attachments = (
            db.query(Attachment)
            .filter(Attachment.id.in_(wanted_ids), Attachment.is_active.is_(True))
            .all()
        )
        if len(attachments) != len(wanted_ids):
            raise HTTPException(status_code=404, detail="یکی از اتچمنت‌ها پیدا نشد")
        compatible_ids = set(a.id for a in gun.attachments)
        for a in attachments:
            if a.id not in compatible_ids:
                raise HTTPException(status_code=400, detail=f"اتچمنت «{a.name}» با این گان سازگار نیست")
        slots = [a.slot for a in attachments]
        if len(slots) != len(set(slots)):
            raise HTTPException(status_code=400, detail="برای هر اسلات فقط یک اتچمنت انتخاب کنید")
    return gun, attachments


@router.get("/loadouts", response_model=list[LoadoutOut])
def my_loadouts(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = _loadout_query(db).filter(Loadout.user_id == user.id).order_by(Loadout.created_at.desc()).all()
    return [_loadout_to_out(lo) for lo in rows]


@router.post("/loadouts", response_model=LoadoutOut)
def create_loadout(
    data: LoadoutIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    gun, attachments = _validate_loadout_payload(db, data)
    lo = Loadout(user_id=user.id, gun_id=gun.id, name=data.name.strip() or "لوداوت من")
    db.add(lo)
    db.flush()
    for a in attachments:
        db.add(LoadoutItem(loadout_id=lo.id, attachment_id=a.id))
    db.commit()
    lo = _loadout_query(db).filter(Loadout.id == lo.id).first()
    return _loadout_to_out(lo)


@router.put("/loadouts/{loadout_id}", response_model=LoadoutOut)
def update_loadout(
    loadout_id: int,
    data: LoadoutIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    lo = db.query(Loadout).filter(Loadout.id == loadout_id, Loadout.user_id == user.id).first()
    if not lo:
        raise HTTPException(status_code=404, detail="لوداوت پیدا نشد")
    gun, attachments = _validate_loadout_payload(db, data)
    lo.gun_id = gun.id
    lo.name = data.name.strip() or lo.name
    lo.items.clear()
    db.flush()
    for a in attachments:
        db.add(LoadoutItem(loadout_id=lo.id, attachment_id=a.id))
    db.commit()
    lo = _loadout_query(db).filter(Loadout.id == loadout_id).first()
    return _loadout_to_out(lo)


@router.delete("/loadouts/{loadout_id}")
def delete_loadout(
    loadout_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    lo = db.query(Loadout).filter(Loadout.id == loadout_id, Loadout.user_id == user.id).first()
    if not lo:
        raise HTTPException(status_code=404, detail="لوداوت پیدا نشد")
    db.delete(lo)
    db.commit()
    return {"ok": True}


# ---------------------------- ادمین ----------------------------


@router.get("/admin/guns", response_model=list[GunListOut], dependencies=[Depends(require_admin)])
def admin_list_guns(db: Session = Depends(get_db)):
    return db.query(Gun).order_by(Gun.id).all()


@router.post("/admin/guns", response_model=GunDetailOut, dependencies=[Depends(require_admin)])
def admin_create_gun(data: GunIn, db: Session = Depends(get_db)):
    if db.query(Gun).filter(Gun.slug == data.slug).first():
        raise HTTPException(status_code=400, detail="slug تکراری است")
    gun = Gun(**data.model_dump(exclude=set(["attachment_ids"])))
    if data.attachment_ids:
        gun.attachments = db.query(Attachment).filter(Attachment.id.in_(data.attachment_ids)).all()
    db.add(gun)
    db.commit()
    db.refresh(gun)
    return _gun_detail(gun)


@router.put("/admin/guns/{gun_id}", response_model=GunDetailOut, dependencies=[Depends(require_admin)])
def admin_update_gun(gun_id: int, data: GunIn, db: Session = Depends(get_db)):
    gun = db.get(Gun, gun_id)
    if not gun:
        raise HTTPException(status_code=404, detail="گان پیدا نشد")
    dup = db.query(Gun).filter(Gun.slug == data.slug, Gun.id != gun_id).first()
    if dup:
        raise HTTPException(status_code=400, detail="slug تکراری است")
    payload = data.model_dump(exclude=set(["attachment_ids"]))
    for key, value in payload.items():
        setattr(gun, key, value)
    gun.attachments = (
        db.query(Attachment).filter(Attachment.id.in_(data.attachment_ids)).all()
        if data.attachment_ids
        else []
    )
    db.commit()
    db.refresh(gun)
    return _gun_detail(gun)


@router.delete("/admin/guns/{gun_id}", dependencies=[Depends(require_admin)])
def admin_delete_gun(gun_id: int, db: Session = Depends(get_db)):
    gun = db.get(Gun, gun_id)
    if not gun:
        raise HTTPException(status_code=404, detail="گان پیدا نشد")
    gun.is_active = False
    db.commit()
    return {"ok": True}


@router.get("/admin/attachments", response_model=list[AttachmentOut], dependencies=[Depends(require_admin)])
def admin_list_attachments(db: Session = Depends(get_db)):
    return db.query(Attachment).order_by(Attachment.slot, Attachment.id).all()


@router.post("/admin/attachments", response_model=AttachmentOut, dependencies=[Depends(require_admin)])
def admin_create_attachment(data: AttachmentIn, db: Session = Depends(get_db)):
    if db.query(Attachment).filter(Attachment.slug == data.slug).first():
        raise HTTPException(status_code=400, detail="slug تکراری است")
    att = Attachment(**data.model_dump(exclude=set(["gun_ids"])))
    if data.gun_ids:
        att.guns = db.query(Gun).filter(Gun.id.in_(data.gun_ids)).all()
    db.add(att)
    db.commit()
    db.refresh(att)
    return att


@router.put("/admin/attachments/{attachment_id}", response_model=AttachmentOut, dependencies=[Depends(require_admin)])
def admin_update_attachment(attachment_id: int, data: AttachmentIn, db: Session = Depends(get_db)):
    att = db.get(Attachment, attachment_id)
    if not att:
        raise HTTPException(status_code=404, detail="اتچمنت پیدا نشد")
    dup = db.query(Attachment).filter(Attachment.slug == data.slug, Attachment.id != attachment_id).first()
    if dup:
        raise HTTPException(status_code=400, detail="slug تکراری است")
    payload = data.model_dump(exclude=set(["gun_ids"]))
    for key, value in payload.items():
        setattr(att, key, value)
    att.guns = db.query(Gun).filter(Gun.id.in_(data.gun_ids)).all() if data.gun_ids else []
    db.commit()
    db.refresh(att)
    return att


@router.delete("/admin/attachments/{attachment_id}", dependencies=[Depends(require_admin)])
def admin_delete_attachment(attachment_id: int, db: Session = Depends(get_db)):
    att = db.get(Attachment, attachment_id)
    if not att:
        raise HTTPException(status_code=404, detail="اتچمنت پیدا نشد")
    att.is_active = False
    db.commit()
    return {"ok": True}
