from datetime import datetime

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base, UTCDateTime, utc_now


class Store(Base):
    __tablename__ = "stores"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(20), unique=True)
    name: Mapped[str] = mapped_column(unique=True)
    charity_name: Mapped[str]
    counter_secret: Mapped[str] = mapped_column(String(64))
    admin_password_hash: Mapped[str | None]
    setup_code_hash: Mapped[str | None]


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(primary_key=True)
    account: Mapped[str] = mapped_column(String(20), unique=True)
    display_name: Mapped[str] = mapped_column(String(20), unique=True)
    password_hash: Mapped[str]
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utc_now)


class ReferralCode(Base):
    __tablename__ = "referral_codes"
    __table_args__ = (UniqueConstraint("store_id", "customer_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id"))
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"))
    code: Mapped[str] = mapped_column(unique=True)
    short_code: Mapped[str] = mapped_column(String(12), unique=True)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utc_now)

    store: Mapped[Store] = relationship()
    customer: Mapped[Customer] = relationship()


class Coupon(Base):
    __tablename__ = "coupons"

    id: Mapped[int] = mapped_column(primary_key=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"))
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id"))
    kind: Mapped[str] = mapped_column(String(20))  # "welcome" | "referral" | "reward"
    code: Mapped[str] = mapped_column(String(16), unique=True)
    face_value: Mapped[int]
    min_spend: Mapped[int]
    issued_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utc_now)
    expires_at: Mapped[datetime] = mapped_column(UTCDateTime)
    redeemed_at: Mapped[datetime | None] = mapped_column(UTCDateTime)

    store: Mapped[Store] = relationship()

    def status(self, now: datetime) -> str:
        if self.redeemed_at is not None:
            return "redeemed"
        if self.expires_at <= now:
            return "expired"
        return "unused"


class Referral(Base):
    __tablename__ = "referrals"

    id: Mapped[int] = mapped_column(primary_key=True)
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id"))
    referral_code_id: Mapped[int] = mapped_column(ForeignKey("referral_codes.id"))
    referrer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"))
    referee_id: Mapped[int] = mapped_column(ForeignKey("customers.id"))
    coupon_id: Mapped[int] = mapped_column(ForeignKey("coupons.id"), unique=True)
    reward_coupon_id: Mapped[int | None] = mapped_column(ForeignKey("coupons.id"))
    claimed_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utc_now)
    redeemed_at: Mapped[datetime | None] = mapped_column(UTCDateTime)

    store: Mapped[Store] = relationship()
    referee: Mapped[Customer] = relationship(foreign_keys=[referee_id])
    reward_coupon: Mapped[Coupon | None] = relationship(foreign_keys=[reward_coupon_id])


class Redemption(Base):
    __tablename__ = "redemptions"

    id: Mapped[int] = mapped_column(primary_key=True)
    coupon_id: Mapped[int] = mapped_column(ForeignKey("coupons.id"), unique=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"))
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id"))
    charity_name: Mapped[str]
    amount: Mapped[int]
    platform_fee_cents: Mapped[int]
    charity_contribution_cents: Mapped[int]
    hearts: Mapped[int]
    redeemed_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utc_now)

    coupon: Mapped[Coupon] = relationship()
    customer: Mapped[Customer] = relationship()


class AuthSession(Base):
    __tablename__ = "auth_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    kind: Mapped[str] = mapped_column(String(20))  # "customer" | "store"
    subject_id: Mapped[int]
    expires_at: Mapped[datetime] = mapped_column(UTCDateTime)
