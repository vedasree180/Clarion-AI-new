# backend/services/probes.py
# Adaptive Question Generator: generates targeted follow-up questions

def generate_probes(understood: list, weak: list, missing: list, topic: str, concepts: list) -> list:
    """
    Generates adaptive follow-up questions (probes) based on the user's performance level.
    - If missing concepts: generate basic comprehension questions
    - If weak concepts: generate deeper understanding questions  
    - If mostly understood: generate advanced application questions
    """
    topic_label = topic.replace("_", " ").title()
    probes = []

    # Build a concept description map for richer questions
    concept_map = {c["name"]: c.get("description", "") for c in concepts}

    # --- Questions for MISSING concepts (basic level) ---
    for concept_name in missing[:3]:
        desc = concept_map.get(concept_name, "")
        label = concept_name.replace("_", " ").title()
        if desc:
            # Generate a simple "what/why" question from the description
            short_desc = desc.split(".")[0]  # first sentence
            probe = f"Can you explain what '{label}' means and why it matters in the context of {topic_label}?"
        else:
            probe = f"How would you define '{label}' and what role does it play in {topic_label}?"
        probes.append({"level": "basic", "concept": concept_name, "question": probe})

    # --- Questions for WEAK concepts (intermediate level) ---
    for concept_name in weak[:2]:
        desc = concept_map.get(concept_name, "")
        label = concept_name.replace("_", " ").title()
        if "mechanism" in concept_name or "working" in concept_name:
            probe = f"Walk me through the step-by-step internal mechanism of {topic_label} — specifically focusing on '{label}'."
        elif "application" in concept_name or "example" in concept_name:
            probe = f"Give a concrete real-world example where '{label}' of {topic_label} becomes critical to system behavior."
        elif "advantage" in concept_name or "tradeoff" in concept_name:
            probe = f"What are the trade-offs of {topic_label}? When would you NOT use it and why?"
        else:
            probe = f"Your explanation of '{label}' needs more depth — can you describe it with a specific scenario or analogy?"
        probes.append({"level": "intermediate", "concept": concept_name, "question": probe})

    # --- Questions for UNDERSTOOD concepts (advanced level) ---
    if len(understood) >= 2 and not missing:
        understood_labels = [u.replace("_", " ") for u in understood[:2]]
        probe = (
            f"You explained {understood_labels[0]} and {understood_labels[1]} well. "
            f"How do these two concepts interact with each other during the execution of {topic_label}?"
        )
        probes.append({"level": "advanced", "concept": "synthesis", "question": probe})

    # If nothing was understood at all — give a starter
    if not probes:
        probes.append({
            "level": "basic",
            "concept": "introduction",
            "question": f"Start from scratch: In one sentence, what is {topic_label} and what problem does it solve?"
        })

    # Always add a meta-cognitive probe if performance is below 70%
    total = len(understood) + len(weak) + len(missing)
    coverage = len(understood) / max(total, 1)
    if coverage < 0.7:
        probes.append({
            "level": "reflection",
            "concept": "self-assessment",
            "question": f"Which aspect of {topic_label} do you feel LEAST confident about, and what would help you understand it better?"
        })

    return probes[:5]  # Return max 5 probes
