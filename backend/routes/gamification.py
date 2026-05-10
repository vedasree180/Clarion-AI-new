from fastapi import APIRouter, Depends, Request
from services.auth import get_current_user
from services.gamification import compute_gamification, BADGES

router = APIRouter()

DEMO_GAMIFICATION = {
    "current_streak": 12,
    "longest_streak": 22,
    "last_active": "2026-04-30",
    "level": 8,
    "xp": 4850,
    "progress": 250,
    "needed": 900,
    "pct": 27.8,
    "freezes_available": 2,
    "badges": [
        {"id": "first_analysis","name": "First Steps","emoji": "🚀","desc": "Complete your first analysis","xp": 50},
        {"id": "streak_7","name": "7-Day Streak","emoji": "🥇","desc": "7-day streak","xp": 150},
        {"id": "score_90","name": "Sharp Mind","emoji": "🧠","desc": "Score 90+ on any topic","xp": 100},
    ],
    "heatmap": {
        "2026-04-20": 1, "2026-04-21": 2, "2026-04-22": 1,
        "2026-04-23": 3, "2026-04-24": 1, "2026-04-25": 2, "2026-04-26": 1,
        "2026-04-27": 2, "2026-04-28": 4, "2026-04-29": 1, "2026-04-30": 2,
    },
    "all_badges": BADGES,
}

@router.get("/gamification")
async def get_gamification(request: Request, current_user: str = Depends(get_current_user)):
    db = request.app.mongodb

    db = request.app.mongodb
    user = await db.users.find_one({"email": current_user})
    attempts = await db.attempts.find({"user_email": current_user}).sort("timestamp", 1).to_list(length=1000)
    
    streak_freezes = user.get("streak_freezes", 0) if user else 0
    spent_xp = user.get("spent_xp", 0) if user else 0
    
    result = compute_gamification(attempts, streak_freezes, spent_xp)
    result["all_badges"] = BADGES
    return result

@router.get("/gamification/heatmap")
async def get_heatmap(request: Request, current_user: str = Depends(get_current_user)):
    db = request.app.mongodb

    db = request.app.mongodb
    cursor = db.attempts.find({"user_email": current_user}).sort("timestamp", 1)
    attempts = await cursor.to_list(length=1000)
    
    from services.gamification import compute_activity_heatmap
    return compute_activity_heatmap(attempts)
