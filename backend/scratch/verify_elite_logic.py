# backend/scratch/verify_elite_logic.py
import asyncio
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.followup_engine import generate_followup

async def test_elite_logic():
    print("Testing Adaptive Difficulty: ELITE TIER")
    
    topic = "React"
    understood = ["Reconciliation", "Fiber Architecture", "Concurrent Mode"]
    weak = []
    missing = []
    structural_score = 0.95
    
    print(f"Scenario: Mastery={structural_score}, Understood={understood}")
    
    # Run multiple times to see variety of pressure prompts
    for i in range(3):
        reply = generate_followup(topic, understood, weak, missing, structural_score=structural_score)
        print(f"  Follow-up {i+1}: {reply}")

    print("\nTesting Adaptive Difficulty: FOUNDATIONAL TIER")
    topic = "System Design"
    understood = []
    weak = ["Load Balancing"]
    missing = ["CAP Theorem", "Sharding"]
    structural_score = 0.2
    
    reply = generate_followup(topic, understood, weak, missing, structural_score=structural_score)
    print(f"  Follow-up: {reply}")

if __name__ == "__main__":
    asyncio.run(test_elite_logic())
