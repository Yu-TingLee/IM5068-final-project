import hashlib
import hmac
import re
import secrets
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db import utc_now
from app.models import Coupon, Customer, Redemption, Referral, ReferralCode, Store
from app.security import (
    end_sessions_for,
    hash_secret,
    new_setup_code,
    normalize_setup_code,
    verify_secret,
)

ACCOUNT_PATTERN = re.compile(r"[a-z0-9_]{3,20}")
DISPLAY_NAME_MAX_LENGTH = 20
PASSWORD_MIN_LENGTH = 8
STORE_CODE_PATTERN = re.compile(r"[A-Z0-9]{2,20}")

COUPON_LIFETIME = timedelta(days=90)
MAX_UNUSED_COUPONS = 15
COUNTER_CODE_WINDOW = timedelta(minutes=10)

WELCOME_FACE_VALUE = 50
WELCOME_MIN_SPEND = 100
REFERRAL_FACE_VALUE = 100
REFERRAL_MIN_SPEND = 500
REWARD_PERCENT = 25
REWARD_MIN_SPEND = 200

PLATFORM_FEE_PERCENT = 19
CHARITY_CONTRIBUTION_PERCENT = 1

_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


class DomainError(Exception):
    def __init__(self, code: str, status: int = 400):
        super().__init__(code)
        self.code = code
        self.status = status


@dataclass
class RedeemResult:
    redemption: Redemption
    reward_issued: bool
    became_partner: bool


def register_customer(db: Session, account: str, display_name: str, password: str) -> Customer:
    display_name = display_name.strip()
    if not ACCOUNT_PATTERN.fullmatch(account):
        raise DomainError("invalid_account")
    # "/" separates the Store name from the display name in a Referral Code.
    if not display_name or len(display_name) > DISPLAY_NAME_MAX_LENGTH or "/" in display_name:
        raise DomainError("invalid_display_name")
    if len(password) < PASSWORD_MIN_LENGTH:
        raise DomainError("weak_password")
    if db.scalar(select(Customer.id).where(Customer.account == account)):
        raise DomainError("account_taken", 409)
    if db.scalar(select(Customer.id).where(Customer.display_name == display_name)):
        raise DomainError("display_name_taken", 409)

    customer = Customer(
        account=account, display_name=display_name, password_hash=hash_secret(password)
    )
    db.add(customer)
    db.commit()
    return customer


def find_store(db: Session, code: str) -> Store | None:
    return db.scalar(select(Store).where(Store.code == code.strip().upper()))


def create_store(
    db: Session, code: str, name: str, charity_name: str, password: str | None = None
) -> tuple[Store, str | None]:
    """Returns the new Store and, unless a password was given, its one-time Setup Code."""
    code, name, charity_name = code.strip().upper(), name.strip(), charity_name.strip()
    if not STORE_CODE_PATTERN.fullmatch(code):
        raise DomainError("invalid_store_code")
    if not name or not charity_name:
        raise DomainError("missing_store_details")
    if db.scalar(select(Store.id).where((Store.code == code) | (Store.name == name))):
        raise DomainError("store_exists", 409)

    store = Store(
        code=code, name=name, charity_name=charity_name, counter_secret=secrets.token_hex(32)
    )
    setup_code = None
    if password:
        store.admin_password_hash = hash_secret(password)
    else:
        setup_code = _issue_setup_code(store)
    db.add(store)
    db.commit()
    return store, setup_code


def reset_store(db: Session, code: str) -> str:
    store = find_store(db, code)
    if store is None:
        raise DomainError("store_not_found", 404)
    setup_code = _issue_setup_code(store)
    end_sessions_for(db, "store", store.id)
    db.commit()
    return setup_code


def set_up_store(db: Session, code: str, setup_code: str, password: str) -> Store:
    store = find_store(db, code)
    if (
        store is None
        or store.setup_code_hash is None
        or not verify_secret(normalize_setup_code(setup_code), store.setup_code_hash)
    ):
        raise DomainError("invalid_setup_code", 401)
    if len(password) < PASSWORD_MIN_LENGTH:
        raise DomainError("weak_password")
    store.admin_password_hash = hash_secret(password)
    store.setup_code_hash = None
    db.commit()
    return store


def current_counter_code(store: Store) -> tuple[str, datetime]:
    window = _counter_window(utc_now())
    expires_at = datetime.fromtimestamp((window + 1) * COUNTER_CODE_WINDOW.total_seconds(), tz=UTC)
    return _counter_code(store, window), expires_at


def claim_welcome_coupon(db: Session, customer: Customer, counter_code: str) -> Coupon:
    store = _store_for_counter_code(db, counter_code)
    _check_first_coupon_allowed(db, customer, store)
    coupon = _issue_coupon(db, customer, store, "welcome", WELCOME_FACE_VALUE, WELCOME_MIN_SPEND)
    db.commit()
    return coupon


def claim_referral_coupon(db: Session, customer: Customer, code: str) -> Coupon:
    code = code.strip()
    if not code:
        raise DomainError("referral_code_not_found", 404)

    referral_code = db.scalar(
        select(ReferralCode).where(
            (func.lower(ReferralCode.code) == code.lower())
            | (func.upper(ReferralCode.short_code) == code.upper())
        )
    )
    if referral_code is None:
        raise DomainError("referral_code_not_found", 404)
    if referral_code.customer_id == customer.id:
        raise DomainError("own_referral_code")

    store = referral_code.store
    _check_first_coupon_allowed(db, customer, store)
    coupon = _issue_coupon(db, customer, store, "referral", REFERRAL_FACE_VALUE, REFERRAL_MIN_SPEND)
    db.add(
        Referral(
            store_id=store.id,
            referral_code_id=referral_code.id,
            referrer_id=referral_code.customer_id,
            referee_id=customer.id,
            coupon_id=coupon.id,
        )
    )
    db.commit()
    return coupon


