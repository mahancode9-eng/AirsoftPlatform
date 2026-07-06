from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from ..config import get_settings
from ..database import get_db
from ..models import (
    Booking,
    BookingStatus,
    EquipmentItem,
    EventTicket,
    Order,
    Payment,
    PaymentKind,
    PaymentStatus,
    Product,
    User,
)
from ..payments import PaymentGatewayError, get_gateway
from ..schemas import PaymentInitIn, PaymentInitOut, PaymentOut
from ..security import get_current_user
from ..settings_service import get_setting

router = APIRouter(prefix="/payments", tags=["payments"])


def _get_target(db: Session, kind: str, ref_id: int, user_id: int):
    """Returns (target_object, amount, description) and validates ownership + pending state."""
    if kind == "booking":
        booking = db.get(Booking, ref_id)
        if not booking or booking.user_id != user_id:
            raise HTTPException(status_code=404, detail="رزرو پیدا نشد")
        if booking.status != BookingStatus.pending_payment:
            raise HTTPException(status_code=400, detail="این رزرو در انتظار پرداخت نیست")
        return booking, booking.total_amount, f"پرداخت رزرو {booking.code}"
    if kind == "event":
        ticket = db.get(EventTicket, ref_id)
        if not ticket or ticket.user_id != user_id:
            raise HTTPException(status_code=404, detail="بلیت پیدا نشد")
        if ticket.status != "pending_payment":
            raise HTTPException(status_code=400, detail="این بلیت در انتظار پرداخت نیست")
        return ticket, ticket.total_amount, f"پرداخت بلیت {ticket.code}"
    if kind == "order":
        order = db.get(Order, ref_id)
        if not order or order.user_id != user_id:
            raise HTTPException(status_code=404, detail="سفارش پیدا نشد")
        if order.status != "pending_payment":
            raise HTTPException(status_code=400, detail="این سفارش در انتظار پرداخت نیست")
        return order, order.total_amount, f"پرداخت سفارش {order.code}"
    raise HTTPException(status_code=400, detail="نوع پرداخت نامعتبر")


@router.post("/init", response_model=PaymentInitOut)
async def init_payment(
    data: PaymentInitIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _target, amount, description = _get_target(db, data.kind, data.ref_id, user.id)
    if amount <= 0:
        raise HTTPException(status_code=400, detail="مبلغ پرداخت نامعتبر است")

    gateway_name = get_setting(db, "payment.active_gateway") or "mock"
    gateway = get_gateway(db, gateway_name)

    payment = Payment(
        user_id=user.id,
        kind=PaymentKind(data.kind),
        ref_id=data.ref_id,
        gateway=gateway.name,
        amount=amount,
        status=PaymentStatus.pending,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    settings = get_settings()
    callback_url = f"{settings.SITE_URL}/api/payments/callback/{payment.id}"
    try:
        authority, redirect_url = await gateway.request_payment(amount, description, callback_url)
    except PaymentGatewayError as exc:
        payment.status = PaymentStatus.failed
        payment.gateway_response = {"error": str(exc)}
        db.commit()
        raise HTTPException(status_code=502, detail=f"خطا در اتصال به درگاه پرداخت: {exc}")

    payment.authority = authority
    db.commit()
    return PaymentInitOut(payment_id=payment.id, redirect_url=redirect_url)


def _apply_success(db: Session, payment: Payment) -> str:
    """Mark the target entity as paid. Returns a display code."""
    if payment.kind == PaymentKind.booking:
        booking = db.get(Booking, payment.ref_id)
        if booking and booking.status == BookingStatus.pending_payment:
            booking.status = BookingStatus.confirmed
            for be in booking.equipment:
                item = db.get(EquipmentItem, be.equipment_id)
                if item:
                    item.stock = max(0, item.stock - be.quantity)
        return booking.code if booking else ""
    if payment.kind == PaymentKind.event:
        ticket = db.get(EventTicket, payment.ref_id)
        if ticket and ticket.status == "pending_payment":
            ticket.status = "paid"
        return ticket.code if ticket else ""
    if payment.kind == PaymentKind.order:
        order = db.get(Order, payment.ref_id)
        if order and order.status == "pending_payment":
            order.status = "paid"
            for oi in order.items:
                product = db.get(Product, oi.product_id)
                if product:
                    product.stock = max(0, product.stock - oi.quantity)
        return order.code if order else ""
    return ""


@router.get("/callback/{payment_id}")
async def payment_callback(payment_id: int, request: Request, db: Session = Depends(get_db)):
    settings = get_settings()
    payment = db.get(Payment, payment_id)
    result_base = f"{settings.SITE_URL}/payment/result"
    if not payment:
        return RedirectResponse(f"{result_base}?status=notfound")
    if payment.status == PaymentStatus.paid:
        return RedirectResponse(
            f"{result_base}?status=success&kind={payment.kind.value}&ref={payment.ref_id}"
        )

    params = dict(request.query_params)
    gateway = get_gateway(db, payment.gateway)
    result = await gateway.verify_payment(payment.authority, payment.amount, params)

    payment.gateway_response = result.raw
    if result.success:
        payment.status = PaymentStatus.paid
        payment.gateway_ref = result.ref_id
        payment.verified_at = datetime.utcnow()
        code = _apply_success(db, payment)
        db.commit()
        return RedirectResponse(
            f"{result_base}?status=success&kind={payment.kind.value}&ref={payment.ref_id}&code={code}&track={result.ref_id}"
        )
    payment.status = PaymentStatus.failed
    db.commit()
    return RedirectResponse(
        f"{result_base}?status=failed&kind={payment.kind.value}&ref={payment.ref_id}"
    )


@router.get("/my", response_model=list[PaymentOut])
def my_payments(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(Payment)
        .filter(Payment.user_id == user.id)
        .order_by(Payment.created_at.desc())
        .all()
    )
