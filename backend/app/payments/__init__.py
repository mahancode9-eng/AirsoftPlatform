from sqlalchemy.orm import Session

from ..settings_service import get_setting
from .base import PaymentGateway, PaymentGatewayError, VerifyResult
from .idpay import IdpayGateway
from .mock import MockGateway
from .zarinpal import ZarinpalGateway
from .zibal import ZibalGateway

GATEWAY_NAMES = ["zarinpal", "zibal", "idpay", "mock"]


def get_gateway(db: Session, name: str | None = None) -> PaymentGateway:
    """Build the active (or requested) gateway from DB-stored settings."""
    gateway_name = name or get_setting(db, "payment.active_gateway") or "mock"
    if gateway_name == "zarinpal":
        return ZarinpalGateway(
            merchant_id=get_setting(db, "payment.zarinpal.merchant_id"),
            sandbox=get_setting(db, "payment.zarinpal.sandbox").lower() == "true",
        )
    if gateway_name == "zibal":
        return ZibalGateway(merchant=get_setting(db, "payment.zibal.merchant"))
    if gateway_name == "idpay":
        return IdpayGateway(
            api_key=get_setting(db, "payment.idpay.api_key"),
            sandbox=get_setting(db, "payment.idpay.sandbox").lower() == "true",
        )
    return MockGateway()


__all__ = [
    "PaymentGateway",
    "PaymentGatewayError",
    "VerifyResult",
    "get_gateway",
    "GATEWAY_NAMES",
]
