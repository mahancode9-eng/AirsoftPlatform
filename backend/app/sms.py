"""SMS helper (Kavenegar). Fails silently if not configured."""

import logging

import httpx

from .config import get_settings

logger = logging.getLogger(__name__)


async def send_sms(receptor: str, message: str) -> bool:
    settings = get_settings()
    if not settings.KAVENEGAR_API_KEY:
        logger.info("SMS not configured; skipping message to %s", receptor)
        return False
    try:
        params = {"receptor": receptor, "message": message}
        if settings.SMS_SENDER:
            params["sender"] = settings.SMS_SENDER
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"https://api.kavenegar.com/v1/{settings.KAVENEGAR_API_KEY}/sms/send.json",
                params=params,
            )
        return resp.status_code == 200
    except Exception:  # noqa: BLE001
        logger.exception("Failed to send SMS")
        return False
