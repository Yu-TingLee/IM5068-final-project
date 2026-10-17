from datetime import timedelta

from sqlalchemy import select, update

from app.db import utc_now
from app.models import AuthSession, Customer


def test_register_returns_a_working_token(client, register):
    headers = register("xiaoming", "小明")

    me = client.get("/api/auth/me", headers=headers).json()

    assert me["account"] == "xiaoming"
    assert me["displayName"] == "小明"
    assert me["hearts"] == 0


def test_register_rejects_taken_account_and_display_name(client, register):
    register("xiaoming", "小明")

    taken_account = client.post(
        "/api/auth/register",
        json={"account": "xiaoming", "displayName": "別人", "password": "password123"},
    )
    taken_name = client.post(
        "/api/auth/register",
        json={"account": "other", "displayName": "小明", "password": "password123"},
    )

    assert taken_account.json() == {"error": "account_taken"}
    assert taken_name.json() == {"error": "display_name_taken"}


def test_register_validates_input(client):
    def attempt(account, display_name, password):
        body = {"account": account, "displayName": display_name, "password": password}
        return client.post("/api/auth/register", json=body).json()["error"]

    assert attempt("ab", "小明", "password123") == "invalid_account"
    assert attempt("bad-chars!", "小明", "password123") == "invalid_account"
    assert attempt("XiaoMing", "小明", "password123") == "invalid_account"
    assert attempt("xiaoming", "  ", "password123") == "invalid_display_name"
    assert attempt("xiaoming", "大安/小明", "password123") == "invalid_display_name"
    assert attempt("xiaoming", "小明", "short") == "weak_password"


def test_login_checks_password(client, register):
    register("xiaoming", "小明")

    wrong = client.post("/api/auth/login", json={"account": "xiaoming", "password": "nope"})
    right = client.post("/api/auth/login", json={"account": "xiaoming", "password": "password123"})

    assert wrong.status_code == 401
    assert right.status_code == 200


def test_logout_revokes_the_token(client, register):
    headers = register("xiaoming")

    client.post("/api/auth/logout", headers=headers)

    assert client.get("/api/auth/me", headers=headers).status_code == 401


def test_sessions_expire(client, register, db_factory):
    headers = register("xiaoming")
    with db_factory() as db:
        db.execute(update(AuthSession).values(expires_at=utc_now() - timedelta(seconds=1)))
        db.commit()

    assert client.get("/api/auth/me", headers=headers).status_code == 401


def test_customer_token_does_not_open_the_dashboard(client, register):
    headers = register("xiaoming")

    assert client.get("/api/admin/dashboard", headers=headers).status_code == 401


def test_passwords_are_not_stored_in_plain_text(register, db_factory):
    register("xiaoming")
    with db_factory() as db:
        password_hash = db.scalar(select(Customer.password_hash))

    assert "password123" not in password_hash
    assert password_hash.startswith("$argon2id$")
