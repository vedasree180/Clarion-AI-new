import numpy as np

def calculate_score(results: list, user_text: str):
    """
    Hybrid Scoring Engine:
    - 50% Semantic Similarity (Meaning)
    - 30% Keyword Coverage (Precision)
    - 20% Explanation Depth (Volume)
    """
    if not results:
        return 0.0
    
    # 1. Semantic Component (50%)
    semantic_scores = [float(r.get("score", 0)) for r in results]
    semantic_base = np.mean(semantic_scores) * 50 if semantic_scores else 0
    
    # 2. Coverage Component (30%)
    # How many concepts were actually "understood"
    understood_count = sum(1 for r in results if r["status"] == "understood")
    coverage_base = (understood_count / len(results)) * 30
    
    # 3. Depth Component (20%)
    # Reward length up to ~150 words
    word_count = len(user_text.split())
    depth_base = min(word_count / 150, 1.0) * 20
    
    total_score = semantic_base + coverage_base + depth_base
    
    # Final clamping and rounding
    final_score = max(0, min(100, round(total_score, 2)))
    return final_score
