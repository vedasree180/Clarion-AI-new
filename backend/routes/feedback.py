from fastapi import APIRouter, Depends, Request, HTTPException
from services.auth import get_current_user
from pydantic import BaseModel
from typing import Optional
from bson import ObjectId
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class FeedbackRequest(BaseModel):
    attempt_id: str
    feedback: str  # "up" | "down"
    correction: Optional[str] = None  # optional user correction text


@router.post("/feedback")
async def submit_feedback(
    payload: FeedbackRequest,
    request: Request,
    current_user: Optional[str] = Depends(get_current_user)
):
    """
    Collects user feedback (thumbs up/down) on an analysis.
    Stores feedback and adjusts RL weights for future scoring improvements.
    """
    if payload.feedback not in ("up", "down"):
        raise HTTPException(status_code=400, detail="feedback must be 'up' or 'down'")

    feedback_doc = {
        "attempt_id": payload.attempt_id,
        "feedback": payload.feedback,
        "correction": payload.correction,
        "user_email": current_user,
        "timestamp": datetime.utcnow().isoformat()
    }

    learning_signal = "Feedback recorded."
    rl_adjustment = {}

    if request.app.db_status == "connected":
        db = request.app.mongodb
        # Save the feedback
        await db.feedback.insert_one(feedback_doc)

        # Fetch original attempt to compute RL adjustment
        try:
            attempt = None
            if payload.attempt_id != "demo":
                attempt = await db.attempts.find_one({"_id": ObjectId(payload.attempt_id)})

            if attempt:
                score = float(attempt.get("score", 0))
                attribution = attempt.get("attribution", {})

                if payload.feedback == "down":
                    # Negative signal: inflate expectations slightly
                    rl_adjustment = {
                        "concept_weight_delta": +0.05,
                        "logic_weight_delta": +0.02,
                        "completeness_weight_delta": +0.03,
                        "signal": "Score was over-estimated. Concept threshold raised."
                    }
                    # Persist RL weight adjustments to a weights collection
                    await db.rl_weights.update_one(
                        {"user_email": current_user},
                        {"$inc": {
                            "concept_bias": -0.05,
                            "logic_bias": -0.02,
                            "completeness_bias": -0.03,
                            "negative_signals": 1
                        }, "$set": {"last_updated": datetime.utcnow().isoformat()}},
                        upsert=True
                    )
                    learning_signal = "⚠️ Model adjusted: scoring threshold raised based on your correction."
                else:
                    # Positive signal: confirm current weights
                    rl_adjustment = {
                        "concept_weight_delta": 0,
                        "logic_weight_delta": 0,
                        "completeness_weight_delta": 0,
                        "signal": "Score confirmed accurate."
                    }
                    await db.rl_weights.update_one(
                        {"user_email": current_user},
                        {"$inc": {"positive_signals": 1},
                         "$set": {"last_updated": datetime.utcnow().isoformat()}},
                        upsert=True
                    )
                    learning_signal = "✅ Model reinforced: your feedback confirms accurate evaluation."

                # Mark attempt as having received feedback
                await db.attempts.update_one(
                    {"_id": ObjectId(payload.attempt_id)},
                    {"$set": {
                        "feedback": payload.feedback,
                        "feedback_at": datetime.utcnow().isoformat(),
                        "user_correction": payload.correction
                    }}
                )
        except Exception as e:
            logger.error(f"RL adjustment error: {e}")
    else:
        learning_signal = "Demo mode: Feedback noted locally (not persisted)."

    return {
        "status": "ok",
        "feedback": payload.feedback,
        "learning_signal": learning_signal,
        "rl_adjustment": rl_adjustment
    }


@router.get("/feedback/stats")
async def get_feedback_stats(
    request: Request,
    current_user: str = Depends(get_current_user)
):
    """Returns user's feedback history and RL weight state."""
    if request.app.db_status != "connected":
        return {"positive": 0, "negative": 0, "rl_weights": {}}

    db = request.app.mongodb
    weights = await db.rl_weights.find_one({"user_email": current_user})
    feedback_count = await db.feedback.count_documents({"user_email": current_user})
    positive = await db.feedback.count_documents({"user_email": current_user, "feedback": "up"})
    negative = feedback_count - positive

    return {
        "positive": positive,
        "negative": negative,
        "total": feedback_count,
        "rl_weights": {
            "concept_bias": weights.get("concept_bias", 0) if weights else 0,
            "logic_bias": weights.get("logic_bias", 0) if weights else 0,
            "completeness_bias": weights.get("completeness_bias", 0) if weights else 0,
        }
    }
