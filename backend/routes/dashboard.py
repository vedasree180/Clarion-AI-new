from fastapi import APIRouter, Depends, Request
from services.auth import get_current_user
from services.gamification import compute_gamification
from datetime import datetime, timedelta

router = APIRouter()

def attempt_score(attempt: dict) -> float:
    if "score" in attempt:
        return float(attempt["score"])
    if "clarity_score" in attempt:
        return float(attempt["clarity_score"])
    return 0.0


@router.get("")
async def get_dashboard(request: Request, current_user: str = Depends(get_current_user)):
    db = request.app.mongodb

    cursor = db.attempts.find({"user_email": current_user}).sort("timestamp", -1)
    attempts = await cursor.to_list(length=100)
    
    if not attempts:
        return {
            "total_attempts": 0,
            "average_score": 0,
            "best_score": 0,
            "score_trend": "0%",
            "attempts_trend": "0%",
            "recent_activity": []
        }

    # Basic stats
    scores = [attempt_score(a) for a in attempts]
    total_attempts = len(attempts)
    best_score = max(scores)
    avg_score = round(sum(scores) / total_attempts, 2)
    
    # ADVANCED TREND: Compare latest score to the average of previous scores
    score_trend = "+0.0%"
    if len(scores) >= 2:
        latest = scores[0]
        prev_avg = sum(scores[1:5]) / len(scores[1:5]) if len(scores) > 1 else scores[0]
        diff = latest - prev_avg
        # Percent change in performance
        if prev_avg > 0:
            diff_pct = (diff / prev_avg) * 100
            score_trend = f"{'+' if diff_pct >= 0 else ''}{round(diff_pct, 1)}%"
        else:
            score_trend = "+0.0%"

    # Attempts Trend: Count attempts in last 7 days vs previous 7 days
    now = datetime.utcnow()
    last_7_days = now - timedelta(days=7)
    prev_7_days = now - timedelta(days=14)
    
    def parse_ts(ts):
        try:
            if not ts: return None
            # Robust ISO parsing: replace Z with +00:00 for older python or consistency
            if isinstance(ts, str):
                dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            else:
                dt = ts
            # Convert to naive UTC if aware, to compare with now = datetime.utcnow()
            if dt.tzinfo is not None:
                dt = dt.astimezone(None).replace(tzinfo=None)
            return dt
        except Exception:
            return None

    this_week_count = sum(1 for a in attempts if (parse_ts(a.get("timestamp")) or datetime.min) >= last_7_days)
    last_week_count = sum(1 for a in attempts if prev_7_days <= (parse_ts(a.get("timestamp")) or datetime.min) < last_7_days)
    
    if last_week_count > 0:
        diff_pct = ((this_week_count - last_week_count) / last_week_count) * 100
        attempts_trend = f"{'+' if diff_pct >= 0 else ''}{round(diff_pct, 1)}%"
    else:
        attempts_trend = f"+{this_week_count * 100}%" if this_week_count > 0 else "0%"

    # Prep recent activity for UI
    recent = attempts[:5]
    for item in recent:
        item["id"] = str(item["_id"])
        item["score"] = attempt_score(item)
        del item["_id"]

    best_attempt = max(attempts, key=attempt_score)
    topics_attempted = len(set(a["topic"] for a in attempts))

    gami = compute_gamification(attempts)
    return {
        "total_attempts": total_attempts,
        "topics_attempted": topics_attempted,
        "level": gami["level"],
        "xp": gami["xp"],
        "xp_pct": gami["pct"],
        "current_streak": gami["current_streak"],
        "longest_streak": gami["longest_streak"],
        "badges": gami["badges"][:3],
        "heatmap": gami["heatmap"],
        "average_score": avg_score,
        "best_score": best_score,
        "score_trend": score_trend,
        "attempts_trend": attempts_trend,
        "best_topic": best_attempt["topic"].replace("_", " ").title(),
        "recent_activity": recent,
        "history_scores": scores[::-1] # for sparklines
    }
