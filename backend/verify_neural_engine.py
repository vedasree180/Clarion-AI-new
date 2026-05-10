# backend/verify_neural_engine.py
import sys
import os
import nltk

# Add current directory to path
sys.path.append(os.getcwd())

from services.gap_detector import analyze_explanation
from services.reasoning import generate_reasoning

# Mock data
concepts = [
    {"name": "Hooks", "description": "React hooks allow functional components to use state.", "keywords": ["useState", "useEffect"]},
    {"name": "Virtual DOM", "description": "A lightweight copy of the real DOM.", "keywords": ["Diffing", "Reconciliation"]}
]
concept_embs = {
    "Hooks": [0.1] * 384, # Mock embeddings
    "Virtual DOM": [0.2] * 384
}

def test_depth():
    print("\n--- Testing Technical Depth ---")
    text = "React hooks are great because they allow us to manage state in functional components, therefore resulting in cleaner code and better architecture."
    # Mock embeddings matching the text length (1 sentence)
    user_embs = [[0.1] * 384]
    
    res = analyze_explanation(text, user_embs, concepts, concept_embs, topic="React")
    print(f"Score: {res['score']}")
    print(f"Depth Score: {res['depth_score']}")
    print(f"Depth Breakdown: {res['depth_breakdown']}")
    assert res['depth_score'] > 0.4

def test_contradiction():
    print("\n--- Testing Contradiction Detection ---")
    # Mentioning Hooks but also Class Lifecycles (opposite in graph)
    text = "I am using React Hooks but I also prefer Class Components Lifecycle for state management."
    user_embs = [[0.1] * 384]
    
    res = analyze_explanation(text, user_embs, concepts, concept_embs, topic="React")
    print(f"Contradictions: {res['contradictions']}")
    assert len(res['contradictions']) > 0

def test_reasoning_matrix():
    print("\n--- Testing Reasoning Matrix ---")
    text = "Hooks."
    user_embs = [[0.1] * 384]
    res = analyze_explanation(text, user_embs, concepts, concept_embs, topic="React")
    
    reasoning = generate_reasoning(
        "React", res['understood'], res['weak'], res['missing'],
        res['score'], res['depth_score'], res['contradictions'], res['vocab_data']
    )
    print(f"Reasoning: {reasoning}")
    assert "Surface-Level" in reasoning or "Emerging" in reasoning

if __name__ == "__main__":
    try:
        test_depth()
        test_contradiction()
        test_reasoning_matrix()
        print("\n[OK] All Neural Engine tests passed!")
    except Exception as e:
        print(f"\n[ERROR] Test failed: {e}")