def redeem_coupon(
    db: Session, customer: Customer, coupon_id: int, counter_code: str
) -> RedeemResult:
    coupon = db.get(Coupon, coupon_id)
    if coupon is None or coupon.customer_id != customer.id:
        raise DomainError("coupon_not_found", 404)
    if coupon.status(utc_now()) != "unused":
        raise DomainError("coupon_not_usable")

    store = coupon.store
    if not _matches_counter_code(store, counter_code):
        raise DomainError("wrong_counter_code", 403)

    redemption = _record_redemption(db, coupon, store)

    reward_issued = False
    referral = db.scalar(select(Referral).where(Referral.coupon_id == coupon.id))
    if referral is not None:
        referrer = db.get(Customer, referral.referrer_id)
        reward = _issue_coupon(
            db,
            referrer,
            store,
            "reward",
            coupon.face_value * REWARD_PERCENT // 100,
            REWARD_MIN_SPEND,
        )
        referral.reward_coupon_id = reward.id
        referral.redeemed_at = redemption.redeemed_at
        reward_issued = True

    became_partner = False
    if _find_referral_code(db, store, customer) is None:
        _create_referral_code(db, store, customer)
        became_partner = True

    db.commit()
    return RedeemResult(redemption, reward_issued, became_partner)


def count_unused_coupons(db: Session, customer: Customer) -> int:
    return db.scalar(
        select(func.count(Coupon.id)).where(
            Coupon.customer_id == customer.id,
            Coupon.redeemed_at.is_(None),
            Coupon.expires_at > utc_now(),
        )
    )


def _counter_window(at: datetime) -> int:
    return int(at.timestamp() // COUNTER_CODE_WINDOW.total_seconds())


def _counter_code(store: Store, window: int) -> str:
    digest = hmac.new(store.counter_secret.encode(), str(window).encode(), hashlib.sha256)
    return f"{int.from_bytes(digest.digest()[:4]) % 1_000_000:06d}"


def _matches_counter_code(store: Store, code: str) -> bool:
    # The previous window still counts, so a code read out just before it changes works.
    window = _counter_window(utc_now())
    return any(
        hmac.compare_digest(code.strip(), _counter_code(store, w)) for w in (window, window - 1)
    )


def _store_for_counter_code(db: Session, code: str) -> Store:
    matches = [store for store in db.scalars(select(Store)) if _matches_counter_code(store, code)]
    if len(matches) != 1:
        raise DomainError("wrong_counter_code", 403)
    return matches[0]


def _check_first_coupon_allowed(db: Session, customer: Customer, store: Store) -> None:
    """A Customer gets one Welcome or Referral Coupon per Store, whichever comes first."""
    already_claimed = db.scalar(
        select(Coupon.id).where(
            Coupon.store_id == store.id,
            Coupon.customer_id == customer.id,
            Coupon.kind.in_(["welcome", "referral"]),
        )
    )
    if already_claimed is not None:
        raise DomainError("already_claimed")
    if count_unused_coupons(db, customer) >= MAX_UNUSED_COUPONS:
        raise DomainError("wallet_full")


def _issue_setup_code(store: Store) -> str:
    setup_code = new_setup_code()
    store.setup_code_hash = hash_secret(normalize_setup_code(setup_code))
    store.admin_password_hash = None
    return setup_code


def _find_referral_code(db: Session, store: Store, customer: Customer) -> ReferralCode | None:
    return db.scalar(
        select(ReferralCode).where(
            ReferralCode.store_id == store.id, ReferralCode.customer_id == customer.id
        )
    )


def _create_referral_code(db: Session, store: Store, customer: Customer) -> ReferralCode:
    referral_code = ReferralCode(
        store_id=store.id,
        customer_id=customer.id,
        code=f"{store.name}/{customer.display_name}",
        short_code=_unique_code(db, ReferralCode.short_code, "LF-"),
    )
    db.add(referral_code)
    db.flush()
    return referral_code


def _issue_coupon(
    db: Session, customer: Customer, store: Store, kind: str, face_value: int, min_spend: int
) -> Coupon:
    now = utc_now()
    prefix = {"welcome": "CP-WC-", "referral": "CP-RF-", "reward": "CP-RW-"}[kind]
    coupon = Coupon(
        customer_id=customer.id,
        store_id=store.id,
        kind=kind,
        code=_unique_code(db, Coupon.code, prefix),
        face_value=face_value,
        min_spend=min_spend,
        issued_at=now,
        expires_at=now + COUPON_LIFETIME,
    )
    db.add(coupon)
    db.flush()
    return coupon


def _record_redemption(db: Session, coupon: Coupon, store: Store) -> Redemption:
    now = utc_now()
    coupon.redeemed_at = now
    redemption = Redemption(
        coupon_id=coupon.id,
        customer_id=coupon.customer_id,
        store_id=store.id,
        charity_name=store.charity_name,
        amount=coupon.face_value,
        # NT$ x percent / 100, expressed in cents.
        platform_fee_cents=coupon.face_value * PLATFORM_FEE_PERCENT,
        charity_contribution_cents=coupon.face_value * CHARITY_CONTRIBUTION_PERCENT,
        hearts=max(1, coupon.face_value // 100),
        redeemed_at=now,
    )
    db.add(redemption)
    db.flush()
    return redemption


def _unique_code(db: Session, column, prefix: str) -> str:
    while True:
        code = prefix + "".join(secrets.choice(_CODE_ALPHABET) for _ in range(6))
        if db.scalar(select(column).where(column == code)) is None:
            return code
