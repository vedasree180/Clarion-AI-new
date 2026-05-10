import nltk
from sentence_transformers import util
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

# Ensure NLTK tokenizer is available
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('tokenizers/punkt_tab')
except LookupError:
    nltk.download('punkt_tab', quiet=True)

from services.concept_graph import concept_graph_service

def check_vocabulary(user_text, concepts):
    used_terms = []
    missing_terms = []
    text = user_text.lower()
    
    # Broad technical indicators that suggest professional depth
    TECHNICAL_INDICATORS = [
        "complexity", "optimize", "efficiency", "structure", "algorithm", 
        "parameter", "function", "variable", "system", "process", 
        "mechanism", "logic", "implementation", "distributed", "parallel",
        "dynamic", "static", "invariant", "iteration", "recursion"
    ]

    # 1. Check for concept-specific keywords
    for concept in concepts:
        keywords = concept.get("keywords", [])
        for kw in keywords:
            kw_low = kw.lower()
            if kw_low in text or any(word in text for word in kw_low.split() if len(word) > 3):
                if kw not in used_terms:
                    used_terms.append(kw)
            else:
                if kw not in missing_terms:
                    missing_terms.append(kw)

    # 2. Check for general technical indicators
    for indicator in TECHNICAL_INDICATORS:
        if indicator in text and indicator not in used_terms:
            used_terms.append(indicator)

    # Clean up and deduplicate
    used_terms = sorted(list(set(used_terms)))
    missing_terms = [m for m in missing_terms if m not in used_terms]

    if not used_terms:
        feedback = "Your explanation lacks technical terminology. Try using more domain-specific terms (nouns and verbs) to strengthen your answer."
    elif len(used_terms) < 4:
        feedback = f"Good start, but try to incorporate more professional terms like '{missing_terms[0]}' or discuss the 'complexity' and 'mechanism' involved."
    else:
        feedback = "Excellent! You've used a rich technical vocabulary that demonstrates deep domain knowledge."

    return {
        "used_terms": used_terms[:12], # Show up to 12 terms
        "missing_terms": missing_terms[:5],
        "vocab_feedback": feedback
    }

def get_analysis_insights(results, vocab_data):
    total = max(len(results), 1)
    covered_count = sum(1 for r in results if r["status"] == "understood")
    coverage_ratio = covered_count / total
    scores = np.array([float(r["score"]) for r in results], dtype=float) if results else np.array([0.0])
    avg_similarity = float(scores.mean())
    variance = float(scores.var())

    if coverage_ratio >= 0.8 and avg_similarity >= 0.7 and variance < 0.1:
        confidence = "High"
        explanation = "High confidence due to strong concept coverage, high semantic alignment, and consistent explanation quality."
    elif coverage_ratio >= 0.5 and avg_similarity >= 0.45:
        confidence = "Medium"
        explanation = "Medium confidence because you covered several concepts, but clarity varies across important areas."
    else:
        confidence = "Low"
        explanation = "Low confidence because coverage is limited and important concepts are weak or missing."

    return confidence, explanation

