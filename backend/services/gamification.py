"""
Gamification Service: XP, Levels, Streaks, Badges, Activity Heatmap
All logic is self-contained and works with MongoDB or demo mode.
"""
from datetime import datetime, timedelta, date
import math

# XP per action
XP_PER_ANALYSIS = 20
XP_SCORE_MULTIPLIER = 2  # XP += score * 2
STREAK_FREEZE_COST = 50  # XP cost

BADGES = [
    {"id": "first_analysis", "name": "First Steps", "emoji": "🚀", "desc": "Complete your first analysis", "xp": 50},
    {"id": "streak_3",       "name": "On a Roll",   "emoji": "🔥", "desc": "3-day streak",               "xp": 75},
    {"id": "streak_7",       "name": "7-Day Streak","emoji": "🥇", "desc": "7-day streak",               "xp": 150},
    {"id": "streak_30",      "name": "Consistency King","emoji": "👑","desc": "30-day streak",           "xp": 500},
    {"id": "score_90",       "name": "Sharp Mind",  "emoji": "🧠", "desc": "Score 90+ on any topic",     "xp": 100},
    {"id": "score_100",      "name": "Perfect Score","emoji": "💎", "desc": "Score 100 on any topic",    "xp": 200},
    {"id": "topics_5",       "name": "Explorer",    "emoji": "🗺️", "desc": "Attempt 5 different topics", "xp": 100},
    {"id": "topics_10",      "name": "Concept Master","emoji": "📚","desc": "Attempt 10 different topics","xp": 200},
    {"id": "fast_learner",   "name": "Fast Learner", "emoji": "⚡", "desc": "Improve score by 20+ pts in same topic", "xp": 150},
    {"id": "analysis_10",    "name": "Dedicated",   "emoji": "💪", "desc": "Complete 10 analyses",       "xp": 100},
    {"id": "analysis_50",    "name": "Elite Scholar","emoji": "🏆", "desc": "Complete 50 analyses",      "xp": 300},
    {"id": "analysis_100",   "name": "Legend",      "emoji": "🌟", "desc": "Complete 100 analyses",     "xp": 1000},
]

def calc_level(xp: int) -> int:
    """Level = floor(sqrt(xp / 100)) + 1"""
    return max(1, int(math.sqrt(max(0, xp) / 100)) + 1)

def xp_for_level(level: int) -> int:
    return (level - 1) ** 2 * 100

def xp_to_next_level(xp: int) -> dict:
    level = calc_level(xp)
    current_thresh = xp_for_level(level)
    next_thresh = xp_for_level(level + 1)
    progress = xp - current_thresh
    needed = next_thresh - current_thresh
    return {
        "level": level,
        "xp": xp,
        "progress": progress,
        "needed": needed,
        "pct": round((progress / needed) * 100, 1) if needed > 0 else 100
    }

def compute_streak(attempts: list, streak_freezes: int = 0) -> dict:
    """
    Given a list of attempt dicts with 'timestamp' field, compute streak info.
    Includes Duolingo-style streak freeze logic.
    """
    if not attempts:
        return {"current_streak": 0, "longest_streak": 0, "last_active": None, "freezes_available": streak_freezes}
    
    # Get unique dates
    dates = set()
    for a in attempts:
        ts = a.get("timestamp", "")
        if ts:
            try:
                # Handle potential different ISO formats
                if isinstance(ts, str):
                    d = datetime.fromisoformat(ts.replace("Z", "+00:00")).date()
                else:
                    d = ts.date()
                dates.add(d)
            except Exception:
                pass
    
    if not dates:
        return {"current_streak": 0, "longest_streak": 0, "last_active": None, "freezes_available": streak_freezes}
    
    sorted_dates = sorted(list(dates), reverse=True)
    today = date.today()
    yesterday = today - timedelta(days=1)
    
    # Current streak calculation with freeze logic
    current_streak = 0
    last_date = sorted_dates[0]
    
    # If the user hasn't been active today or yesterday
    if last_date < yesterday:
        # Check if we can use freezes
        days_missed = (today - last_date).days - 1
        if days_missed <= streak_freezes:
            # Streak preserved by freezes!
            current_streak = 1 # Start from 1 as we are counting back
            check_date = last_date
        else:
            return {"current_streak": 0, "longest_streak": 0, "last_active": last_date.isoformat(), "freezes_available": streak_freezes}
    else:
        current_streak = 1
        check_date = last_date

    # Walk backwards to find the streak length
    for i in range(1, len(sorted_dates)):
        prev_date = sorted_dates[i]
        diff = (check_date - prev_date).days
        
        if diff == 1:
            current_streak += 1
            check_date = prev_date
        elif diff > 1:
            # We could potentially use freezes here too for historical gaps, 
            # but usually streaks only care about the current tail.
            break
    
    # Longest streak
    longest = 1
    run = 1
    for i in range(1, len(sorted_dates)):
        if (sorted_dates[i-1] - sorted_dates[i]).days == 1:
            run += 1
            longest = max(longest, run)
        else:
            run = 1
    
    return {
        "current_streak": current_streak,
        "longest_streak": max(longest, current_streak),
        "last_active": sorted_dates[0].isoformat(),
        "freezes_available": streak_freezes
    }

