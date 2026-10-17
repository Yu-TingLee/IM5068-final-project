from fastapi import APIRouter
from sqlalchemy import select

from app import rules
from app.deps import CurrentCustomer, Db
from app.models import Coupon, Referral, ReferralCode
from app.schemas import (
    CounterCodeIn,
    CouponOut,
    RedeemOut,
    ReferralClaimIn,
    ReferralCodeOut,
    ReferralOut,
)
from app.views import coupon_out, referral_code_out

router = APIRouter(prefix="/api", tags=["customer"])


@router.get("/coupons", response_model=list[CouponOut])
def list_coupons(db: Db, customer: CurrentCustomer):
    coupons = db.scalars(
        select(Coupon).where(Coupon.customer_id == customer.id).order_by(Coupon.issued_at.desc())
    )
    return [coupon_out(coupon) for coupon in coupons]


@router.post("/referral-coupons", response_model=CouponOut)
def claim_referral(body: ReferralClaimIn, db: Db, customer: CurrentCustomer):
    return coupon_out(rules.claim_referral_coupon(db, customer, body.code))


@router.post("/coupons/{coupon_id}/redeem", response_model=RedeemOut)
def redeem(coupon_id: int, body: CounterCodeIn, db: Db, customer: CurrentCustomer):
    result = rules.redeem_coupon(db, customer, coupon_id, body.counter_code)
    return RedeemOut(
        coupon=coupon_out(result.redemption.coupon),
        charity_contribution_cents=result.redemption.charity_contribution_cents,
        reward_issued=result.reward_issued,
        became_partner=result.became_partner,
    )


@router.post("/welcome-coupons", response_model=CouponOut)
def claim_welcome(body: CounterCodeIn, db: Db, customer: CurrentCustomer):
    return coupon_out(rules.claim_welcome_coupon(db, customer, body.counter_code))


@router.get("/referral-codes", response_model=list[ReferralCodeOut])
def list_referral_codes(db: Db, customer: CurrentCustomer):
    referral_codes = db.scalars(
        select(ReferralCode)
        .where(ReferralCode.customer_id == customer.id)
        .order_by(ReferralCode.created_at)
    )
    return [referral_code_out(db, referral_code) for referral_code in referral_codes]


@router.get("/referrals", response_model=list[ReferralOut])
def list_referrals(db: Db, customer: CurrentCustomer):
    referrals = db.scalars(
        select(Referral)
        .where(Referral.referrer_id == customer.id)
        .order_by(Referral.claimed_at.desc())
    )
    return [
        ReferralOut(
            referee_display_name=referral.referee.display_name,
            store_name=referral.store.name,
            claimed_at=referral.claimed_at,
            redeemed_at=referral.redeemed_at,
            reward_value=referral.reward_coupon.face_value if referral.reward_coupon else None,
        )
        for referral in referrals
    ]
