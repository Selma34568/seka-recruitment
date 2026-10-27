
from types import SimpleNamespace

from sqlalchemy import func, select

from database import SessionLocal
from models import Branch, Candidate
from permissions import candidate_scope_query


def check_access(db, role, branch_id=None):
    user = SimpleNamespace(
        role=role,
        branch_id=branch_id,
    )

    query = candidate_scope_query(user, db)
    candidates = db.scalars(
        query.order_by(Candidate.id)
    ).all()

    return candidates


with SessionLocal() as db:
    branches = db.scalars(
        select(Branch).order_by(Branch.id)
    ).all()

    total = db.scalar(
        select(func.count(Candidate.id))
    )

    print(f"Total candidates: {total}")

    admin = check_access(db, "ADMIN")
    hr = check_access(db, "HR_MANAGER")

    print(f"ADMIN sees: {len(admin)}")
    print(f"HR_MANAGER sees: {len(hr)}")

    for branch in branches:
        visible = check_access(
            db, "BRANCH_MANAGER", branch.id
        )

        print(
            f"BRANCH_MANAGER ({branch.city}, "
            f"branch_id={branch.id}) sees: "
            f"{len(visible)}"
        )

        for candidate in visible:
            assert any(
                app.branch_id == branch.id
                for app in candidate.applications
            ), "Unauthorized candidate returned!"

    assert len(admin) == total
    assert len(hr) == total

    print("Branch filtering tests PASSED!")
