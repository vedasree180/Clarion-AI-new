from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from models.schema import UserCreate, Token
from services.auth import get_password_hash, verify_password, create_access_token, get_current_user
from motor.motor_asyncio import AsyncIOMotorDatabase
import logging
from datetime import datetime
from pydantic import BaseModel
from typing import Optional

logger = logging.getLogger(__name__)

router = APIRouter()

class ProfileUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None

@router.post("/signup", response_model=Token)
@router.post("/register", response_model=Token)
async def register(user: UserCreate, request: Request):
    db = request.app.mongodb
    logger.info(f"Signup attempt for email: {user.email}")
    existing_user = await db.users.find_one({"$or": [{"email": user.email}, {"username": user.username}]})
    if existing_user:
        logger.warning(f"Signup failed: Email or username already exists for {user.email}")
        raise HTTPException(status_code=400, detail="Email or username already registered")
    
    hashed_password = get_password_hash(user.password)
    user_dict = {
        "email": user.email,
        "username": user.username,
        "name": user.name or "Student",
        "password": hashed_password,
        "created_at": datetime.utcnow()
    }
    await db.users.insert_one(user_dict)
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    db = request.app.mongodb
    logger.info(f"Login attempt for email: {form_data.username}")
    user = await db.users.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["password"]):
        logger.warning(f"Login failed: Invalid credentials for {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    logger.info(f"Login successful for {form_data.username}")
    
    access_token = create_access_token(data={"sub": user["email"]})
    return {"access_token": access_token, "token_type": "bearer"}

@router.put("/update")
async def update_profile(request: Request, update_data: ProfileUpdate, current_user: str = Depends(get_current_user)):
    db = request.app.mongodb
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No data to update")
        
    res = await db.users.update_one({"email": current_user}, {"$set": update_dict})
    if res.modified_count == 0:
        raise HTTPException(status_code=400, detail="Update failed or no changes made")
        
    return {"message": "Profile updated successfully", "updated_fields": list(update_dict.keys())}


@router.post("/change-password")
async def change_password(request: Request, data: dict, current_user: str = Depends(get_current_user)):
    db = request.app.mongodb
    user = await db.users.find_one({"email": current_user})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    current_pwd = data.get("current_password", "")
    new_pwd = data.get("new_password", "")
    
    if not verify_password(current_pwd, user["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    if len(new_pwd) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    
    hashed = get_password_hash(new_pwd)
    await db.users.update_one({"email": current_user}, {"$set": {"password": hashed}})
    return {"message": "Password changed successfully"}
