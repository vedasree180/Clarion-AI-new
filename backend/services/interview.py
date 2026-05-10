# backend/services/interview.py
# Interview Mode: determines hiring verdict based on concept performance


def generate_interview_verdict(score: float, understood: list, weak: list, missing: list, topic: str) -> dict:
    """
    Generates an interview-style verdict for the explanation.
    Uses concept coverage and score to simulate how a technical interviewer would judge the answer.
    
    Verdict tiers:
    - STRONG HIRE    : score >= 80 and few missing
    - HIRE           : score >= 65 and key concepts understood
    - WEAK HIRE      : score >= 45, partial coverage
    - NO HIRE        : score < 45 or too many missing critical concepts
    """
    topic_label = topic.replace("_", " ").title()
    total = len(understood) + len(weak) + len(missing)
    missing_ratio = len(missing) / max(total, 1)
    understood_ratio = len(understood) / max(total, 1)

    # Determine verdict
    if score >= 80 and missing_ratio <= 0.2:
        verdict = "STRONG HIRE"
        verdict_color = "success"
        reason = (
            f"The candidate demonstrated excellent understanding of '{topic_label}'. "
            f"Covered {len(understood)} out of {total} key concepts with clarity. "
            "Would confidently pass a senior-level technical screening."
        )
        recommendation = "Proceed to system design or advanced algorithmic rounds."

    elif score >= 65 and understood_ratio >= 0.5:
        verdict = "HIRE"
        verdict_color = "primary"
        reason = (
            f"The candidate showed solid understanding of '{topic_label}' with minor gaps. "
            f"Understood {len(understood)} concepts but was weak on {len(weak)} and missed {len(missing)}. "
            "Suitable for mid-level positions with some guidance."
        )
        recommendation = f"Ask follow-up on: {', '.join([m.replace('_', ' ') for m in missing[:2]])}." if missing else "Proceed to next round."

    elif score >= 45:
        verdict = "WEAK HIRE"
        verdict_color = "warning"
        reason = (
            f"The candidate has a basic grasp of '{topic_label}' but critical gaps are present. "
            f"Missing {len(missing)} concept(s): {', '.join([m.replace('_', ' ') for m in missing[:3]])}. "
            "Would need significant mentoring to be productive."
        )
        recommendation = "Only suitable for junior roles. Require further study before re-interview."

    else:
        verdict = "NO HIRE"
        verdict_color = "error"
        reason = (
            f"The candidate could not adequately explain '{topic_label}'. "
            f"Only {len(understood)} out of {total} concepts were understood. "
            "The explanation lacked technical depth and conceptual accuracy."
        )
        recommendation = "Recommend a structured study plan before re-applying."

    return {
        "verdict": verdict,
        "verdict_color": verdict_color,
        "reason": reason,
        "recommendation": recommendation,
        "interview_score": round(score),
        "concepts_coverage": {
            "understood": len(understood),
            "weak": len(weak),
            "missing": len(missing),
            "total": total
        }
    }
