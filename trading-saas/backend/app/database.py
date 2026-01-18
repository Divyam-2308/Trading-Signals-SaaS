import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
load_dotenv()

# sqlite for now
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# sqlite threading fix
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    # db session for routes
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()