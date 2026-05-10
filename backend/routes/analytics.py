from collections import defaultdict
from fastapi import APIRouter, Depends, Request
from services.auth import get_current_user
import json

router = APIRouter()

try:
    with open("data/concepts.json") as f:
        concepts_db = json.load(f)
except Exception:
    concepts_db = {}

def attempt_score(attempt: dict) -> float:
    if "score" in attempt:
        return float(attempt["score"])
    if "clarity_score" in attempt:
        return float(attempt["clarity_score"])
    return 0.0

@router.get("")
async def get_analytics(request: Request, current_user: str = Depends(get_current_user)):
    db = request.app.mongodb

    cursor = db.attempts.find({"user_email": current_user}).sort("timestamp", 1)
    attempts = await cursor.to_list(length=300)
    
    if not attempts:
        return {
            "scores_over_time": [],
            "topic_performance": [],
            "concepts": [],
            "insights": "Start analyzing topics to unlock insights.",
            "total_concepts": 0,
            "active_lessons": 0,
            "mastery_percentage": 0
        }

    scores_over_time = []
    topic_buckets = defaultdict(list)
    concept_buckets = defaultdict(list)
    difficulty_buckets = defaultdict(list)
    
    # Process all attempts
    for item in attempts:
        score = attempt_score(item)
        date_name = item["timestamp"].split("T")[0][5:] # MM-DD
        
        scores_over_time.append({
            "name": date_name,
            "score": score,
            "target": 80
        })
        
        topic_buckets[item["topic"]].append(score)
        difficulty = concepts_db.get(item["topic"], {}).get("difficulty", "medium")
        difficulty_buckets[difficulty].append(score)
        
        # Concept breakdown
        concepts_data = item.get("concepts_raw") or item.get("concepts", {}).get("understood", [])
        if isinstance(concepts_data, list):
            for c in concepts_data:
                if isinstance(c, dict) and "concept" in c:
                    concept_buckets[c["concept"]].append(float(c.get("score", 0)))
                elif isinstance(c, str):
                    concept_buckets[c].append(1.0) # If it was listed as understood

    # Topic performance list
    topic_performance = []
    for topic, values in topic_buckets.items():
        topic_performance.append({
            "topic": topic,
            "average_score": round(sum(values) / len(values), 2),
            "attempts": len(values)
        })
    topic_performance.sort(key=lambda x: x["average_score"], reverse=True)

    # Concept mastery
    concept_mastery = []
    total_mastery_sum = 0
    for concept, values in concept_buckets.items():
        avg = sum(values) / len(values)
        concept_mastery.append({
            "name": concept,
            "score": round(avg * 100, 2),
            "difficulty": "Intermediate", # Default
            "status": "Understood" if avg > 0.7 else "In Progress"
        })
        total_mastery_sum += avg

    # Weakest concepts for the mapping card
    weakest_concepts = sorted(
        [{"concept": c["name"], "score": c["score"]} for c in concept_mastery],
        key=lambda x: x["score"]
    )[:5]

    # Trends and Insights
    insight = "Your performance is stabilizing."
    if topic_performance:
        insight = f"Your strongest topic is {topic_performance[0]['topic'].title()}."

    # Yearly activity for heatmap
    yearly_activity = defaultdict(int)
    for item in attempts:
        date_str = item["timestamp"].split("T")[0]
        yearly_activity[date_str] += 1

    # Final response assembly
    return {
        "scores_over_time": scores_over_time[-10:], # Last 10 attempts for the graph
        "topic_performance": topic_performance,
        "concepts": concept_mastery[:10], # Top 10 for the drill-down table
        "weakest_concepts": weakest_concepts,
        "trend": "Improving" if len(scores_over_time) > 1 and scores_over_time[-1]["score"] > scores_over_time[0]["score"] else "Stable",
        "insights": insight,
        "yearly_activity": dict(yearly_activity),
        "total_concepts": len(concept_buckets),
        "active_lessons": len(topic_buckets),
        "mastery_percentage": round((total_mastery_sum / len(concept_buckets)) * 100, 1) if concept_buckets else 0
    }
