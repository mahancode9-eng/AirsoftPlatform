import httpx

from .base import PaymentGateway, PaymentGatewayError, VerifyResult


class ZarinpalGateway(PaymentGateway):
    """Zarinpal v4 REST API. Amounts are sent in Rial (IRR)."""

    name = "zarinpal"

    def __init__(self, merchant_id: str, sandbox: bool = False):
        self.merchant_id = merchant_id
        base = "sandbox.zarinpal.com" if sandbox else "payment.zarinpal.com"
        self.api_base = f"https://{base}/pg/v4/payment"
        self.start_pay_base = f"https://{base}/pg/StartPay"

    async def request_payment(
        self, amount_toman: int, description: str, callback_url: str
    ) -> tuple[str, str]:
        payload = {
            "merchant_id": self.merchant_id,
            "amount": amount_toman * 10,  # Rial
            "currency": "IRR",
            "description": description,
            "callback_url": callback_url,
        }
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(f"{self.api_base}/request.json", json=payload)
        data = resp.json()
        info = data.get("data") or {}
        if resp.status_code != 200 or info.get("code") != 100:
            errors = data.get("errors") or {}
            raise PaymentGatewayError(
                f"Zarinpal request failed: {errors.get('message') or data}"
            )
        authority = info["authority"]
        return authority, f"{self.start_pay_base}/{authority}"

    async def verify_payment(
        self, authority: str, amount_toman: int, callback_params: dict
    ) -> VerifyResult:
        # Zarinpal redirects back with ?Authority=..&Status=OK|NOK
        if callback_params.get("Status") != "OK":
            return VerifyResult(success=False, message="پرداخت توسط کاربر لغو شد", raw=dict(callback_params))
        payload = {
            "merchant_id": self.merchant_id,
            "amount": amount_toman * 10,
            "authority": authority,
        }
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(f"{self.api_base}/verify.json", json=payload)
        data = resp.json()
        info = data.get("data") or {}
        code = info.get("code")
        if code in (100, 101):  # 101 = already verified
            return VerifyResult(success=True, ref_id=str(info.get("ref_id", "")), raw=data)
        errors = data.get("errors") or {}
        return VerifyResult(success=False, message=str(errors.get("message", "تأیید پرداخت ناموفق")), raw=data)
