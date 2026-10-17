from datetime import timedelta

import pytest
from sqlalchemy import select, update

from app import rules
from app.db import utc_now
from app.models import Coupon, Customer, Store
from tests.conftest import ADMIN_PASSWORD


@pytest.fixture
def welcome(client, counter_code):
    def _welcome(headers, store="DAAN", code=None):
        body = {"counterCode": code or counter_code(store)}
        return client.post("/api/welcome-coupons", json=body, headers=headers)

    return _welcome


@pytest.fixture
def redeem(client, counter_code):
    def _redeem(headers, coupon_id, store="DAAN", code=None):
        body = {"counterCode": code or counter_code(store)}
        return client.post(f"/api/coupons/{coupon_id}/redeem", json=body, headers=headers)

    return _redeem


@pytest.fixture
def make_partner(welcome, redeem):
    """Welcome Coupon redeemed at DAAN; returns the new Partner's Short Code."""

    def _make_partner(client, headers):
        redeem(headers, welcome(headers).json()["id"])
        [code] = client.get("/api/referral-codes", headers=headers).json()
        return code["shortCode"]

    return _make_partner


def claim(client, headers, code):
    return client.post("/api/referral-coupons", json={"code": code}, headers=headers)


def test_counter_code_is_six_digits_and_differs_per_store(counter_code):
    assert len(counter_code("DAAN")) == 6
    assert counter_code("DAAN").isdigit()
    assert counter_code("DAAN") != counter_code("GONGGUAN")


def test_welcome_coupon_needs_a_current_counter_code(register, welcome):
    headers = register("kai")

    response = welcome(headers, code="000000")

    assert response.status_code == 403
    assert response.json() == {"error": "wrong_counter_code"}


def test_welcome_coupon_goes_into_the_wallet_unused(client, register, welcome):
    headers = register("kai")

    coupon = welcome(headers).json()

    assert coupon["kind"] == "welcome"
    assert coupon["storeCode"] == "DAAN"
    assert coupon["faceValue"] == 50
    assert coupon["minSpend"] == 100
    assert coupon["status"] == "unused"
    assert client.get("/api/referral-codes", headers=headers).json() == []


def test_counter_code_from_the_previous_window_still_works(
    register, welcome, db_factory, monkeypatch
):
    headers = register("kai")
    with db_factory() as db:
        store = db.scalar(select(Store).where(Store.code == "DAAN"))
        code, expires_at = rules.current_counter_code(store)

    monkeypatch.setattr(rules, "utc_now", lambda: expires_at + timedelta(minutes=1))
    assert welcome(headers, code=code).status_code == 200


def test_expired_counter_code_is_rejected(register, welcome, db_factory, monkeypatch):
    headers = register("kai")
    with db_factory() as db:
        store = db.scalar(select(Store).where(Store.code == "DAAN"))
        code, expires_at = rules.current_counter_code(store)

    monkeypatch.setattr(rules, "utc_now", lambda: expires_at + rules.COUNTER_CODE_WINDOW)
    assert welcome(headers, code=code).json() == {"error": "wrong_counter_code"}


def test_redeeming_the_welcome_coupon_makes_a_partner(client, register, welcome, redeem):
    headers = register("kai", "阿凱")
    coupon_id = welcome(headers).json()["id"]

    result = redeem(headers, coupon_id).json()

    assert result["becamePartner"] is True
    assert result["rewardIssued"] is False
    assert result["charityContributionCents"] == 50
    [code] = client.get("/api/referral-codes", headers=headers).json()
    assert code["code"] == "大安旅店/阿凱"
    assert code["shortCode"].startswith("LF-")


def test_full_referral_loop(client, register, make_partner, redeem):
    referrer = register("kai", "阿凱")
    referee = register("ming", "小明")
    short_code = make_partner(client, referrer)

    coupon = claim(client, referee, short_code.lower()).json()
    result = redeem(referee, coupon["id"]).json()

    assert coupon["kind"] == "referral"
    assert coupon["faceValue"] == 100
    assert coupon["minSpend"] == 500
    assert result["rewardIssued"] is True
    assert result["becamePartner"] is True
    assert result["charityContributionCents"] == 100

    reward = next(
        c for c in client.get("/api/coupons", headers=referrer).json() if c["kind"] == "reward"
    )
    assert reward["faceValue"] == 25
    assert reward["minSpend"] == 200
    assert reward["status"] == "unused"

    [code_stats] = client.get("/api/referral-codes", headers=referrer).json()
    assert code_stats["claimCount"] == 1
    assert code_stats["redeemCount"] == 1
    assert code_stats["totalReward"] == 25

    [referral] = client.get("/api/referrals", headers=referrer).json()
    assert referral["refereeDisplayName"] == "小明"
    assert referral["rewardValue"] == 25

    [referee_code] = client.get("/api/referral-codes", headers=referee).json()
    assert referee_code["code"] == "大安旅店/小明"


def test_redeem_needs_the_counter_code_of_the_coupons_store(client, register, make_partner, redeem):
    referrer = register("kai")
    referee = register("ming")
    coupon_id = claim(client, referee, make_partner(client, referrer)).json()["id"]

    assert redeem(referee, coupon_id, store="GONGGUAN").status_code == 403
    assert redeem(referee, coupon_id).status_code == 200
    assert redeem(referee, coupon_id).json() == {"error": "coupon_not_usable"}


