# backend/services/attribution.py
# Score Attribution: breaks down the score into concept, logic, and completeness

import re
import numpy as np


# Logical connectors indicate logical flow in explanation
LOGIC_CONNECTORS = [
    "therefore", "because", "since", "thus", "as a result", "consequently",
    "this means", "which causes", "leads to", "due to", "if", "when",
    "so that", "in order to", "for example", "for instance", "such as",
    "however", "but", "on the other hand", "whereas", "although", "despite",
    "first", "second", "then", "finally", "next", "after", "before"
]


def detect_logic_score(text: str) -> float:
    """
    Detects logical reasoning quality in the explanation.
    Measures: connector usage, sentence structure variety, causal language.
    Returns a score 0.0 - 1.0
    """
    if not text or len(text.strip()) < 20:
        return 0.0

    text_lower = text.lower()
    words = text_lower.split()
    total_words = max(len(words), 1)

    # Count logical connectors
    connector_hits = sum(1 for conn in LOGIC_CONNECTORS if conn in text_lower)
    connector_density = min(connector_hits / 5.0, 1.0)  # cap at 5+ connectors = 100%

    # Sentence variety (longer sentences with subordinate clauses = better logic)
    sentences = re.split(r'[.!?]+', text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 10]
    if sentences:
        avg_sentence_length = sum(len(s.split()) for s in sentences) / len(sentences)
        # 15+ words per sentence on average = good logical depth
        length_score = min(avg_sentence_length / 20.0, 1.0)
    else:
        length_score = 0.0

    # Causal language (because, causes, leads to)
    causal_terms = ["because", "causes", "leads to", "results in", "due to", "therefore", "thus"]
    causal_count = sum(1 for term in causal_terms if term in text_lower)
    causal_score = min(causal_count / 3.0, 1.0)

    logic_score = (connector_density * 0.4 + length_score * 0.3 + causal_score * 0.3)
    return round(logic_score, 3)


def calculate_attribution(results: list, text: str) -> dict:
    """
    Breaks down the overall score into three pillars:
    - concept_score: based on concept coverage (understood vs total)
    - logic_score: based on logical coherence of the explanation
    - completeness_score: based on what fraction of total concept weight is covered
    
    Returns dict with scores summing to 100.
    """
    if not results:
        return {"concept": 0, "logic": 0, "completeness": 0}

    total = len(results)
    total_weight = sum(float(r.get("weight", 1)) for r in results)

    # --- Concept Score (based on understood vs total) ---
    understood_count = sum(1 for r in results if r["status"] == "understood")
    concept_raw = understood_count / max(total, 1)

    # --- Logic Score ---
    logic_raw = detect_logic_score(text)

    # --- Completeness Score (weighted coverage) ---
    covered_weight = sum(
        float(r.get("weight", 1))
        for r in results
        if r["status"] in ("understood", "weak")
    )
    completeness_raw = covered_weight / max(total_weight, 1)

    # Normalize so total = 100 (weights: concept=45, logic=25, completeness=30)
    concept_points = round(concept_raw * 45)
    logic_points = round(logic_raw * 25)
    completeness_points = round(completeness_raw * 30)

    return {
        "concept": concept_points,
        "logic": logic_points,
        "completeness": completeness_points,
        "total_check": concept_points + logic_points + completeness_points
    }
