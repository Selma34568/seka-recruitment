
from types import SimpleNamespace

from sqlalchemy import select

from database import SessionLocal
from models import Branch, Candidate
from permissions import candidate_scope_query

db = SessionLocal()

try:
    branches = db.scalars(
        select(Branch).order_by(Branch.id)
    ).all()

    role_name = "TEST_ASSISTANT_05cdc248"

    for branch in branches:
        user = SimpleNamespace(
            role=role_name,
            branch_id=branch.id,
        )

        query = candidate_scope_query(user, db)

        candidates = db.scalars(
            query.order_by(Candidate.id)
        ).all()

        print(
            f"{branch.city}: {len(candidates)} candidates"
        )

        for candidate in candidates:
            assert any(
                application.branch_id == branch.id
                for application in candidate.applications
            )

    print("CUSTOM ROLE SCOPE TEST PASSED!")

finally:
    db.close()
