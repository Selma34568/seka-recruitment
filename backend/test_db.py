
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
import os

load_dotenv()

database_url = os.getenv("DATABASE_URL")

if not database_url:
    raise RuntimeError("DATABASE_URL not found in .env")

database_url = database_url.replace(
    "postgresql://",
    "postgresql+psycopg://",
    1
)

engine = create_engine(database_url, pool_pre_ping=True)

with engine.connect() as connection:
    result = connection.execute(
        text("SELECT current_database(), current_user")
    )
    database, user = result.fetchone()

    print("Database connection successful!")
    print("Database:", database)
    print("User:", user)