def detect_depth(user_text, vocab_data):
    """
    Calculate a technical depth score based on terminology, causal reasoning, 
    and architectural understanding.
    """
    text_lower = user_text.lower()
    words = user_text.split()
    
    # 1. Terminology Richness (0.25)
    term_score = min(len(vocab_data.get("used_terms", [])) / 8.0, 1.0)
    
    # 2. Causal Reasoning Detection (0.30)
    # Look for connectors indicating logic/causality
    CAUSAL_CONNECTORS = ["because", "therefore", "consequently", "resulting in", "leads to", "since", "due to", "as a result"]
    causal_count = sum(1 for conn in CAUSAL_CONNECTORS if conn in text_lower)
    causal_score = min(causal_count / 3.0, 1.0)
    
    # 3. Architectural/Structural Insight (0.25)
    ARCH_KEYWORDS = ["architecture", "layer", "interface", "component", "pattern", "distributed", "infrastructure", "scalability", "decoupled"]
    arch_count = sum(1 for kw in ARCH_KEYWORDS if kw in text_lower)
    arch_score = min(arch_count / 2.0, 1.0)
    
    # 4. Abstraction/Example Quality (0.20)
    # Heuristic: long sentences + technical terms often indicate better examples
    avg_sentence_len = len(words) / max(len(nltk.sent_tokenize(user_text)), 1)
    example_score = min(avg_sentence_len / 25.0, 1.0)
    
    depth_score = (
        term_score * 0.25 +
        causal_score * 0.30 +
        arch_score * 0.25 +
        example_score * 0.20
    )
    
    return round(depth_score, 2), {
        "terminology": term_score,
        "causality": causal_score,
        "architecture": arch_score,
        "detail": example_score
    }

def detect_structural_reasoning(user_text):
    """
    Check for logical chains (Structural Reasoning).
    Detects if concepts are linked via causal reasoning.
    """
    text_lower = user_text.lower()
    
    # 1. Logical Connector Chains
    # Pattern: [Concept] -> [Connector] -> [Impact/Result]
    LOGIC_CHAINS = [
        ["because", "therefore", "consequently"], # Causal
        ["if", "then", "otherwise"],               # Conditional
        ["however", "although", "whereas"],        # Contrast/Tradeoff
        ["first", "second", "finally"]             # Sequential
    ]
    
    chain_score = 0
    for chain in LOGIC_CHAINS:
        if any(connector in text_lower for connector in chain):
            chain_score += 0.25
            
    # 2. Structural Density (Relationship words per sentence)
    sentences = nltk.sent_tokenize(user_text)
    if not sentences: return 0
    
    RELATION_WORDS = ["impacts", "influences", "triggers", "handles", "manages", "abstracts", "implements", "extends"]
    rel_count = sum(1 for word in RELATION_WORDS if word in text_lower)
    density_score = min(rel_count / max(len(sentences), 1), 1.0)
    
    return round((chain_score * 0.6) + (density_score * 0.4), 2)

def detect_contradictions(user_text, topic, understood_concepts):
    """
    Detect semantic opposites and false confidence.
    """
    text_lower = user_text.lower()
    contradictions = []
    
    # 1. Semantic Opposite Detection using Concept Graph
    topic_map = {"react": "React", "dsa": "DSA", "system design": "System Design"}
    mapped_topic = topic_map.get(topic.lower(), topic)
    
    for concept in understood_concepts:
        info = concept_graph_service.get_related_info(mapped_topic, concept)
        opposites = info.get("opposites", [])
        for opp in opposites:
            if opp.lower() in text_lower:
                contradictions.append(f"Contradiction: You mentioned '{concept}' but also referenced '{opp}', which is its conceptual opposite.")

    # 2. False Confidence Detection
    CONFIDENCE_PHRASES = ["i am sure", "completely certain", "guaranteed", "always", "never"]
    for phrase in CONFIDENCE_PHRASES:
        if phrase in text_lower:
            if len(user_text.split()) < 20:
                contradictions.append(f"Heuristic Warning: High confidence expressed ('{phrase}') despite very brief explanation.")

    return contradictions

def calibrate_reliability(coverage, depth, structural, contradictions):
    """
    Calculate multi-dimensional reliability stats.
    """
    # Signal: How clear is the intent? (based on structural logic)
    signal = max(0, min(1.0, structural * 1.2))
    
    # Reliability: How much can we trust this score?
    # Penalty if contradictions exist or if depth/coverage are wildly divergent
    divergence = abs(coverage - depth)
    reliability = max(0, min(1.0, 1.0 - (len(contradictions) * 0.4) - (divergence * 0.3)))
    
    return {
        "signal": round(signal, 2),
        "coverage": round(coverage, 2),
        "depth": round(depth, 2),
        "reliability": round(reliability, 2)
    }


