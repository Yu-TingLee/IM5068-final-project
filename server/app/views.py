"""Builds response schemas from models, including the derived counts and totals."""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db import utc_now
from app.models import Coupon, Customer, Redemption, Referral, ReferralCode, Store
from app.schemas import CouponOut, CustomerOut, ReferralCodeOut, StoreOut


def customer_out(db: Session, customer: Customer) -> CustomerOut:
    hearts, contribution = db.execute(
        select(
            func.coalesce(func.sum(Redemption.hearts), 0),
            func.coalesce(func.sum(Redemption.charity_contribution_cents), 0),
        ).where(Redemption.customer_id == customer.id)
    ).one()
    return CustomerOut(
        id=customer.id,
        account=customer.account,
        display_name=customer.display_name,
        hearts=hearts,
        charity_contribution_cents=contribution,
    )


def store_out(store: Store) -> StoreOut:
    return StoreOut(
        code=store.code,
        name=store.name,
        charity_name=store.charity_name,
    )


def coupon_out(coupon: Coupon) -> CouponOut:
    return CouponOut(
        id=coupon.id,
        code=coupon.code,
        kind=coupon.kind,
        face_value=coupon.face_value,
        min_spend=coupon.min_spend,
        status=coupon.status(utc_now()),
        issued_at=coupon.issued_at,
        expires_at=coupon.expires_at,
        redeemed_at=coupon.redeemed_at,
        store_code=coupon.store.code,
        store_name=coupon.store.name,
    )


def referral_code_out(db: Session, referral_code: ReferralCode) -> ReferralCodeOut:
    referrals = db.scalars(
        select(Referral).where(Referral.referral_code_id == referral_code.id)
    ).all()
    redeemed = [r for r in referrals if r.redeemed_at is not None]
    return ReferralCodeOut(
        code=referral_code.code,
        short_code=referral_code.short_code,
        store_code=referral_code.store.code,
        store_name=referral_code.store.name,
        claim_count=len(referrals),
        redeem_count=len(redeemed),
        total_reward=sum(r.reward_coupon.face_value for r in redeemed if r.reward_coupon),
        created_at=referral_code.created_at,
    )
