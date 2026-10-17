from fastapi import APIRouter
from sqlalchemy import func, select

from app import rules
from app.deps import CurrentStore, Db, Token
from app.models import Redemption, Referral
from app.rules import DomainError, current_counter_code
from app.schemas import (
    CounterCodeOut,
    DashboardOut,
    StoreAuthOut,
    StoreLoginIn,
    StoreRedemptionOut,
    StoreSetupIn,
)
from app.security import create_session, end_session, verify_secret
from app.views import store_out

router = APIRouter(prefix="/api/admin", tags=["store admin"])


@router.post("/login", response_model=StoreAuthOut)
def login(body: StoreLoginIn, db: Db):
    store = rules.find_store(db, body.store_code)
    if store is None:
        raise DomainError("store_not_found", 404)
    if store.admin_password_hash is None:
        raise DomainError("store_not_set_up", 401)
    if not verify_secret(body.password, store.admin_password_hash):
        raise DomainError("wrong_credentials", 401)
    token = create_session(db, "store", store.id)
    return StoreAuthOut(token=token, store=store_out(store))


@router.post("/setup", response_model=StoreAuthOut)
def setup(body: StoreSetupIn, db: Db):
    store = rules.set_up_store(db, body.store_code, body.setup_code, body.password)
    token = create_session(db, "store", store.id)
    return StoreAuthOut(token=token, store=store_out(store))


@router.post("/logout", status_code=204)
def logout(db: Db, token: Token):
    end_session(db, token)


@router.get("/dashboard", response_model=DashboardOut)
def dashboard(db: Db, store: CurrentStore):
    redemptions = db.scalars(
        select(Redemption)
        .where(Redemption.store_id == store.id)
        .order_by(Redemption.redeemed_at.desc())
    ).all()
    referee_count = db.scalar(
        select(func.count(Referral.id)).where(
            Referral.store_id == store.id, Referral.redeemed_at.is_not(None)
        )
    )
    return DashboardOut(
        store=store_out(store),
        redemption_count=len(redemptions),
        total_amount=sum(r.amount for r in redemptions),
        platform_fee_cents=sum(r.platform_fee_cents for r in redemptions),
        charity_contribution_cents=sum(r.charity_contribution_cents for r in redemptions),
        referee_count=referee_count,
        redemptions=[
            StoreRedemptionOut(
                customer_display_name=r.customer.display_name,
                coupon_code=r.coupon.code,
                coupon_kind=r.coupon.kind,
                amount=r.amount,
                platform_fee_cents=r.platform_fee_cents,
                charity_contribution_cents=r.charity_contribution_cents,
                redeemed_at=r.redeemed_at,
            )
            for r in redemptions
        ],
    )


@router.get("/counter-code", response_model=CounterCodeOut)
def counter_code(store: CurrentStore):
    code, expires_at = current_counter_code(store)
    return CounterCodeOut(code=code, expires_at=expires_at)
