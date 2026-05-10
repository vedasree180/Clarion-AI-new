# backend/services/followup_engine.py
import random
from services.concept_graph import concept_graph_service

def generate_followup(topic, understood, weak, missing, session_id=None, structural_score=0.0):
    """
    Adaptive Difficulty Controller: Adjusts technical rigor based on mastery and structural logic.
    """
    topic_map = {"react": "React", "dsa": "DSA", "system design": "System Design"}
    mapped_topic = topic_map.get(topic.lower(), topic)
    
    # 1. Determine Mastery Tier
    coverage = len(understood) / max(len(understood) + len(weak) + len(missing), 1)
    
    # Mastery Level: 0.0 - 1.0
    mastery = (coverage * 0.6) + (structural_score * 0.4)
    
    # 2. Tier-Based Selection
    
    # --- ELITE TIER (Mastery > 0.8) ---
    # Focus: Pressure testing and architectural edge cases.
    if mastery > 0.8:
        # Pressure Test: Challenge a previous 'understood' concept
        if understood:
            target = understood[0]
            pressure_prompts = [
                f"You seem confident in '{target}', but how does it fail under a 10x load increase? Specifically, where is the bottleneck in your logic?",
                f"If I were to argue that '{target}' is actually an anti-pattern for this '{topic}' scenario, how would you defend your choice technically?",
                f"How does your implementation of '{target}' handle a 'Cold Start' problem in a serverless environment?"
            ]
            return random.choice(pressure_prompts)

        elite_scenarios = {
            "React": [
                "How would you design a custom reconciliation strategy for a high-frequency trading dashboard?",
                "How do you handle cross-application state consistency in a Module Federation setup without bottlenecks?"
            ],

            "DSA": [
                "If we parallelize this algorithm, what are the lock-contention risks and how would a lock-free data structure improve throughput?",
                "How does cache-locality impact this algorithm's performance when the dataset exceeds the L3 cache size?"
            ],
            "System Design": [
                "Under a massive DDoS attack, how does your throttling layer distinguish between a 'Flash Crowd' and malicious traffic in real-time?",
                "If we move from Strong Consistency to Eventual Consistency, what are the specific 'business-logic' trade-offs for the user experience?"
            ]
        }
        return random.choice(elite_scenarios.get(mapped_topic, [
            f"You've demonstrated superior mastery of {topic}. Let's discuss the absolute limits: what architectural constraint would break this design first?"
        ]))

    # --- ADVANCED TIER (Mastery > 0.5) ---
    # Focus: Internal mechanisms, optimization, and scenario-based probing.
    if mastery > 0.5:
        if weak:
            target = weak[0]
            info = concept_graph_service.get_related_info(mapped_topic, target)
            advanced = info.get("advanced", [])
            if advanced:
                return f"You've got the basics of '{target}', but how does it impact '{advanced[0]}' during a high-load scenario?"
        
        scenarios = {
            "React": [
                "How would you optimize this component if it's part of a list with 10,000+ items? Talk about virtualization and memoization.",
                "What's the 'under-the-hood' difference between how this works in React 18 Concurrent Mode vs legacy mode?"
            ],
            "DSA": [
                "Compare the space-time trade-off here if we use a Hash Map vs a Balanced BST. When is one strictly better?",
                "How does the time complexity change if we need to support concurrent reads and writes?"
            ]
        }
        return random.choice(scenarios.get(mapped_topic, [
            f"Good technical depth. How would you handle an unexpected network partition in this '{topic}' implementation?"
        ]))

    # --- FOUNDATIONAL TIER (Mastery < 0.5) ---
    # Focus: Guidance, prerequisites, and stabilizing the mental model.
    if missing:
        target = missing[0]
        info = concept_graph_service.get_related_info(mapped_topic, target)
        if info:
            requires = info.get("requires", [])
            if requires:
                return f"Let's step back to the fundamentals. How does '{requires[0]}' provide the foundation for '{target}'? Understanding this link is crucial."
        return f"I noticed '{target}' was missing from your explanation. Can you walk me through the basic concept of it?"

    # Fallback for balanced/starting sessions
    return f"Your baseline for '{topic}' is forming well. Can you explain the internal mechanism that makes this approach 'reliable' in a production environment?"

