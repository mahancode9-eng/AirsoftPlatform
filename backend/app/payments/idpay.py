import httpx

from .base import PaymentGateway, PaymentGatewayError, VerifyResult


class IdpayGateway(PaymentGateway):
    """IDPay IPG. Amounts are sent in Rial. Sandbox via X-SANDBOX header."""

    name = "idpay"
    API_BASE = "https://api.idpay.ir/v1.1"

    def __init__(self, api_key: str, sandbox: bool = False):
        self.api_key = api_key
        self.sandbox = sandbox

    def _headers(self) -> dict:
        headers = {"X-API-KEY": self.api_key, "Content-Type": "application/json"}
        if self.sandbox:
            headers["X-SANDBOX"] = "1"
        return headers

    async def request_payment(
        self, amount_toman: int, description: str, callback_url: str
    ) -> tuple[str, str]:
        import uuid

        order_id = uuid.uuid4().hex[:16]
        payload = {
            "order_id": order_id,
            "amount": amount_toman * 10,  # Rial
            "desc": description,
            "callback": callback_url,
        }
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(f"{self.API_BASE}/payment", json=payload, headers=self._headers())
        data = resp.json()
        if resp.status_code not in (200, 201) or "id" not in data:
            raise PaymentGatewayError(f"IDPay request failed: {data.get('error_message') or data}")
        # authority stores both id and order_id, joined with ':'
        authority = f"{data['id']}:{order_id}"
        return authority, data["link"]

    async def verify_payment(
        self, authority: str, amount_toman: int, callback_params: dict
    ) -> VerifyResult:
        # IDPay posts/redirects back with id, order_id, status (10 = valid, waiting for verify)
        try:
            payment_id, order_id = authority.split(":", 1)
        except ValueError:
            return VerifyResult(success=False, message="شناسه پرداخت نامعتبر", raw=dict(callback_params))
        payload = {"id": payment_id, "order_id": order_id}
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(f"{self.API_BASE}/payment/verify", json=payload, headers=self._headers())
        data = resp.json()
        # status 100 = verified, 101 = already verified
        if resp.status_code == 200 and int(data.get("status", 0)) in (100, 101):
            return VerifyResult(success=True, ref_id=str(data.get("track_id", "")), raw=data)
        return VerifyResult(success=False, message=str(data.get("error_message", "تأیید پرداخت ناموفق")), raw=data)
