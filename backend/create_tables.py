
from database import Base, engine
from models import Branch, Candidate, Application

print("Creating SEKA database tables...")

Base.metadata.create_all(bind=engine)

print("Database tables created successfully!")
print("Tables:", ", ".join(Base.metadata.tables.keys()))
