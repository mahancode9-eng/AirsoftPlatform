"""Runtime settings stored in DB (payment gateway config, site info, ...).

Secrets like merchant IDs are stored in the `settings` table so the admin
can switch gateways from the panel without redeploying.
"""

from sqlalchemy.orm import Session

from .models import Setting

# key -> default value
DEFAULTS: dict[str, str] = {
    # active gateway: zarinpal / zibal / idpay / mock
    "payment.active_gateway": "mock",
    # zarinpal
    "payment.zarinpal.merchant_id": "",
    "payment.zarinpal.sandbox": "true",
    # zibal
    "payment.zibal.merchant": "zibal",  # "zibal" = official test merchant
    # idpay
    "payment.idpay.api_key": "",
    "payment.idpay.sandbox": "true",
    # site
    "site.name": "باشگاه ایرسافت",
    "site.phone": "",
    "site.instagram": "",
    "site.telegram": "",
    "site.rules": "۱. استفاده از محافظ چشم در تمام طول بازی الزامی است.\n۲. شلیک از فاصله کمتر از ۵ متر ممنوع است.\n۳. پس از اصابت، دست خود را بالا ببرید و زمین را ترک کنید.",
}

SECRET_KEYS = {
    "payment.zarinpal.merchant_id",
    "payment.zibal.merchant",
    "payment.idpay.api_key",
}


def get_setting(db: Session, key: str) -> str:
    row = db.get(Setting, key)
    if row is not None:
        return row.value
    return DEFAULTS.get(key, "")


def set_setting(db: Session, key: str, value: str) -> None:
    row = db.get(Setting, key)
    if row is None:
        row = Setting(key=key, value=value)
        db.add(row)
    else:
        row.value = value


def all_settings(db: Session, include_secrets: bool = False) -> dict[str, str]:
    result = dict(DEFAULTS)
    for row in db.query(Setting).all():
        result[row.key] = row.value
    if not include_secrets:
        for key in SECRET_KEYS:
            if result.get(key):
                result[key] = "***" + result[key][-4:] if len(result[key]) > 4 else "***"
    return result
