import re
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)

def clean_transcript(text: str, topic: str, concepts: List[Dict]) -> str:
    """
    Cleans up a speech-to-text transcript based on the current topic and concepts.
    Uses basic fuzzy matching to correct misheard technical terms.
    """
    if not text or not topic:
        return text

    cleaned_text = text
    
    # 1. Topic-based correction
    # Example: "quantum entanglement" misheard as "quantum entangle meant"
    topic_words = topic.lower().split()
    if len(topic_words) > 1:
        topic_phrase = " ".join(topic_words)
        # Look for the topic phrase with slight variations (e.g., spaces/hyphens)
        pattern = re.compile(re.escape(topic_phrase).replace(r"\ ", r"[\s\-]*"), re.IGNORECASE)
        cleaned_text = pattern.sub(topic, cleaned_text)

    # 2. Concept-based correction
    # We look for concept names that might have been split or slightly misspelled
    if concepts:
        for concept in concepts:
            concept_name = concept.get("name", "").lower()
            if not concept_name or len(concept_name) < 4:
                continue
                
            # Create a flexible pattern for the concept name
            # (e.g. "back propagation" -> "backpropagation")
            flexible_name = re.escape(concept_name).replace(r"\ ", r"[\s\-]*")
            pattern = re.compile(rf"\b{flexible_name}\b", re.IGNORECASE)
            
            # Only replace if it actually changes something (e.g. removes a space)
            # to avoid infinite loops or weird double-replacements
            cleaned_text = pattern.sub(concept["name"], cleaned_text)

    return cleaned_text
