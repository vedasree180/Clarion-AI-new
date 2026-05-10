from fastapi import APIRouter, Depends, Request, HTTPException
from services.auth import get_current_user
from datetime import datetime
from typing import List, Dict, Any

router = APIRouter()

@router.post("/save")
async def save_interview(payload: Dict[str, Any], request: Request, current_user: str = Depends(get_current_user)):
    db = request.app.mongodb
    
    interview_data = {
        "user_email": current_user,
        "topic": payload.get("topic", "General Technical"),
        "messages": payload.get("messages", []),
        "verdict": payload.get("verdict"),
        "timestamp": datetime.utcnow().isoformat(),
        "type": "interview"
    }
    
    result = await db.interviews.insert_one(interview_data)
    return {"status": "success", "interview_id": str(result.inserted_id)}

@router.get("/")
async def get_interviews(request: Request, current_user: str = Depends(get_current_user)):
    db = request.app.mongodb
    cursor = db.interviews.find({"user_email": current_user}).sort("timestamp", -1)
    interviews = await cursor.to_list(length=50)
    for i in interviews:
        i["id"] = str(i["_id"])
        del i["_id"]
    return interviews
