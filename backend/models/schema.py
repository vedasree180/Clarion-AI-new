from pydantic import BaseModel, EmailStr
from typing import List, Optional

class AnalyzeRequest(BaseModel):
    topic: str
    explanation: str
    baseline_attempt_id: Optional[str] = None

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    name: Optional[str] = "Student"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str


class FeedbackRequest(BaseModel):
    attempt_id: str
    feedback: str  # "up" | "down"
    correction: Optional[str] = None
