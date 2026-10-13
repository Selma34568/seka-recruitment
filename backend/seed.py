
from sqlalchemy import select, func

from database import SessionLocal
from models import Branch, Candidate, Application


def seed_database():
    db = SessionLocal()

    try:
        # Avoid duplicate demo data when running again
        existing = db.scalar(
            select(func.count()).select_from(Candidate)
        )

        if existing > 0:
            print("Candidates already exist. Skipping seed.")
            return

        branches_data = [
            ("Warszawa", "Warszawa"),
            ("Krakow", "Kraków"),
            ("Poznan", "Poznań"),
            ("Wroclaw", "Wrocław"),
            ("Katowice", "Katowice"),
        ]

        branches = []
        for name, city in branches_data:
            branch = db.scalar(
                select(Branch).where(Branch.name == name)
            )
            if branch is None:
                branch = Branch(name=name, city=city)
                db.add(branch)
                db.flush()
            branches.append(branch)

        candidates_data = [
            ("Anna", "Kowalska", "anna.kowalska@example.com",
             "HR Specialist", "NEW", 0),
            ("Piotr", "Nowak", "piotr.nowak@example.com",
             "Environmental Engineer", "REVIEW", 1),
            ("Maria", "Wisniewska", "maria.w@example.com",
             "Project Coordinator", "INTERVIEW", 2),
            ("Tomasz", "Zielinski", "tomasz.z@example.com",
             "Laboratory Technician", "NEW", 3),
            ("Katarzyna", "Lewandowska", "katarzyna.l@example.com",
             "Administrative Assistant", "OFFER", 4),
        ]

        for first, last, email, position, status, branch_index in candidates_data:
            candidate = Candidate(
                first_name=first,
                last_name=last,
                email=email,
            )
            db.add(candidate)
            db.flush()

            application = Application(
                candidate_id=candidate.id,
                branch_id=branches[branch_index].id,
                position=position,
                status=status,
            )
            db.add(application)

        db.commit()

        print("Database seeded successfully!")
        print("Branches: 5")
        print("Candidates: 5")
        print("Applications: 5")

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
