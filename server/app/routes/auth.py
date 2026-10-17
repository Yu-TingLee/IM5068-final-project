from fastapi import APIRouter
from sqlalchemy import select

from app import rules
from app.deps import CurrentCustomer, Db, Token
from app.models import Customer
from app.rules import DomainError
from app.schemas import CustomerAuthOut, CustomerOut, LoginIn, RegisterIn
from app.security import create_session, end_session, verify_secret
from app.views import customer_out

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=CustomerAuthOut)
def register(body: RegisterIn, db: Db):
    customer = rules.register_customer(db, body.account, body.display_name, body.password)
    token = create_session(db, "customer", customer.id)
    return CustomerAuthOut(token=token, customer=customer_out(db, customer))


@router.post("/login", response_model=CustomerAuthOut)
def login(body: LoginIn, db: Db):
    customer = db.scalar(select(Customer).where(Customer.account == body.account))
    if customer is None or not verify_secret(body.password, customer.password_hash):
        raise DomainError("wrong_credentials", 401)
    token = create_session(db, "customer", customer.id)
    return CustomerAuthOut(token=token, customer=customer_out(db, customer))


@router.post("/logout", status_code=204)
def logout(db: Db, token: Token):
    end_session(db, token)


@router.get("/me", response_model=CustomerOut)
def me(db: Db, customer: CurrentCustomer):
    return customer_out(db, customer)
