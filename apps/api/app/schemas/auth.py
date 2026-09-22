from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime
from app.models.user import UserRole

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str
    role: Optional[UserRole] = UserRole.RESEARCHER

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int

class TokenRefreshRequest(BaseModel):
    refresh_token: str

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