def analyze_explanation(user_text, user_embs, concepts, concept_embs, topic="General", is_dynamic=False):
    results = []
    feedback = []
    understood = []
    weak = []
    missing = []

    # Strict Neural Thresholds
    HIGH_MATCH = 0.75
    MID_MATCH = 0.45

    user_text_lower = user_text.lower()

    for concept in concepts:
        concept_name = concept["name"]
        concept_emb = concept_embs[concept_name]
        
        # 1. Semantic Similarity
        if len(user_embs) == 0:
            max_sim = 0.0
        else:
            similarities = cosine_similarity(user_embs, [concept_emb])
            max_sim = float(similarities.max())
        
        # 2. Keyword Assistance (Heuristic Fallback)
        kw_score = 0
        keywords = concept.get("keywords", [])
        if keywords:
            matches = sum(1 for kw in keywords if kw.lower() in user_text_lower)
            kw_score = matches / len(keywords)
        
        # 3. Hybrid Confidence Score
        final_score = (max_sim * 0.8) + (kw_score * 0.2)
        
        if final_score >= HIGH_MATCH:
            status = "understood"
            understood.append(concept_name)
            reason = f"Excellent coverage of {concept_name}."
        elif final_score >= MID_MATCH:
            status = "weak"
            weak.append(concept_name)
            reason = f"You mentioned {concept_name}, but it lacks depth."
            feedback.append(f"Clarify your understanding of '{concept_name}'.")
        else:
            status = "missing"
            missing.append(concept_name)
            reason = f"Concept '{concept_name}' is missing."
            feedback.append(f"Include '{concept_name}' in your explanation.")

        results.append({
            "concept": concept_name,
            "score": round(final_score, 4),
            "status": status,
            "reason": reason
        })

    # 4. Advanced Metrics: Depth & Contradictions
    vocab_data = check_vocabulary(user_text, concepts)
    depth_score, depth_breakdown = detect_depth(user_text, vocab_data)
    structural_score = detect_structural_reasoning(user_text)
    contradictions = detect_contradictions(user_text, topic, understood)
    
    # 5. Final Score Calibration
    coverage_ratio = len(understood) / max(len(concepts), 1)
    
    # Reliability Calibration (Signal, Coverage, Depth, Reliability)
    reliability_stats = calibrate_reliability(coverage_ratio, depth_score, structural_score, contradictions)

    # final = (coverage * 0.5) + (depth * 0.3) + (structural * 0.2) - penalty(contradictions)
    raw_score = (coverage_ratio * 50) + (depth_score * 30) + (structural_score * 20)
    penalty = len(contradictions) * 15
    final_score = max(0, min(100, raw_score - penalty))

    # Confidence & Explanation
    confidence, confidence_explanation = get_analysis_insights(results, vocab_data)

    # Smart Summary
    summary_parts = []
    if contradictions:
        summary_parts.append(f"CRITICAL: {contradictions[0]}")
    if understood:
        summary_parts.append(f"You demonstrate a clear grasp of {', '.join(understood[:3])}.")
    if structural_score < 0.3:
        summary_parts.append("The logical flow is weak; try connecting your points with causal terms like 'because' or 'therefore'.")
    if depth_score < 0.4:
        summary_parts.append("The explanation is technically shallow; try using more architectural context.")

    return {
        "results": results,
        "understood": understood,
        "weak": weak,
        "missing": missing,
        "feedback": feedback,
        "smart_summary": " ".join(summary_parts),
        "vocab_data": vocab_data,
        "depth_score": depth_score,
        "depth_breakdown": depth_breakdown,
        "structural_score": structural_score,
        "reliability_stats": reliability_stats,
        "contradictions": contradictions,
        "score": round(final_score, 2),
        "confidence": confidence,
        "confidence_explanation": confidence_explanation
    }


