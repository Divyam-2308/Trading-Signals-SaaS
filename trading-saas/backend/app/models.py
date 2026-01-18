from sqlalchemy import Boolean, Column, Integer, String, DateTime 
from .database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    is_pro = Column(Boolean, default=False) # for paid users
    stripe_customer_id = Column(String, unique=True, index=True, nullable=True) # will use this for payments
    created_at = Column(DateTime, default=datetime.utcnow) # timestamp when user was created
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow) 