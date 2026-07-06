from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Order, OrderItem, Product, User
from ..schemas import OrderCreateIn, OrderOut, ProductOut
from ..security import get_current_user

router = APIRouter(tags=["shop"])


@router.get("/products", response_model=list[ProductOut])
def list_products(category: str | None = None, db: Session = Depends(get_db)):
    q = db.query(Product).filter(Product.is_active.is_(True))
    if category:
        q = q.filter(Product.category == category)
    return q.order_by(Product.id.desc()).all()


@router.get("/products/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if not product or not product.is_active:
        raise HTTPException(status_code=404, detail="محصول پیدا نشد")
    return product


@router.post("/orders", response_model=OrderOut)
def create_order(
    data: OrderCreateIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    total = 0
    items: list[OrderItem] = []
    for entry in data.items:
        product = db.get(Product, entry.product_id)
        if not product or not product.is_active:
            raise HTTPException(status_code=404, detail="محصول پیدا نشد")
        if entry.quantity > product.stock:
            raise HTTPException(
                status_code=400,
                detail=f"موجودی «{product.name}» کافی نیست (موجودی: {product.stock})",
            )
        total += product.price * entry.quantity
        items.append(
            OrderItem(
                product_id=product.id,
                quantity=entry.quantity,
                unit_price=product.price,
            )
        )
    order = Order(
        user_id=user.id,
        total_amount=total,
        shipping_address=data.shipping_address.strip(),
        items=items,
        status="paid" if total == 0 else "pending_payment",
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return _load_order(db, order.id)


def _load_order(db: Session, order_id: int) -> Order:
    return (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product))
        .filter(Order.id == order_id)
        .first()
    )


@router.get("/orders/my", response_model=list[OrderOut])
def my_orders(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product))
        .filter(Order.user_id == user.id)
        .order_by(Order.created_at.desc())
        .all()
    )
