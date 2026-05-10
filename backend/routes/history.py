from fastapi import APIRouter, Depends, Request, HTTPException
from services.auth import get_current_user
from bson import ObjectId
from typing import List

router = APIRouter()

def attempt_score(attempt: dict) -> float:
    if "score" in attempt:
        return float(attempt["score"])
    if "clarity_score" in attempt:
        return float(attempt["clarity_score"])
    return 0.0

@router.get("/")
async def get_history(request: Request, current_user: str = Depends(get_current_user)):
    db = request.app.mongodb
    
    # Fetch attempts
    cursor = db.attempts.find({"user_email": current_user}).sort("timestamp", -1)
    attempts = await cursor.to_list(length=50)
    for attempt in attempts:
        attempt["id"] = str(attempt["_id"])
        del attempt["_id"]
        attempt["date"] = attempt.get("timestamp")
        attempt["score"] = attempt_score(attempt)
        attempt["entry_type"] = "analysis"

    # Fetch interviews
    int_cursor = db.interviews.find({"user_email": current_user}).sort("timestamp", -1)
    interviews = await int_cursor.to_list(length=50)
    for interview in interviews:
        interview["id"] = str(interview["_id"])
        del interview["_id"]
        interview["date"] = interview.get("timestamp")
        interview["score"] = 100 if "HIRE" in (interview.get("verdict") or "").upper() else 0
        interview["entry_type"] = "interview"

    # Merge and Sort
    combined = attempts + interviews
    combined.sort(key=lambda x: x.get("date", ""), reverse=True)
    
    return combined[:50]

@router.get("/stats")
async def get_stats(request: Request, current_user: str = Depends(get_current_user)):
    db = request.app.mongodb
    cursor = db.attempts.find({"user_email": current_user}).sort("timestamp", 1)
    attempts = await cursor.to_list(length=100)
    if not attempts:
        return {
            "total_attempts": 0, "avg_score": 0, "best_score": 0,
            "best_topic": "N/A",
            "insight": "Start your first analysis to see your progress!"
        }
    total_score = sum(attempt_score(a) for a in attempts)
    best_attempt = max(attempts, key=attempt_score)
    if len(attempts) >= 2:
        last_score = attempt_score(attempts[-1])
        prev_score = attempt_score(attempts[-2])
        if last_score > prev_score:
            insight = "You are improving steadily! Your latest score is higher than the previous one."
        elif last_score == prev_score:
            insight = "Consistent performance. Try to incorporate more technical terms to boost your score."
        else:
            insight = "Your last score dipped slightly. Focus on missing concepts to bounce back."
    else:
        insight = "Great start! Keep practicing different topics to build consistency."
    return {
        "total_attempts": len(attempts),
        "avg_score": round(total_score / len(attempts), 2),
        "best_score": attempt_score(best_attempt),
        "best_topic": best_attempt["topic"].replace('_', ' ').capitalize(),
        "insight": insight
    }

@router.get("/{attempt_id}")
async def get_attempt(attempt_id: str, request: Request, current_user: str = Depends(get_current_user)):
    db = request.app.mongodb
    if attempt_id == "demo":
        # Handle demo ID by returning a generic mock or nothing if we want strict dynamism
        # For now, let's try to find any attempt for this user to make it feel alive
        cursor = db.attempts.find({"user_email": current_user}).sort("timestamp", -1)
        attempts = await cursor.to_list(length=1)
        if attempts: return attempts[0]
        raise HTTPException(status_code=404, detail="No demo data available yet.")
    
    try:
        oid = ObjectId(attempt_id)
    except Exception:
        # Check if it's a string ID from SQLite
        oid = attempt_id 
    attempt = await db.attempts.find_one({"_id": oid, "user_email": current_user})
    if not attempt:
        # Fallback for string ID if ObjectId didn't work (SQLite uses string IDs)
        attempt = await db.attempts.find_one({"_id": str(oid), "user_email": current_user})
    
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    attempt["id"] = str(attempt["_id"])
    del attempt["_id"]
    attempt["score"] = attempt_score(attempt)
    # Ensure all new fields are present with defaults
    attempt.setdefault("agents", {})
    attempt.setdefault("probes", [])
    attempt.setdefault("attribution", {"concept": 0, "logic": 0, "completeness": 0})
    attempt.setdefault("related_concepts", [])
    attempt.setdefault("missing_prerequisites", [])
    attempt.setdefault("next_learning_path", [])
    attempt.setdefault("interview", {})
    attempt.setdefault("reasoning", "")
    attempt.setdefault("personalization", None)
    attempt.setdefault("word_count", 0)
    attempt.setdefault("strengths", 0)
    attempt.setdefault("gaps", 0)
    return attempt
