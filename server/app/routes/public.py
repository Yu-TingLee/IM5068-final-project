from fastapi import APIRouter
from sqlalchemy import func, select

from app.deps import Db
from app.models import Redemption, Store
from app.schemas import CharityOut

router = APIRouter(prefix="/api", tags=["public"])


@router.get("/charities", response_model=list[CharityOut])
def list_charities(db: Db):
    totals = dict(
        db.execute(
            select(
                Redemption.charity_name, func.sum(Redemption.charity_contribution_cents)
            ).group_by(Redemption.charity_name)
        ).all()
    )
    names = sorted(set(db.scalars(select(Store.charity_name))) | totals.keys())
    return [CharityOut(name=name, total_contribution_cents=totals.get(name, 0)) for name in names]
