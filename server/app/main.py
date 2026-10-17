from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import CLIENT_ORIGINS
from app.db import Base, engine
from app.routes import admin, auth, customer, public
from app.rules import DomainError


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(engine)
    yield


app = FastAPI(title="Referral API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CLIENT_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type", "ngrok-skip-browser-warning"],
)


@app.exception_handler(DomainError)
def handle_domain_error(_request: Request, error: DomainError):
    return JSONResponse({"error": error.code}, status_code=error.status)


for router in (auth.router, customer.router, public.router, admin.router):
    app.include_router(router)
