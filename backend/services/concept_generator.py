# backend/services/concept_generator.py

import yake
import logging

logger = logging.getLogger(__name__)

def generate_concepts(topic, text=""):
    """
    Dynamically generates pedagogical concepts using YAKE keyword extraction
    and hybrid domain-agnostic concepts.
    """
    try:
        # 1. Dynamic Keyphrase Extraction
        kw_extractor = yake.KeywordExtractor(lan="en", n=2, dedupLim=0.9, top=10, features=None)
        keywords = kw_extractor.extract_keywords(text if text else topic)
        
        extracted = []
        for kw, score in keywords:
            # YAKE scores lower for better keywords
            extracted.append({
                "name": kw,
                "description": f"The technical implementation and context of {kw} within {topic}.",
                "weight": 2,
                "keywords": [kw]
            })

        # 2. Hybrid Domain Concepts
        t = topic.replace("_", " ").title()
        generic = [
            {
                "name": f"{t} core definition", 
                "description": f"Define {t} and its primary purpose.", 
                "weight": 3,
                "keywords": [t.lower(), "definition", "purpose", "concept"]
            },
            {
                "name": f"{t} working mechanism", 
                "description": f"Internal logic and workflow of {t}.", 
                "weight": 3,
                "keywords": ["logic", "workflow", "process", "mechanism", "how"]
            },
            {
                "name": f"{t} edge cases", 
                "description": f"Boundary conditions and constraints of {t}.", 
                "weight": 2,
                "keywords": ["edge cases", "constraints", "limitations", "boundary"]
            },
            {
                "name": f"{t} complexity", 
                "description": f"Time and space complexity of {t}.", 
                "weight": 2,
                "keywords": ["complexity", "big o", "efficiency", "performance"]
            }
        ]

        # Combine and deduplicate
        all_concepts = generic + extracted
        unique_concepts = []
        seen = set()
        for c in all_concepts:
            if c["name"].lower() not in seen:
                unique_concepts.append(c)
                seen.add(c["name"].lower())

        return unique_concepts[:10] # Limit to 10 for focused analysis
        
    except Exception as e:
        logger.error(f"Dynamic Concept Generation Error: {e}")
        # Fallback to simple list if YAKE fails
        return [
            {"name": "Definition", "description": f"Core concept of {topic}", "weight": 2, "keywords": [topic]},
            {"name": "Implementation", "description": f"How {topic} is used", "weight": 2, "keywords": ["implementation"]}
        ]
