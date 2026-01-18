import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# using sqlite for now, can switch to postgres later
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sql_app.db")

# need this for sqlite to work with multiple threads
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# all models will inherit from this
Base = declarative_base()

def get_db():
    """returns db session, used as dependency in routes"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()