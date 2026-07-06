import httpx

from .base import PaymentGateway, PaymentGatewayError, VerifyResult


class ZibalGateway(PaymentGateway):
    """Zibal IPG. Amounts are sent in Rial. merchant="zibal" is the official test merchant."""

    name = "zibal"
    API_BASE = "https://gateway.zibal.ir"

    def __init__(self, merchant: str):
        self.merchant = merchant or "zibal"

    async def request_payment(
        self, amount_toman: int, description: str, callback_url: str
    ) -> tuple[str, str]:
        payload = {
            "merchant": self.merchant,
            "amount": amount_toman * 10,  # Rial
            "callbackUrl": callback_url,
            "description": description,
        }
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(f"{self.API_BASE}/v1/request", json=payload)
        data = resp.json()
        if data.get("result") != 100:
            raise PaymentGatewayError(f"Zibal request failed: {data.get('message') or data}")
        track_id = str(data["trackId"])
        return track_id, f"{self.API_BASE}/start/{track_id}"

    async def verify_payment(
        self, authority: str, amount_toman: int, callback_params: dict
    ) -> VerifyResult:
        # Zibal redirects back with ?trackId=..&success=1|0&status=..
        if str(callback_params.get("success", "")) != "1":
            return VerifyResult(success=False, message="پرداخت ناموفق یا لغو شد", raw=dict(callback_params))
        payload = {"merchant": self.merchant, "trackId": int(authority)}
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(f"{self.API_BASE}/v1/verify", json=payload)
        data = resp.json()
        if data.get("result") in (100, 201):  # 201 = already verified
            return VerifyResult(success=True, ref_id=str(data.get("refNumber", "")), raw=data)
        return VerifyResult(success=False, message=str(data.get("message", "تأیید پرداخت ناموفق")), raw=data)
