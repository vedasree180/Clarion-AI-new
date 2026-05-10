# backend/services/reasoning.py
# Reasoning Layer: generates human-like reasoning explanation of the AI's analysis

def generate_reasoning(
    topic: str,
    understood: list,
    weak: list,
    missing: list,
    score: float,
    depth_score: float,
    contradictions: list,
    vocab_data: dict
) -> str:
    """
    Reasoning Matrix: Selects nuanced feedback based on the combination of 
    coverage, depth, and technical accuracy.
    """
    total_concepts = len(understood) + len(weak) + len(missing)
    coverage = len(understood) / max(total_concepts, 1)
    
    parts = []
    
    # 1. Contradiction Override
    if contradictions:
        parts.append(f"Assessment Flagged: {contradictions[0]} This indicates a fundamental misunderstanding that overrides other positive signals.")
        return " ".join(parts)

    # 2. Reasoning Matrix Core Logic
    if coverage >= 0.8:
        if depth_score >= 0.7:
            parts.append(f"Expert-Grade Mastery: Your explanation of '{topic}' is both broad and deep. You've successfully connected all core concepts with architectural insight and causal reasoning.")
        elif depth_score >= 0.4:
            parts.append(f"High Coverage, Developing Depth: You understand the full scope of '{topic}', but your explanation remains somewhat descriptive. Try to elaborate more on the 'why' and 'how' (causal links) to reach an elite level.")
        else:
            parts.append(f"Surface-Level Coverage: While you mentioned most key concepts for '{topic}', the explanation lacks technical implementation depth. It sounds like a high-level summary rather than a technical deep-dive.")
    
    elif coverage >= 0.4:
        if depth_score >= 0.6:
            parts.append(f"Deep but Narrow: For the concepts you did cover, you showed excellent technical depth. However, you missed several foundational pillars of '{topic}', making the overall explanation incomplete.")
        else:
            parts.append(f"Foundational Stage: You have a basic grasp of some core elements, but the explanation is both narrow in scope and shallow in technical detail. Focus on expanding your conceptual map.")
            
    else:
        parts.append(f"Emerging Understanding: Most core concepts of '{topic}' were not detected. The explanation lacks the technical structure and terminology required for a professional assessment.")

    # 3. Vocabulary Insight
    used_terms = vocab_data.get("used_terms", [])
    if used_terms:
        parts.append(f"Technical signal detected through your use of: {', '.join(used_terms[:4])}.")
        
    # 4. Closing Recommendation
    if missing:
        parts.append(f"To improve, focus on integrating {', '.join([m.replace('_', ' ') for m in missing[:2]])} into your mental model.")

    return " ".join(parts)
