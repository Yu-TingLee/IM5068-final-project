from datetime import datetime

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class Schema(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class RegisterIn(Schema):
    account: str
    display_name: str
    password: str


class LoginIn(Schema):
    account: str
    password: str


class StoreLoginIn(Schema):
    store_code: str
    password: str


class StoreSetupIn(Schema):
    store_code: str
    setup_code: str
    password: str


class ReferralClaimIn(Schema):
    code: str


class CounterCodeIn(Schema):
    counter_code: str


class CustomerOut(Schema):
    id: int
    account: str
    display_name: str
    hearts: int
    charity_contribution_cents: int


class CustomerAuthOut(Schema):
    token: str
    customer: CustomerOut


class StoreOut(Schema):
    code: str
    name: str
    charity_name: str


class StoreAuthOut(Schema):
    token: str
    store: StoreOut


class CouponOut(Schema):
    id: int
    code: str
    kind: str
    face_value: int
    min_spend: int
    status: str
    issued_at: datetime
    expires_at: datetime
    redeemed_at: datetime | None
    store_code: str
    store_name: str


class ReferralCodeOut(Schema):
    code: str
    short_code: str
    store_code: str
    store_name: str
    claim_count: int
    redeem_count: int
    total_reward: int
    created_at: datetime


class ReferralOut(Schema):
    referee_display_name: str
    store_name: str
    claimed_at: datetime
    redeemed_at: datetime | None
    reward_value: int | None


class RedeemOut(Schema):
    coupon: CouponOut
    charity_contribution_cents: int
    reward_issued: bool
    became_partner: bool


class CharityOut(Schema):
    name: str
    total_contribution_cents: int


class CounterCodeOut(Schema):
    code: str
    expires_at: datetime


class StoreRedemptionOut(Schema):
    customer_display_name: str
    coupon_code: str
    coupon_kind: str
    amount: int
    platform_fee_cents: int
    charity_contribution_cents: int
    redeemed_at: datetime


class DashboardOut(Schema):
    store: StoreOut
    redemption_count: int
    total_amount: int
    platform_fee_cents: int
    charity_contribution_cents: int
    referee_count: int
    redemptions: list[StoreRedemptionOut]
