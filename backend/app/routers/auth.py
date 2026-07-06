from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import PlayerStats, User
from ..schemas import LoginIn, RegisterIn, TokenOut, UserOut, UserUpdateIn
from ..security import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenOut)
def register(data: RegisterIn, db: Session = Depends(get_db)):
    phone = data.phone.strip()
    if db.query(User).filter(User.phone == phone).first():
        raise HTTPException(status_code=400, detail="این شماره موبایل قبلاً ثبت شده است")
    user = User(
        phone=phone,
        full_name=data.full_name.strip(),
        email=(data.email or "").strip() or None,
        password_hash=hash_password(data.password),
    )
    db.add(user)
    db.flush()
    db.add(PlayerStats(user_id=user.id))
    db.commit()
    return TokenOut(access_token=create_access_token(user.id))


@router.post("/login", response_model=TokenOut)
def login(data: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == data.phone.strip()).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="شماره موبایل یا رمز عبور اشتباه است")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="حساب کاربری شما غیرفعال شده است")
    return TokenOut(access_token=create_access_token(user.id))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


@router.patch("/me", response_model=UserOut)
def update_me(
    data: UserUpdateIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.full_name:
        user.full_name = data.full_name.strip()
    if data.email is not None:
        user.email = data.email.strip() or None
    if data.password:
        user.password_hash = hash_password(data.password)
    db.commit()
    db.refresh(user)
    return user
