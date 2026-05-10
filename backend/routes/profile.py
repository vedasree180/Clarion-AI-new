from fastapi import APIRouter, Depends, Request
from services.auth import get_current_user
from services.gamification import compute_gamification

router = APIRouter()


@router.get("")
async def get_profile(request: Request, current_user: str = Depends(get_current_user)):
    db = request.app.mongodb
    user = await db.users.find_one({"email": current_user})
    attempts = await db.attempts.find({"user_email": current_user}).sort("timestamp", 1).to_list(length=1000)

    best_topic = "N/A"
    if attempts:
        top = max(attempts, key=lambda x: float(x.get("score", x.get("clarity_score", 0))))
        best_topic = top["topic"].replace("_", " ").title()

    streak_freezes = user.get("streak_freezes", 0) if user else 0
    spent_xp = user.get("spent_xp", 0) if user else 0
    gami = compute_gamification(attempts, streak_freezes, spent_xp)

    return {
        "email": current_user,
        "username": user.get("username", "student") if user else "student",
        "name": user.get("name", "Student") if user else "Student",
        "bio": user.get("bio", "") if user else "",
        "skill_level": user.get("skill_level", "Beginner") if user else "Beginner",
        "preferred_domain": user.get("preferred_domain", "CS") if user else "CS",
        "learning_style": user.get("learning_style", "conceptual") if user else "conceptual",
        "avatar": user.get("avatar") if user else None,
        "total_attempts": len(attempts),
        "best_topic": best_topic,
        "level": gami["level"],
        "xp": gami["xp"],
        "progress": gami["progress"],
        "needed": gami["needed"],
        "pct": gami["pct"],
        "current_streak": gami["current_streak"],
        "longest_streak": gami["longest_streak"],
        "freezes_available": gami["freezes_available"],
        "badges": gami["badges"],
    }


@router.post("/buy-freeze")
async def buy_streak_freeze(request: Request, current_user: str = Depends(get_current_user)):
    from services.gamification import STREAK_FREEZE_COST, compute_xp

    db = request.app.mongodb
    user = await db.users.find_one({"email": current_user})
    attempts = await db.attempts.find({"user_email": current_user}).to_list(length=1000)
    
    spent_xp = user.get("spent_xp", 0)
    current_xp = compute_xp(attempts, spent_xp)
    
    if current_xp < STREAK_FREEZE_COST:
        return {"error": "insufficient_xp", "message": f"You need {STREAK_FREEZE_COST} XP to buy a freeze."}
    
    await db.users.update_one(
        {"email": current_user},
        {"$inc": {"streak_freezes": 1, "spent_xp": STREAK_FREEZE_COST}}
    )
    
    return {"message": "Streak freeze purchased!", "cost": STREAK_FREEZE_COST}


@router.put("")
async def update_profile(request: Request, current_user: str = Depends(get_current_user)):
    body = await request.json()
    allowed = {"bio", "skill_level", "preferred_domain", "learning_style", "avatar", "name", "username"}
    update = {k: v for k, v in body.items() if k in allowed and v is not None}

    if update:
        db = request.app.mongodb
        await db.users.update_one({"email": current_user}, {"$set": update})

    return {"message": "Profile updated successfully", "updated": list(update.keys())}
