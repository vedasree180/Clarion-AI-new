# backend/services/retention.py
# Retention Validation: tracks long-term memory retention across time gaps

from datetime import datetime, timedelta
from typing import Optional


def compute_retention_score(attempts: list, topic: str) -> dict:
    """
    Computes a retention score based on score trajectory over time.
    Retention = how well the user maintains their peak score after a gap.

    retention_score = (score_after_gap / peak_score) * 100
    Gaps < 1 day are ignored (same-session re-attempts don't count).
    """
    topic_attempts = [a for a in attempts if a.get("topic") == topic]
    topic_attempts.sort(key=lambda x: x.get("timestamp", ""))

    if len(topic_attempts) < 2:
        return {
            "retention_score": None,
            "status": "insufficient_data",
            "label": "Not enough attempts",
            "message": "Need at least 2 attempts on this topic with a gap to measure retention.",
            "attempts_count": len(topic_attempts)
        }

    # Find peak score and the attempt that followed it after a gap
    peak_score = 0
    peak_time = None
    for a in topic_attempts:
        s = float(a.get("score", 0))
        if s > peak_score:
            peak_score = s
            peak_time = a.get("timestamp", "")

    # Find the best score AFTER peak that has a 1+ day gap
    retention_score = None
    days_gap = None
    for a in topic_attempts:
        ts = a.get("timestamp", "")
        if ts <= peak_time:
            continue
        try:
            peak_dt = datetime.fromisoformat(peak_time)
            attempt_dt = datetime.fromisoformat(ts)
            gap = (attempt_dt - peak_dt).total_seconds() / 86400  # days
            if gap >= 1:
                post_score = float(a.get("score", 0))
                retention_score = round((post_score / max(peak_score, 1)) * 100, 1)
                days_gap = round(gap, 1)
                break
        except Exception:
            continue

    if retention_score is None:
        return {
            "retention_score": None,
            "status": "no_gap_attempt",
            "label": "No spaced attempt yet",
            "message": "Return to this topic after 24h+ to measure retention.",
            "peak_score": round(peak_score, 1)
        }

    # Classify retention
    if retention_score >= 90:
        status = "excellent"
        label = "Excellent Retention"
        color = "green"
        message = f"You retained {retention_score}% of your peak after {days_gap} days."
    elif retention_score >= 75:
        status = "good"
        label = "Good Retention"
        color = "blue"
        message = f"You retained {retention_score}% of your peak. Minor review recommended."
    elif retention_score >= 55:
        status = "moderate"
        label = "Needs Reinforcement"
        color = "yellow"
        message = f"Retention dropped to {retention_score}%. Active review of missing concepts is critical."
    else:
        status = "poor"
        label = "Significant Decay"
        color = "red"
        message = f"Only {retention_score}% retained after {days_gap} days. Full re-study recommended."

    return {
        "retention_score": retention_score,
        "peak_score": round(peak_score, 1),
        "days_since_peak": days_gap,
        "status": status,
        "label": label,
        "color": color,
        "message": message,
        "attempts_count": len(topic_attempts)
    }


def compute_all_topic_retention(attempts: list) -> list:
    """
    Computes retention for every topic the user has attempted.
    Returns sorted list (worst retention first).
    """
    topics = list(set(a.get("topic", "") for a in attempts if a.get("topic")))
    result = []
    for topic in topics:
        ret = compute_retention_score(attempts, topic)
        if ret.get("retention_score") is not None:
            result.append({
                "topic": topic.replace("_", " ").title(),
                "topic_key": topic,
                **ret
            })
    result.sort(key=lambda x: x.get("retention_score", 100))
    return result
