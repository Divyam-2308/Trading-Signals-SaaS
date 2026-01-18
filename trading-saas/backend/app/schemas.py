from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional

# signup request
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., max_length=72)

# response after signup/login
class UserOut(BaseModel):
    id: int
    email: EmailStr
    is_pro: bool

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

# for jwt decode
class TokenData(BaseModel):
    email: Optional[EmailStr] = None
