# backend/services/agent_orchestrator.py
import logging
from services.gap_detector import analyze_explanation

logger = logging.getLogger(__name__)

class AgentOrchestrator:
    """
    Orchestrates multiple specialized AI agents for deep technical evaluation.
    """
    def __init__(self):
        self.agents = {
            "Neural Critic": {
                "persona": "Strict, looks for contradictions and terminology errors.",
                "focus": "accuracy"
            },
            "Cognitive Coach": {
                "persona": "Constructive, identifies missing prerequisites and logic gaps.",
                "focus": "coverage"
            },
            "Master Evaluator": {
                "persona": "High-level, evaluates architectural depth and senior-level trade-offs.",
                "focus": "depth"
            }
        }

    async def get_multi_agent_feedback(self, text, embs, concepts, concept_embs, topic):
        """
        Runs specialized analysis for each agent.
        """
        # Run base analysis once
        base_results = analyze_explanation(text, embs, concepts, concept_embs, topic)
        
        agent_feedback = {}
        
        # 1. Neural Critic Feedback
        contradictions = base_results.get("contradictions", [])
        if contradictions:
            agent_feedback["Neural Critic"] = f"CRITICAL: {contradictions[0]}"
        else:
            agent_feedback["Neural Critic"] = "Logic is internally consistent. No contradictions detected."

        # 2. Cognitive Coach Feedback
        missing = base_results.get("missing", [])
        if missing:
            agent_feedback["Cognitive Coach"] = f"You are missing foundational links to '{missing[0]}'. Build on that."
        else:
            agent_feedback["Cognitive Coach"] = "Conceptual coverage is solid. You've mapped the core mental model."

        # 3. Master Evaluator Feedback
        depth = base_results.get("depth_score", 0)
        if depth > 0.7:
            agent_feedback["Master Evaluator"] = "Superior architectural insight. You understand the 'why' behind the design."
        elif depth > 0.4:
            agent_feedback["Master Evaluator"] = "Competent understanding, but needs more trade-off analysis."
        else:
            agent_feedback["Master Evaluator"] = "Technical depth is shallow. Focus on the underlying mechanisms."

        return agent_feedback

agent_orchestrator = AgentOrchestrator()
