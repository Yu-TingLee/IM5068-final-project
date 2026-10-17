import hashlib
import secrets
from datetime import timedelta

from pwdlib import PasswordHash
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.db import utc_now
from app.models import AuthSession

SESSION_LIFETIME = timedelta(days=7)

_password_hash = PasswordHash.recommended()
_SETUP_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def hash_secret(secret: str) -> str:
    return _password_hash.hash(secret)


def verify_secret(secret: str, secret_hash: str) -> bool:
    return _password_hash.verify(secret, secret_hash)


def new_setup_code() -> str:
    code = "".join(secrets.choice(_SETUP_CODE_ALPHABET) for _ in range(8))
    return f"{code[:4]}-{code[4:]}"


def normalize_setup_code(code: str) -> str:
    return code.replace("-", "").replace(" ", "").upper()


def _hash_token(token: str) -> str:
    # Tokens are long random values, so a fast hash is enough here.
    return hashlib.sha256(token.encode()).hexdigest()


def create_session(db: Session, kind: str, subject_id: int) -> str:
    token = secrets.token_urlsafe(32)
    db.add(
        AuthSession(
            token_hash=_hash_token(token),
            kind=kind,
            subject_id=subject_id,
            expires_at=utc_now() + SESSION_LIFETIME,
        )
    )
    db.commit()
    return token


def resolve_session(db: Session, kind: str, token: str) -> int | None:
    session = db.scalar(
        select(AuthSession).where(
            AuthSession.token_hash == _hash_token(token), AuthSession.kind == kind
        )
    )
    if session is None or session.expires_at <= utc_now():
        return None
    return session.subject_id


def end_sessions_for(db: Session, kind: str, subject_id: int) -> None:
    db.execute(
        delete(AuthSession).where(AuthSession.kind == kind, AuthSession.subject_id == subject_id)
    )


def end_session(db: Session, token: str) -> None:
    db.execute(delete(AuthSession).where(AuthSession.token_hash == _hash_token(token)))
    db.commit()
