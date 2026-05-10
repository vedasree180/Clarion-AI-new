# backend/verify_dialogue_intelligence.py
import sys
import os

# Add current directory to path
sys.path.append(os.getcwd())

from services.followup_engine import generate_followup
from services.interview_memory import interview_memory

def test_memory_tracking():
    print("\n--- Testing Interview Memory Tracking ---")
    session_id = "test_user_123"
    
    # Simulate turn 1
    interview_memory.update_session(session_id, ["Hooks"], [], 80)
    session = interview_memory.get_session(session_id)
    print(f"Session after turn 1: {session['covered_concepts']}")
    assert "Hooks" in session['covered_concepts']

    # Simulate turn 2
    interview_memory.update_session(session_id, ["Virtual DOM"], ["State"], 70)
    session = interview_memory.get_session(session_id)
    print(f"Session after turn 2: {session['covered_concepts']}")
    assert "Virtual DOM" in session['covered_concepts']
    assert "State" in session['weak_areas']

def test_scenario_probing():
    print("\n--- Testing Scenario-Based Probing ---")
    session_id = "test_user_456"
    
    # Highly mastered user (understood 2+ concepts)
    understood = ["Hooks", "Virtual DOM"]
    followup = generate_followup("React", understood, [], [], session_id=session_id)
    print(f"Follow-up for high mastery: {followup}")
    assert "What if" in followup or "Consider" in followup

    # Struggling user (missing foundational concepts)
    followup = generate_followup("React", [], [], ["State"], session_id=session_id)
    print(f"Follow-up for missing concept: {followup}")
    assert "State" in followup

if __name__ == "__main__":
    try:
        test_memory_tracking()
        test_scenario_probing()
        print("\n[OK] Dialogue Intelligence tests passed!")
    except Exception as e:
        print(f"\n[ERROR] Test failed: {e}")