def test_claim_matches_the_full_code_exactly(client, register, make_partner):
    referrer = register("kai", "阿凱")
    referee = register("ming")
    make_partner(client, referrer)

    partial = claim(client, referee, "大安")
    exact = claim(client, referee, "大安旅店/阿凱")

    assert partial.json() == {"error": "referral_code_not_found"}
    assert exact.status_code == 200


def test_cannot_claim_own_code(client, register, make_partner):
    headers = register("kai")
    short_code = make_partner(client, headers)

    assert claim(client, headers, short_code).json() == {"error": "own_referral_code"}


def test_one_first_coupon_per_store(client, register, make_partner, welcome):
    first_referrer = register("kai")
    second_referrer = register("lin")
    referee = register("ming")
    first_code = make_partner(client, first_referrer)
    second_code = make_partner(client, second_referrer)

    claim(client, referee, first_code)

    assert claim(client, referee, second_code).json() == {"error": "already_claimed"}
    assert welcome(referee).json() == {"error": "already_claimed"}


def test_welcome_coupon_blocks_a_referral_coupon_at_that_store(
    client, register, make_partner, welcome
):
    referrer = register("kai")
    other = register("ming")
    code = make_partner(client, referrer)
    welcome(other)

    assert claim(client, other, code).json() == {"error": "already_claimed"}


def test_wallet_holds_at_most_15_unused_coupons(client, register, make_partner, db_factory):
    referrer = register("kai")
    referee = register("ming")
    code = make_partner(client, referrer)
    with db_factory() as db:
        customer = db.scalar(select(Customer).where(Customer.account == "ming"))
        store = db.scalar(select(Store).where(Store.code == "XIAOMAN"))
        for i in range(15):
            db.add(
                Coupon(
                    customer_id=customer.id,
                    store_id=store.id,
                    kind="reward",
                    code=f"CP-RW-TEST{i:02}",
                    face_value=25,
                    min_spend=200,
                    expires_at=utc_now() + timedelta(days=1),
                )
            )
        db.commit()

    assert claim(client, referee, code).json() == {"error": "wallet_full"}


def test_expired_coupons_cannot_be_redeemed(client, register, welcome, redeem, db_factory):
    headers = register("kai")
    coupon_id = welcome(headers).json()["id"]
    with db_factory() as db:
        db.execute(update(Coupon).values(expires_at=utc_now() - timedelta(seconds=1)))
        db.commit()

    [coupon] = client.get("/api/coupons", headers=headers).json()
    assert coupon["status"] == "expired"
    assert redeem(headers, coupon_id).json() == {"error": "coupon_not_usable"}


def test_cannot_redeem_someone_elses_coupon(register, welcome, redeem):
    holder = register("kai")
    other = register("ming")
    coupon_id = welcome(holder).json()["id"]

    assert redeem(other, coupon_id).status_code == 404


def test_hearts_and_charity_totals(client, register, make_partner, redeem):
    referrer = register("kai")
    referee = register("ming")
    code = make_partner(client, referrer)
    redeem(referee, claim(client, referee, code).json()["id"])

    kai = client.get("/api/auth/me", headers=referrer).json()
    ming = client.get("/api/auth/me", headers=referee).json()
    charities = {c["name"]: c for c in client.get("/api/charities").json()}

    assert kai["hearts"] == 1
    assert kai["charityContributionCents"] == 50
    assert ming["hearts"] == 1
    assert ming["charityContributionCents"] == 100
    assert charities["家扶基金會"]["totalContributionCents"] == 150
    assert charities["創世基金會"]["totalContributionCents"] == 0
    assert len(charities) == 2


def test_store_dashboard_and_counter_code(client, register, make_partner, redeem, counter_code):
    referrer = register("kai", "阿凱")
    referee = register("ming", "小明")
    code = make_partner(client, referrer)
    redeem(referee, claim(client, referee, code).json()["id"])

    wrong = client.post("/api/admin/login", json={"storeCode": "DAAN", "password": "nope"})
    token = client.post(
        "/api/admin/login", json={"storeCode": "daan", "password": ADMIN_PASSWORD}
    ).json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    dashboard = client.get("/api/admin/dashboard", headers=headers).json()
    shown_code = client.get("/api/admin/counter-code", headers=headers).json()

    assert wrong.status_code == 401
    assert dashboard["redemptionCount"] == 2
    assert dashboard["totalAmount"] == 150
    assert dashboard["platformFeeCents"] == 2850
    assert dashboard["charityContributionCents"] == 150
    assert dashboard["refereeCount"] == 1
    assert [r["customerDisplayName"] for r in dashboard["redemptions"]] == ["小明", "阿凱"]
    assert shown_code["code"] == counter_code("DAAN")


def test_counter_code_requires_a_store_session(client, register):
    customer = register("kai")

    assert client.get("/api/admin/counter-code").status_code == 401
    assert client.get("/api/admin/counter-code", headers=customer).status_code == 401