def compute_activity_heatmap(attempts: list) -> dict:
    """Returns {date_str: count} for activity heatmap."""
    heatmap = {}
    for a in attempts:
        ts = a.get("timestamp", "")
        if ts:
            try:
                if isinstance(ts, str):
                    d = datetime.fromisoformat(ts.replace("Z", "+00:00")).date().isoformat()
                else:
                    d = ts.date().isoformat()
                heatmap[d] = heatmap.get(d, 0) + 1
            except Exception:
                pass
    return heatmap

def compute_xp(attempts: list, spent_xp: int = 0) -> int:
    """Total XP from all attempts minus spent XP."""
    total = 0
    for a in attempts:
        score = float(a.get("score", a.get("clarity_score", 0)))
        total += XP_PER_ANALYSIS + int(score * XP_SCORE_MULTIPLIER)
    return max(0, total - spent_xp)

def compute_badges(attempts: list, streak: dict) -> list:
    """Returns list of earned badge IDs."""
    earned = []
    if not attempts:
        return earned
    
    scores = [float(a.get("score", a.get("clarity_score", 0))) for a in attempts]
    topics = set(a.get("topic", "") for a in attempts)
    
    n = len(attempts)
    max_score = max(scores) if scores else 0
    
    if n >= 1:      earned.append("first_analysis")
    if n >= 10:     earned.append("analysis_10")
    if n >= 50:     earned.append("analysis_50")
    if n >= 100:    earned.append("analysis_100")
    if max_score >= 90: earned.append("score_90")
    if max_score >= 100: earned.append("score_100")
    if len(topics) >= 5:  earned.append("topics_5")
    if len(topics) >= 10: earned.append("topics_10")
    if streak.get("current_streak", 0) >= 3:  earned.append("streak_3")
    if streak.get("current_streak", 0) >= 7:  earned.append("streak_7")
    if streak.get("current_streak", 0) >= 30: earned.append("streak_30")
    
    # Fast learner: improved by 20+ in same topic
    topic_scores = {}
    for a in attempts:
        t = a.get("topic", "")
        s = float(a.get("score", 0))
        if t not in topic_scores:
            topic_scores[t] = []
        topic_scores[t].append(s)
    for t, ss in topic_scores.items():
        if len(ss) >= 2 and (max(ss) - ss[0]) >= 20:
            earned.append("fast_learner")
            break
    
    return list(set(earned))

def get_full_badges(earned_ids: list) -> list:
    return [b for b in BADGES if b["id"] in earned_ids]

def compute_gamification(attempts: list, streak_freezes: int = 0, spent_xp: int = 0) -> dict:
    streak = compute_streak(attempts, streak_freezes)
    xp = compute_xp(attempts, spent_xp)
    level_info = xp_to_next_level(xp)
    badge_ids = compute_badges(attempts, streak)
    badges = get_full_badges(badge_ids)
    heatmap = compute_activity_heatmap(attempts)
    
    return {
        **streak,
        **level_info,
        "badges": badges,
        "heatmap": heatmap,
    }
