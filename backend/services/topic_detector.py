# backend/services/topic_detector.py
from services.embedding import get_embedding
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

# Domain keywords for better classification
DOMAINS = {
    "computer science": ["algorithm", "data structure", "binary search", "sorting", "complexity", "pointers"],
    "physics": ["force", "energy", "newton", "motion", "quantum", "entropy", "thermodynamics"],
    "biology": ["cell", "photosynthesis", "DNA", "enzyme", "organism", "mitosis"],
    "chemistry": ["reaction", "molecule", "bond", "acid", "periodic table", "element"],
    "math": ["equation", "integral", "derivative", "probability", "statistics", "calculus"]
}

def detect_domain(text, model_embedding):
    """Detects the academic domain of the text using embeddings."""
    best_domain = "general"
    best_score = 0

    for domain, keywords in DOMAINS.items():
        # In a real system, we'd pre-calculate these keyword embeddings
        # But for now, we simulate the logic
        # Here we just check for keyword presence as a fallback if embedding logic is complex
        for kw in keywords:
            if kw in text.lower():
                return domain
    
    return "general"

def detect_topic(text):
    """
    Advanced topic extraction.
    """
    if not text:
        return "general"
        
    words = text.lower().split()
    
    # Try to find common technical phrases (simple heuristic)
    # If first few words contain a known concept
    # In production, use spaCy or similar for NER/Keyphrase extraction
    
    # Extract the first few meaningful words as the topic if no seed matches
    stop_words = {"a", "an", "the", "in", "on", "at", "to", "is", "of", "and"}
    meaningful_words = [w for w in words if w not in stop_words]
    
    if len(meaningful_words) >= 2:
        return " ".join(meaningful_words[:2]).strip(".,?!")
    elif len(meaningful_words) == 1:
        return meaningful_words[0].strip(".,?!")
            
    return "general"
