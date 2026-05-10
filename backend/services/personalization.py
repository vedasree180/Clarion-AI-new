# backend/services/personalization.py
# Personalization Engine: uses historical user data to adapt recommendations

from datetime import datetime


def build_user_mastery(history: list) -> dict:
    """
    Builds a user mastery map from their attempt history.
    Returns: { "topic_name": { "mastery": 0.0-1.0, "attempts": N, "trend": "up/down/stable" } }
    """
    mastery_map = {}

    for attempt in history:
        topic = attempt.get("topic", "general")
        score = float(attempt.get("score", 0)) / 100.0

        if topic not in mastery_map:
            mastery_map[topic] = {"scores": [], "attempts": 0}

        mastery_map[topic]["scores"].append(score)
        mastery_map[topic]["attempts"] += 1

    # Convert to final mastery scores with trend
    result = {}
    for topic, data in mastery_map.items():
        scores = data["scores"]
        avg = sum(scores) / len(scores)
        trend = "stable"
        if len(scores) >= 2:
            recent = scores[-1]
            prev = scores[-2]
            if recent > prev + 0.05:
                trend = "improving"
            elif recent < prev - 0.05:
                trend = "declining"
        result[topic] = {
            "mastery": round(avg, 2),
            "attempts": data["attempts"],
            "trend": trend
        }

    return result


def get_personalized_focus(
    current_topic: str,
    understood: list,
    weak: list,
    missing: list,
    user_mastery: dict,
    next_learning_path: list
) -> dict:
    """
    Generates personalized next-step recommendations based on:
    - Current session performance
    - Historical mastery of topics
    - Concept graph suggestions
    """
    topic_label = current_topic.replace("_", " ").title()

    # Priority: address missing concepts first, then weak, then advance
    if missing:
        primary_focus = missing[:2]
        focus_reason = f"These critical concepts of '{topic_label}' are completely absent from your explanation."
        action = f"Study {', '.join([m.replace('_', ' ') for m in primary_focus])} before your next attempt."
        priority = "high"
    elif weak:
        primary_focus = weak[:2]
        focus_reason = f"You mentioned these concepts but need more depth and precision."
        action = f"Deepen your understanding of {', '.join([w.replace('_', ' ') for w in primary_focus])} with examples."
        priority = "medium"
    else:
        primary_focus = next_learning_path[:2] if next_learning_path else []
        focus_reason = f"Excellent coverage of '{topic_label}'! Time to advance to the next level."
        action = f"Move to {', '.join(primary_focus)} to extend your knowledge graph." if primary_focus else "Challenge yourself with a harder topic."
        priority = "low"

    # Check if this topic has been studied before (historical context)
    history_note = None
    if current_topic in user_mastery:
        past_data = user_mastery[current_topic]
        past_mastery = past_data["mastery"]
        trend = past_data["trend"]
        attempts = past_data["attempts"]
        if trend == "improving":
            history_note = f"Great progress! Your mastery of '{topic_label}' has improved across {attempts} attempt(s)."
        elif trend == "declining":
            history_note = f"Your recent scores on '{topic_label}' have dipped — don't give up, review the weak areas."
        else:
            history_note = f"You've attempted '{topic_label}' {attempts} time(s) with consistent performance."

    # Suggest next topic from learning path
    next_topic = next_learning_path[0] if next_learning_path else None

    return {
        "priority": priority,
        "next_focus": [f.replace("_", " ") for f in primary_focus],
        "focus_reason": focus_reason,
        "action_item": action,
        "history_note": history_note,
        "recommended_next_topic": next_topic,
        "mastery_snapshot": user_mastery.get(current_topic)
    }
