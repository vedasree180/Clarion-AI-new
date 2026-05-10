# backend/services/concept_learner.py
import json
import os
import logging
from services.local_model import local_model

logger = logging.getLogger(__name__)

DISCOVERED_PATH = "data/discovered_concepts.json"

class ConceptLearner:
    """
    LLM-assisted knowledge expansion.
    Discovers new concepts from advanced user explanations.
    """
    def __init__(self):
        if not os.path.exists("data"):
            os.makedirs("data")
        if not os.path.exists(DISCOVERED_PATH):
            with open(DISCOVERED_PATH, "w") as f:
                json.dump({}, f)

    async def discover_concepts(self, topic, text, existing_concepts):
        """
        Analyze text for technical terms that aren't in existing_concepts.
        Uses Local SLM to suggest new concept definitions.
        """
        if not local_model.is_available():
            return []

        existing_names = [c["name"] for c in existing_concepts]
        
        system_prompt = f"You are a Knowledge Engineer. Identify exactly 2 technical concepts related to '{topic}' that are mentioned in the text but NOT in this list: {existing_names}. Return JSON: [{{'name': '...', 'definition': '...', 'keywords': [...]}}]"
        
        try:
            # We use non-streaming for discovery
            reply = local_model.generate_response(system_prompt, [{"role": "user", "content": text}])
            if reply:
                # Basic JSON extraction
                start = reply.find("[")
                end = reply.rfind("]") + 1
                if start != -1 and end != -1:
                    new_concepts = json.loads(reply[start:end])
                    self._save_discovered(topic, new_concepts)
                    return new_concepts
        except Exception as e:
            logger.error(f"Concept Discovery Error: {e}")
            
        return []

    def _save_discovered(self, topic, new_concepts):
        with open(DISCOVERED_PATH, "r") as f:
            data = json.load(f)
        
        if topic not in data:
            data[topic] = []
        
        for nc in new_concepts:
            if nc["name"] not in [c["name"] for c in data[topic]]:
                data[topic].append(nc)
                logger.info(f"✨ Discovered new concept: {nc['name']} in {topic}")
        
        with open(DISCOVERED_PATH, "w") as f:
            json.dump(data, f, indent=2)

concept_learner = ConceptLearner()
