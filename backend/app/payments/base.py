"""Payment gateway abstraction.

Every gateway implements:
- request_payment(amount_toman, description, callback_url) -> (authority, redirect_url)
- verify_payment(authority, amount_toman, callback_params) -> VerifyResult

Amounts are handled in **Toman** in the app and converted to Rial where a
gateway requires it.
"""

from dataclasses import dataclass, field


class PaymentGatewayError(Exception):
    """Raised when a gateway call fails."""


@dataclass
class VerifyResult:
    success: bool
    ref_id: str = ""
    raw: dict = field(default_factory=dict)
    message: str = ""


class PaymentGateway:
    name: str = "base"

    async def request_payment(
        self, amount_toman: int, description: str, callback_url: str
    ) -> tuple[str, str]:
        """Returns (authority, redirect_url)."""
        raise NotImplementedError

    async def verify_payment(
        self, authority: str, amount_toman: int, callback_params: dict
    ) -> VerifyResult:
        raise NotImplementedError
