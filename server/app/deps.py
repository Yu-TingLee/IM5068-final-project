from typing import Annotated

from fastapi import Depends, Header
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Customer, Store
from app.rules import DomainError
from app.security import resolve_session

Db = Annotated[Session, Depends(get_db)]


def bearer_token(authorization: Annotated[str | None, Header()] = None) -> str:
    scheme, _, token = (authorization or "").partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise DomainError("not_signed_in", 401)
    return token


Token = Annotated[str, Depends(bearer_token)]


def current_customer(db: Db, token: Token) -> Customer:
    customer_id = resolve_session(db, "customer", token)
    customer = db.get(Customer, customer_id) if customer_id else None
    if customer is None:
        raise DomainError("not_signed_in", 401)
    return customer


def current_store(db: Db, token: Token) -> Store:
    store_id = resolve_session(db, "store", token)
    store = db.get(Store, store_id) if store_id else None
    if store is None:
        raise DomainError("not_signed_in", 401)
    return store


CurrentCustomer = Annotated[Customer, Depends(current_customer)]
CurrentStore = Annotated[Store, Depends(current_store)]
