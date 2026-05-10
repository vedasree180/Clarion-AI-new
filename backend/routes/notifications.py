from fastapi import APIRouter, Depends, Request
from services.auth import get_current_user
from datetime import datetime, timedelta

router = APIRouter()

@router.get("")
async def get_notifications(request: Request, current_user: str = Depends(get_current_user)):
    db = request.app.mongodb
    if request.app.db_status != "connected":
        # Demo data
        return [
            {
                "id": "1",
                "type": "ai_feedback",
                "title": "AI Feedback Available",
                "message": "Your recent submission for 'Neural Network Basics' has been reviewed.",
                "time": "2m ago",
                "timestamp": (datetime.now() - timedelta(minutes=2)).isoformat(),
                "read": False,
                "detail": "Hi Alex,\n\nI've completed the analysis of your response to the Neural Network Basics: Weight Distribution exercise. Your understanding of backpropagation is exceptional, though I've noted a slight inefficiency in how you structured the hidden layers.\n\nI have annotated your code with specific suggestions to improve computational performance by approximately 15%."
            },
            {
                "id": "2",
                "type": "unlock",
                "title": "New Module Unlocked",
                "message": "Advance to 'Advanced Heuristics' now that you've completed the basics.",
                "time": "1h ago",
                "timestamp": (datetime.now() - timedelta(hours=1)).isoformat(),
                "read": False
            },
            {
                "id": "3",
                "type": "report",
                "title": "Weekly Report Ready",
                "message": "Your learning velocity increased by 14% this week. View full insights.",
                "time": "4h ago",
                "timestamp": (datetime.now() - timedelta(hours=4)).isoformat(),
                "read": True
            }
        ]

    # Real DB fetch
    cursor = db.notifications.find({"user_email": current_user}).sort("timestamp", -1)
    notifications = await cursor.to_list(length=50)
    return notifications

@router.post("/{notification_id}/archive")
async def archive_notification(notification_id: str, request: Request, current_user: str = Depends(get_current_user)):
    db = request.app.mongodb
    if request.app.db_status == "connected":
        await db.notifications.delete_one({"_id": notification_id, "user_email": current_user})
    return {"status": "success"}
