# backend/services/system_health.py
# System Health Dashboard: accuracy, drift detection, domain coverage, health metrics

from datetime import datetime, timedelta
from typing import Optional


# ─── FAILURE DETECTION ─────────────────────────────────────────────────────────

def detect_insufficient_input(explanation: str) -> Optional[dict]:
    """
    Detects if the user's input is too sparse to yield a valid analysis.
    Returns an error dict if insufficient, None if OK.
    """
    if not explanation or not explanation.strip():
        return {
            "error": "empty_input",
            "message": "⚠️ Please provide an explanation before analyzing.",
            "can_proceed": False
        }

    word_count = len(explanation.strip().split())
    if word_count < 5:
        return {
            "error": "too_short",
            "message": f"⚠️ Your explanation is too short ({word_count} word(s)). Please provide at least 5 words for a meaningful analysis.",
            "can_proceed": False
        }

    # Check for nonsense / repetitive input
    words = explanation.lower().split()
    unique_ratio = len(set(words)) / max(len(words), 1)
    if unique_ratio < 0.2 and word_count > 10:
        return {
            "error": "low_diversity",
            "message": "⚠️ Your explanation appears repetitive or lacks substance. Please describe the topic in your own words.",
            "can_proceed": False
        }

    return None  # All clear


# ─── DOMAIN GENERALIZATION ──────────────────────────────────────────────────────

# Domain taxonomy for generalization detection
DOMAIN_MAP = {
    # CS / Engineering
    "binary_search": "computer_science",
    "sorting_algorithms": "computer_science",
    "neural_networks": "computer_science",
    "machine_learning": "computer_science",
    "data_structures": "computer_science",
    "recursion": "computer_science",
    "oop": "computer_science",
    "databases": "computer_science",
    "api": "computer_science",
    "networking": "computer_science",
    "operating_systems": "computer_science",
    "compiler": "computer_science",

    # Biology
    "photosynthesis": "biology",
    "dna_replication": "biology",
    "cell_division": "biology",
    "evolution": "biology",
    "genetics": "biology",
    "protein_synthesis": "biology",
    "cellular_respiration": "biology",
    "immune_system": "biology",
    "homeostasis": "biology",

    # Chemistry
    "chemical_bonding": "chemistry",
    "periodic_table": "chemistry",
    "acid_base": "chemistry",
    "oxidation_reduction": "chemistry",
    "thermodynamics": "chemistry",
    "equilibrium": "chemistry",
    "stoichiometry": "chemistry",

    # Physics
    "newtons_laws": "physics",
    "quantum_mechanics": "physics",
    "electromagnetism": "physics",
    "thermodynamics_physics": "physics",
    "relativity": "physics",
    "wave_optics": "physics",

    # Math / Theory
    "probability": "mathematics",
    "calculus": "mathematics",
    "linear_algebra": "mathematics",
    "graph_theory": "mathematics",
    "set_theory": "mathematics",
    "differential_equations": "mathematics",
}

# Strength by domain (0.0-1.0, based on concept bank coverage)
DOMAIN_STRENGTH = {
    "computer_science": 0.95,
    "mathematics": 0.85,
    "physics": 0.72,
    "chemistry": 0.65,
    "biology": 0.68,
    "unknown": 0.55,
}

DOMAIN_LABELS = {
    "computer_science": "Computer Science",
    "mathematics": "Mathematics",
    "physics": "Physics",
    "chemistry": "Chemistry",
    "biology": "Biology",
    "unknown": "General / Unknown",
}


def get_domain_info(topic: str) -> dict:
    """Returns domain classification and confidence level for a topic."""
    domain = DOMAIN_MAP.get(topic.lower(), "unknown")
    strength = DOMAIN_STRENGTH.get(domain, 0.55)
    label = DOMAIN_LABELS.get(domain, "General")

    if strength >= 0.85:
        coverage = "high"
        note = f"Strong concept bank coverage for {label}. Analysis is highly reliable."
    elif strength >= 0.65:
        coverage = "medium"
        note = f"Moderate coverage for {label}. Core concepts are well represented."
    else:
        coverage = "low"
        note = f"Limited coverage for {label}. Consider using domain-specific terminology for better scoring."

    return {
        "domain": domain,
        "domain_label": label,
        "domain_strength": strength,
        "coverage_level": coverage,
        "domain_note": note
    }


# ─── DRIFT DETECTION ────────────────────────────────────────────────────────────

DRIFT_THRESHOLD = 0.15   # 15% accuracy drop triggers drift warning
DRIFT_WINDOW = 10        # Compare last N attempts vs earlier N


