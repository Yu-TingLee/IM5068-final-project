"""Operator commands: `uv run python -m app.cli <command> --help`."""

import argparse

from sqlalchemy import select

from app import rules
from app.db import Base, SessionLocal, engine
from app.models import Store
from app.rules import DomainError

SETUP_HINT = "The store owner enters it on the store page's first-time setup tab."


def create_store(args) -> None:
    with SessionLocal() as db:
        store, setup_code = rules.create_store(
            db, args.code, args.name, args.charity, args.password
        )
    if setup_code is None:
        print(f"Created {store.code} with the given password.")
    else:
        print(f"Created {store.code}. One-time setup code: {setup_code}\n{SETUP_HINT}")


def reset_store(args) -> None:
    with SessionLocal() as db:
        setup_code = rules.reset_store(db, args.code)
    print(
        f"{args.code.upper()}: password cleared and signed out. "
        f"New setup code: {setup_code}\n{SETUP_HINT}"
    )


def list_stores(_args) -> None:
    with SessionLocal() as db:
        for store in db.scalars(select(Store).order_by(Store.id)):
            status = "set up" if store.admin_password_hash else "waiting for setup"
            print(f"{store.code:<12} {store.name}  ->  {store.charity_name}  ({status})")


def main() -> None:
    parser = argparse.ArgumentParser(prog="app.cli")
    commands = parser.add_subparsers(required=True)

    command = commands.add_parser("create-store", help="create one store")
    command.add_argument("code", help="short code staff sign in with, e.g. DAAN")
    command.add_argument("name", help="name shown to customers, e.g. 大安旅店")
    command.add_argument("--charity", required=True, help="charity receiving the 1%%")
    command.add_argument(
        "--password",
        help="test stores only: set the password directly instead of issuing a setup code",
    )
    command.set_defaults(run=create_store)

    command = commands.add_parser(
        "reset-store", help="clear a store's password, sign it out and issue a new setup code"
    )
    command.add_argument("code")
    command.set_defaults(run=reset_store)

    commands.add_parser("list-stores", help="list stores").set_defaults(run=list_stores)

    args = parser.parse_args()
    Base.metadata.create_all(engine)
    try:
        args.run(args)
    except DomainError as error:
        raise SystemExit(f"Error: {error.code}") from None


if __name__ == "__main__":
    main()
