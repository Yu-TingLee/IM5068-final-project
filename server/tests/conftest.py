import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import rules
from app.db import Base, get_db, make_engine
from app.main import app
from app.models import Store
from app.rules import current_counter_code

ADMIN_PASSWORD = "admin-pass"
STORES = [
    ("DAAN", "大安旅店", "家扶基金會"),
    ("GONGGUAN", "公館食堂", "創世基金會"),
    ("XIAOMAN", "小滿美髮", "家扶基金會"),
]


@pytest.fixture
def db_factory():
    engine = make_engine("sqlite://", poolclass=StaticPool)
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, expire_on_commit=False)
    with factory() as db:
        for code, name, charity in STORES:
            rules.create_store(db, code, name, charity, password=ADMIN_PASSWORD)
        db.commit()
    return factory


@pytest.fixture
def client(db_factory):
    def override_get_db():
        with db_factory() as db:
            yield db

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def register(client):
    def _register(account: str, display_name: str | None = None) -> dict:
        response = client.post(
            "/api/auth/register",
            json={
                "account": account,
                "displayName": display_name or account,
                "password": "password123",
            },
        )
        assert response.status_code == 200, response.json()
        return {"Authorization": f"Bearer {response.json()['token']}"}

    return _register


@pytest.fixture
def counter_code(db_factory):
    def _counter_code(store_code: str = "DAAN") -> str:
        with db_factory() as db:
            store = db.scalar(select(Store).where(Store.code == store_code))
            return current_counter_code(store)[0]

    return _counter_code