def detect_drift(attempts: list) -> dict:
    """
    Compares average score of recent attempts vs earlier attempts.
    If accuracy drops by DRIFT_THRESHOLD, raises a drift alert.
    """
    if len(attempts) < DRIFT_WINDOW * 2:
        return {
            "drift_detected": False,
            "status": "stable",
            "message": "Insufficient history for drift analysis.",
            "confidence": "low"
        }

    scores = [float(a.get("score", 0)) / 100.0 for a in attempts]
    earlier = scores[:DRIFT_WINDOW]
    recent = scores[-DRIFT_WINDOW:]

    earlier_avg = sum(earlier) / len(earlier)
    recent_avg = sum(recent) / len(recent)
    delta = earlier_avg - recent_avg  # positive means recent is worse

    if delta > DRIFT_THRESHOLD:
        return {
            "drift_detected": True,
            "status": "drift_detected",
            "message": f"⚠️ Model drift detected: accuracy dropped {round(delta*100, 1)}% in recent attempts. Consider reviewing foundational concepts.",
            "earlier_avg": round(earlier_avg * 100, 1),
            "recent_avg": round(recent_avg * 100, 1),
            "delta": round(delta * 100, 1),
            "recommendation": "trigger_review",
            "confidence": "high"
        }
    elif delta > 0.05:
        return {
            "drift_detected": False,
            "status": "slight_decline",
            "message": f"Slight performance dip ({round(delta*100, 1)}%). Monitor closely.",
            "earlier_avg": round(earlier_avg * 100, 1),
            "recent_avg": round(recent_avg * 100, 1),
            "delta": round(delta * 100, 1),
            "confidence": "medium"
        }
    else:
        return {
            "drift_detected": False,
            "status": "stable",
            "message": "Model accuracy is stable.",
            "earlier_avg": round(earlier_avg * 100, 1),
            "recent_avg": round(recent_avg * 100, 1),
            "delta": round(delta * 100, 1),
            "confidence": "high"
        }


# ─── SYSTEM HEALTH DASHBOARD ────────────────────────────────────────────────────

def compute_system_health(attempts: list, feedback_stats: Optional[dict] = None) -> dict:
    """
    Computes the overall system health dashboard metrics.
    """
    if not attempts:
        return {
            "accuracy": 0,
            "confidence_avg": 0,
            "agent_consistency": 0,
            "drift_status": "unknown",
            "total_analyses": 0,
            "health_label": "No Data",
            "health_color": "gray",
            "health_icon": "❓"
        }

    scores = [float(a.get("score", 0)) for a in attempts]
    confidence_scores = [float(a.get("confidence_score", 0.5)) for a in attempts
                         if a.get("confidence_score") is not None]

    accuracy = round(sum(scores) / len(scores), 1)
    confidence_avg = round(sum(confidence_scores) / max(len(confidence_scores), 1), 2)

    # Agent consistency: std deviation of scores (lower = more consistent)
    if len(scores) >= 2:
        mean = accuracy / 100.0
        variance = sum((s/100.0 - mean)**2 for s in scores) / len(scores)
        std_dev = variance ** 0.5
        agent_consistency = round(max(0, 1.0 - std_dev * 2), 2)
    else:
        agent_consistency = 1.0

    # Drift
    drift = detect_drift(attempts)
    drift_status = drift["status"]

    # Feedback health
    feedback_ratio = 1.0
    if feedback_stats and feedback_stats.get("total", 0) > 0:
        pos = feedback_stats.get("positive", 0)
        total = feedback_stats.get("total", 1)
        feedback_ratio = pos / total

    # Overall health score
    health_score = (
        (accuracy / 100) * 0.40 +
        confidence_avg * 0.25 +
        agent_consistency * 0.20 +
        feedback_ratio * 0.15
    )

    if health_score >= 0.80:
        health_label = "Excellent"
        health_color = "green"
        health_icon = "🛡️"
    elif health_score >= 0.60:
        health_label = "Good"
        health_color = "blue"
        health_icon = "✅"
    elif health_score >= 0.40:
        health_label = "Fair"
        health_color = "yellow"
        health_icon = "⚠️"
    else:
        health_label = "Needs Attention"
        health_color = "red"
        health_icon = "🔴"

    return {
        "accuracy": accuracy,
        "confidence_avg": confidence_avg,
        "agent_consistency": agent_consistency,
        "drift_status": drift_status,
        "drift_details": drift,
        "total_analyses": len(attempts),
        "health_score": round(health_score, 2),
        "health_label": health_label,
        "health_color": health_color,
        "health_icon": health_icon,
        "feedback_ratio": round(feedback_ratio, 2)
    }
