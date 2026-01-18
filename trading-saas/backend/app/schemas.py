from pydantic import BaseModel, EmailStr, Field
from typing import Optional

# request body when user signs up
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., max_length=72)

# what we send back to the frontend after user signs up or logs in
class UserOut(BaseModel):
    id: int
    email: EmailStr
    is_pro: bool

    class Config:
        from_attributes = True 

class Token(BaseModel):
    access_token: str
    token_type: str

#used in auth.py to decode jwt
class TokenData(BaseModel):
    email: Optional[EmailStr] = None
