# backend/scratch/persistence_stress_test.py
import asyncio
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.interview_memory import interview_memory
from services.db_manager import db_manager

async def run_stress_test():
    print("Initializing Persistence Stress Test...")
    
    # Mock environment
    os.environ["MONGO_URL"] = "mongodb://localhost:27017" # Local fallback
    await db_manager.connect(os.environ.get("MONGO_URL"), "mongodb://localhost:27017")
    
    session_ids = [f"test_session_{i}" for i in range(5)]
    
    print(f"Simulating {len(session_ids)} concurrent interviews...")
    
    # 1. Concurrent Updates
    tasks = []
    for sid in session_ids:
        tasks.append(interview_memory.update_session(
            sid, 
            {"Concept_A", "Concept_B"}, 
            {"Weak_C"}, 
            85, 
            history_msg={"role": "assistant", "content": "Test Reply"},
            structural_score=0.9
        ))
    
    await asyncio.gather(*tasks)
    print("Initial updates persisted.")
    
    # 2. Simulate Server Restart (Clear cache)
    print("Simulating Server Restart (Clearing RAM Cache)...")
    interview_memory.cache = {}
    
    # 3. Verify Data Recovery
    print("Verifying Data Recovery from DB...")
    success_count = 0
    for sid in session_ids:
        recovered = await interview_memory.get_session(sid)
        if "Concept_A" in recovered["covered_concepts"] and recovered["structural_score"] == 0.9:
            print(f"  [PASS] {sid} recovered perfectly.")
            success_count += 1
        else:
            print(f"  [FAIL] {sid} data mismatch!")
    
    print(f"\nFinal Result: {success_count}/{len(session_ids)} sessions recovered.")
    
    if success_count == len(session_ids):
        print("PERSISTENCE ENGINE IS STABLE.")
    else:
        print("PERSISTENCE FAILURE DETECTED.")


if __name__ == "__main__":
    asyncio.run(run_stress_test())
