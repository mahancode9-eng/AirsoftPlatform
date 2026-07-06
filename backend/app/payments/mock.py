"""Mock gateway for local development and manual testing.

It immediately redirects the user to the callback URL with a fake token.
Verification always succeeds. NEVER use in production.
"""

import secrets
from urllib.parse import urlencode

from .base import PaymentGateway, VerifyResult


class MockGateway(PaymentGateway):
    name = "mock"

    async def request_payment(
        self, amount_toman: int, description: str, callback_url: str
    ) -> tuple[str, str]:
        authority = "MOCK-" + secrets.token_hex(8)
        sep = "&" if "?" in callback_url else "?"
        redirect = f"{callback_url}{sep}" + urlencode({"mock": "1", "Status": "OK"})
        return authority, redirect

    async def verify_payment(
        self, authority: str, amount_toman: int, callback_params: dict
    ) -> VerifyResult:
        return VerifyResult(success=True, ref_id="MOCK-REF-" + authority[-6:], raw={"mock": True})
