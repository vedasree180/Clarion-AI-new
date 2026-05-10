# backend/services/agents.py
# Multi-Agent System: critic, coach, evaluator

def generate_agents(understood: list, weak: list, missing: list, score: float, topic: str) -> dict:
    """
    Generates three AI agents that provide structured, intelligent feedback.
    - Critic: points out what's wrong / missing
    - Coach: gives actionable improvement advice
    - Evaluator: justifies the score and verdict
    """
    topic_label = topic.replace("_", " ").title()

    # --- CRITIC ---
    critic_parts = []
    if missing:
        missing_labels = [m.replace("_", " ") for m in missing]
        critic_parts.append(
            f"Critical gaps detected in your explanation of '{topic_label}': "
            f"you completely omitted {', '.join(missing_labels)}. "
            "These are foundational to a complete understanding of this topic."
        )
    if weak:
        weak_labels = [w.replace("_", " ") for w in weak]
        critic_parts.append(
            f"The following concepts were touched on but lacked depth: {', '.join(weak_labels)}. "
            "Your coverage was surface-level — consider expanding on the underlying mechanisms."
        )
    if understood and not missing and not weak:
        critic_parts.append(
            f"No major critical issues found. Your explanation of '{topic_label}' is thorough and well-structured."
        )
    critic = " ".join(critic_parts) if critic_parts else (
        f"Your explanation of '{topic_label}' missed most key concepts. Start with the core definition."
    )

    # --- COACH ---
    coach_parts = []
    if missing:
        top_missing = missing[:3]
        coach_parts.append(
            f"Priority action: Study and re-explain {', '.join([m.replace('_', ' ') for m in top_missing])}. "
            "A strong explanation must include these before moving to advanced topics."
        )
    if weak:
        top_weak = weak[:2]
        coach_parts.append(
            f"To strengthen your answer, elaborate on {', '.join([w.replace('_', ' ') for w in top_weak])} "
            "with concrete examples or analogies. Specificity is the key differentiator."
        )
    if understood:
        coach_parts.append(
            f"Build on your strengths in {', '.join([u.replace('_', ' ') for u in understood[:2]])} "
            "by connecting them to the missing concepts for a more holistic explanation."
        )
    if not coach_parts:
        coach_parts.append(
            "Start fresh by explaining what the concept is, how it works, and provide one real-world example."
        )
    coach = " ".join(coach_parts)

    # --- EVALUATOR ---
    if score >= 80:
        verdict_label = "Strong"
        eval_text = (
            f"Score of {round(score)}% is well-earned. You demonstrated command over most core concepts. "
            f"Understood: {len(understood)} concept(s). Missing: {len(missing)} concept(s). "
            "This reflects a solid mental model ready for application."
        )
    elif score >= 55:
        verdict_label = "Developing"
        eval_text = (
            f"Score of {round(score)}% reflects partial mastery. You have the foundation but significant gaps remain. "
            f"Understood: {len(understood)}, Weak: {len(weak)}, Missing: {len(missing)}. "
            "Focus on the missing concepts to break through to the next level."
        )
    elif score >= 30:
        verdict_label = "Emerging"
        eval_text = (
            f"Score of {round(score)}% indicates early-stage understanding. Most core concepts are unclear or absent. "
            f"Missing {len(missing)} out of {len(understood) + len(weak) + len(missing)} concepts. "
            "Revisit study materials before the next attempt."
        )
    else:
        verdict_label = "Insufficient"
        eval_text = (
            f"Score of {round(score)}% shows very limited understanding of '{topic_label}'. "
            "The explanation lacks necessary technical depth and coverage. "
            "A complete re-study of the topic is recommended."
        )

    return {
        "critic": critic,
        "coach": coach,
        "evaluator": eval_text,
        "verdict_label": verdict_label
    }
