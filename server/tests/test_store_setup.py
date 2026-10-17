import pytest
from sqlalchemy import select

from app import rules
from app.models import Store
from app.rules import DomainError
from app.security import hash_secret, normalize_setup_code

SETUP_CODE = "7KQ2-M9XA"


@pytest.fixture
def unconfigured_store(db_factory):
    with db_factory() as db:
        store = db.scalar(select(Store).where(Store.code == "DAAN"))
        store.admin_password_hash = None
        store.setup_code_hash = hash_secret(normalize_setup_code(SETUP_CODE))
        db.commit()


def setup(client, setup_code=SETUP_CODE, password="our-own-pass"):
    body = {"storeCode": "daan", "setupCode": setup_code, "password": password}
    return client.post("/api/admin/setup", json=body)


def login(client, password):
    return client.post("/api/admin/login", json={"storeCode": "DAAN", "password": password})


@pytest.mark.usefixtures("unconfigured_store")
def test_login_before_setup_says_so(client):
    assert login(client, "anything").json() == {"error": "store_not_set_up"}


@pytest.mark.usefixtures("unconfigured_store")
def test_setup_sets_the_stores_own_password(client):
    response = setup(client, setup_code="7kq2m9xa")

    assert response.status_code == 200
    token = response.json()["token"]
    dashboard = client.get("/api/admin/dashboard", headers={"Authorization": f"Bearer {token}"})
    assert dashboard.status_code == 200
    assert login(client, "our-own-pass").status_code == 200


@pytest.mark.usefixtures("unconfigured_store")
def test_setup_code_works_only_once(client):
    setup(client)

    assert setup(client, password="someone-else").json() == {"error": "invalid_setup_code"}
    assert login(client, "our-own-pass").status_code == 200


@pytest.mark.usefixtures("unconfigured_store")
def test_setup_rejects_wrong_code_and_short_password(client):
    assert setup(client, setup_code="AAAA-AAAA").json() == {"error": "invalid_setup_code"}
    assert setup(client, password="short").json() == {"error": "weak_password"}
    assert setup(client).status_code == 200


def test_login_to_unknown_store_says_so(client):
    response = client.post("/api/admin/login", json={"storeCode": "NOPE", "password": "x"})

    assert response.json() == {"error": "store_not_found"}


def test_configured_store_cannot_be_set_up_again(client):
    assert setup(client).json() == {"error": "invalid_setup_code"}


def test_reset_store_signs_the_store_out_and_allows_setup_again(client, db_factory):
    token = client.post(
        "/api/admin/login", json={"storeCode": "DAAN", "password": "admin-pass"}
    ).json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    with db_factory() as db:
        new_code = rules.reset_store(db, "daan")

    assert client.get("/api/admin/dashboard", headers=headers).status_code == 401
    assert login(client, "admin-pass").json() == {"error": "store_not_set_up"}
    assert setup(client, setup_code=new_code).status_code == 200


def test_create_store_validates_its_input(db_factory):
    with db_factory() as db:
        store, setup_code = rules.create_store(db, "shop1", " 小店 ", "家扶基金會")
        assert (store.code, store.name, store.admin_password_hash) == ("SHOP1", "小店", None)
        assert setup_code is not None

        for args, error in [
            (("X", "一字店", "家扶基金會"), "invalid_store_code"),
            (("SHOP2", "小店二", " "), "missing_store_details"),
            (("SHOP1", "別的店", "家扶基金會"), "store_exists"),
            (("SHOP3", "小店", "家扶基金會"), "store_exists"),
        ]:
            with pytest.raises(DomainError) as raised:
                rules.create_store(db, *args)
            assert raised.value.code == error
