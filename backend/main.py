import os
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import certifi
from datetime import datetime, timedelta

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Ensure backend package modules are importable when running via uvicorn
import sys
sys.path.insert(0, os.path.dirname(__file__))

app = FastAPI(title="Clarion API — Production Grade")

MONGO_URL = os.getenv("MONGO_URL", "")
LOCAL_MONGO = os.getenv("LOCAL_MONGO_URL", "mongodb://127.0.0.1:27017")
if "localhost" in LOCAL_MONGO:
    LOCAL_MONGO = LOCAL_MONGO.replace("localhost", "127.0.0.1")
app.mongodb_client = None
app.mongodb = None
app.db_status = "initializing"
app.db_mode = "demo"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


from services.db_manager import db_manager
from services.warmup import init_warmup

@app.on_event("startup")
async def startup_db_client():
    # 1. DB Connection
    await db_manager.connect(MONGO_URL, LOCAL_MONGO)
    app.mongodb = db_manager
    app.mongodb_client = db_manager.client
    app.db_status = db_manager.status
    app.db_mode = db_manager.mode
    
    # 2. AI Engine Warmup (Non-blocking)
    import threading
    threading.Thread(target=init_warmup).start()
    
    logger.info(f"🚀 System started in {app.db_mode} mode.")



@app.on_event("shutdown")
async def shutdown_db_client():
    if app.mongodb_client:
        try:
            app.mongodb_client.close()
        except Exception:
            pass


# ── System Health Endpoint ───────────────────────────────────────────────────
@app.get("/api/system/health")
async def system_health(request: Request):
    """
    Returns real-time system health metrics. 
    Filters by user if a token is provided, otherwise returns global health.
    """
    from services.system_health import compute_system_health
    from services.cache import get_cache_stats
    from jose import jwt
    from services.auth import SECRET_KEY, ALGORITHM

    # Try to get user from token manually
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "") if auth_header else None
    current_user = None
    if token:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            current_user = payload.get("sub")
        except Exception:
            pass

    attempts = []
    feedback_stats = {"total": 0, "positive": 0, "negative": 0}

    attempts = []
    feedback_stats = {"total": 0, "positive": 0, "negative": 0}

    try:
        query = {"user_email": current_user} if current_user else {}
        cursor = request.app.mongodb["attempts"].find(query).sort("timestamp", -1).limit(100)
        attempts = await cursor.to_list(length=100)
        
        total_fb = await request.app.mongodb["feedback"].count_documents(query)
        pos_fb = await request.app.mongodb["feedback"].count_documents({**query, "feedback": "up"})
        feedback_stats = {"total": total_fb, "positive": pos_fb, "negative": total_fb - pos_fb}
        
        health = compute_system_health(attempts, feedback_stats)
    except Exception as e:
        logger.error(f"Health DB error: {e}")
        health = compute_system_health([], {})

    cache_stats = get_cache_stats()

    return {
        **health,
        "db_status": request.app.db_status,
        "db_mode": request.app.db_mode,
        "cache": cache_stats,
        "feedback": feedback_stats,
        "timestamp": datetime.utcnow().isoformat()
    }


# ── Retention Endpoint ────────────────────────────────────────────────────────
@app.get("/api/retention/{topic}")
async def topic_retention(topic: str, request: Request):
    """Returns retention score for a specific topic for the current user."""
    from services.retention import compute_retention_score
    from jose import jwt
    from services.auth import SECRET_KEY, ALGORITHM

    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "") if auth_header else None

    attempts = []
    if request.app.db_status == "connected" and token:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            email = payload.get("sub")
            if email:
                cursor = request.app.mongodb.attempts.find(
                    {"user_email": email, "topic": topic}
                ).sort("timestamp", 1)
                attempts = await cursor.to_list(length=100)
        except Exception:
            pass

    return compute_retention_score(attempts, topic)


@app.get("/api/retention")
async def all_retention(request: Request):
    """Returns retention scores across all topics for the current user."""
    from services.retention import compute_all_topic_retention
    from jose import jwt
    from services.auth import SECRET_KEY, ALGORITHM

    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "") if auth_header else None

    attempts = []
    if token:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            email = payload.get("sub")
            if email:
                cursor = request.app.mongodb["attempts"].find(
                    {"user_email": email}
                ).sort("timestamp", 1)
                attempts = await cursor.to_list(length=500)
        except Exception:
            pass

    return compute_all_topic_retention(attempts)


# ── Import and Include Routers ────────────────────────────────────────────────
from routes.auth import router as auth_router
from routes.analyze import router as analyze_router
@analyze_router.get("")
async def analyze_heartbeat():
    return {"status": "Neural Analysis Engine Active", "mode": "POST_REQUIRED"}
from routes.history import router as history_router
from routes.dashboard import router as dashboard_router
from routes.analytics import router as analytics_router
from routes.profile import router as profile_router
from routes.settings import router as settings_router
from routes.notifications import router as notifications_router
from routes.feedback import router as feedback_router
from routes.gamification import router as gamification_router
from routes.chat import router as chat_router
from routes.interview import router as interview_router

@app.get("/")
async def root():
    return {
        "status": "online",
        "engine": "Clarion Cognitive",
        "routes": [route.path for route in app.routes]
    }

app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(analyze_router, prefix="/api/analyze", tags=["Analysis"])
app.include_router(history_router, prefix="/api/history", tags=["History"])
app.include_router(dashboard_router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(analytics_router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(profile_router, prefix="/api/profile", tags=["Profile"])
app.include_router(chat_router, prefix="/api/tutor", tags=["tutor"])
app.include_router(settings_router, prefix="/api/settings", tags=["Settings"])
app.include_router(notifications_router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(feedback_router, prefix="/api", tags=["Feedback & RL"])
app.include_router(gamification_router, prefix="/api", tags=["Gamification"])
app.include_router(interview_router, prefix="/api/interview", tags=["Interview"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
