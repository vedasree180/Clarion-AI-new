from fastapi import APIRouter, Depends, HTTPException, Request
from models.schema import PasswordChangeRequest
from services.auth import get_current_user, get_password_hash, verify_password

router = APIRouter()


@router.post("/change-password")
async def change_password(
    payload: PasswordChangeRequest,
    request: Request,
    current_user: str = Depends(get_current_user)
):
    db = request.app.mongodb
    if request.app.db_status != "connected":
        raise HTTPException(status_code=503, detail="Database unavailable in demo mode")

    user = await db.users.find_one({"email": current_user})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(payload.current_password, user["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    new_hash = get_password_hash(payload.new_password)
    await db.users.update_one({"email": current_user}, {"$set": {"password": new_hash}})
    return {"message": "Password changed successfully"}
