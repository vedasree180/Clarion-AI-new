from fastapi import APIRouter, HTTPException, Depends, Request
from models.schema import AnalyzeRequest
from pydantic import BaseModel
import numpy as np
from services.gap_detector import analyze_explanation
from services.scoring import calculate_score
from services.embedding import get_embedding, get_embeddings
from services.auth import get_current_user
from services.topic_detector import detect_topic, detect_domain
from services.concept_generator import generate_concepts

# Original Feature Services
from services.agents import generate_agents
from services.probes import generate_probes
from services.attribution import calculate_attribution
from services.concept_graph import get_related_concepts
from services.interview import generate_interview_verdict
from services.personalization import build_user_mastery, get_personalized_focus
from services.reasoning import generate_reasoning
from services.agent_orchestrator import agent_orchestrator


# NEW: Product-grade services
from services.system_health import detect_insufficient_input, get_domain_info
from services.cache import get_cached_result, cache_result, embedding_cache

from datetime import datetime
import json
import nltk
from typing import Optional
from bson import ObjectId
import logging
import asyncio

logger = logging.getLogger(__name__)

try:
    nltk.data.find('tokenizers/punkt')
    nltk.data.find('tokenizers/punkt_tab')
except LookupError:
    nltk.download('punkt')
    nltk.download('punkt_tab')

router = APIRouter()

import os
try:
    concepts_path = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "data", "concepts.json"))
    with open(concepts_path) as f:
        concepts_db = json.load(f)
except Exception as e:
    logger.error(f"Failed to load concepts.json: {e}")
    concepts_db = {}

class LiveRequest(BaseModel):
    text: str

concept_embeddings_cache = {}


def get_concept_embeddings(topic: str, concepts_list: list = None):
    # Check fast in-memory cache first
    cached = embedding_cache.get(f"concept_emb::{topic}")
    if cached:
        return cached

    if topic not in concept_embeddings_cache:
        source_concepts = concepts_list
        if not source_concepts:
            if topic in concepts_db:
                source_concepts = concepts_db[topic]["concepts"]
            else:
                return None
        embeddings = {}
        for concept in source_concepts:
            embeddings[concept["name"]] = get_embedding(concept["description"])
        concept_embeddings_cache[topic] = embeddings
        embedding_cache.set(f"concept_emb::{topic}", embeddings)

    return concept_embeddings_cache[topic]


@router.get("/topics")
async def get_topics(request: Request):
    topics = list(concepts_db.keys())
    try:
        dynamic_topics = await request.app.mongodb.topics.find().to_list(length=100)
        topics.extend([t["topic"] for t in dynamic_topics])
    except Exception as e:
        logger.error(f"Error fetching dynamic topics: {e}")
    return sorted(list(set(topics)))


def generate_rewrite_prompt(weak_items, missing_items):
    lines = ["Rewrite your explanation including:"]
    for item in weak_items:
        lines.append(f"- Clarify {item.replace('_', ' ')}")
    for item in missing_items:
        lines.append(f"- Include {item.replace('_', ' ')}")
    return "\n".join(lines)


def compute_delta(prev_attempt, curr_payload):
    prev_understood = set(prev_attempt.get("understood", []))
    curr_understood = set(curr_payload.get("concepts", {}).get("understood", []))
    return {
        "score_change": round(curr_payload["score"] - prev_attempt.get("score", 0), 2),
        "newly_understood": sorted(list(curr_understood - prev_understood)),
        "still_missing": curr_payload.get("concepts", {}).get("missing", [])
    }


def calibrate_confidence(score: float, understood: list, weak: list, missing: list, raw_confidence: str) -> dict:
    total = len(understood) + len(weak) + len(missing)
    coverage_ratio = len(understood) / max(total, 1)
    numeric = round((score / 100 * 0.6) + (coverage_ratio * 0.4), 2)
    if numeric >= 0.75:
        level = "HIGH"
    elif numeric >= 0.45:
        level = "MEDIUM"
    else:
        level = "LOW"
    return {
        "score": numeric,
        "level": level,
        "label": raw_confidence,
        "coverage_ratio": round(coverage_ratio, 2)
    }


@router.post("")
async def analyze(
    payload: AnalyzeRequest,
    request: Request,
    current_user: Optional[str] = Depends(get_current_user)
):
    try:
        logger.info(f"--- 🧠 NEURAL ANALYSIS START: Topic='{payload.topic}' User='{current_user}' ---")
        raw_topic = payload.topic.lower().strip() if payload.topic else None
        text = payload.explanation
        baseline_attempt_id = payload.baseline_attempt_id

        # ── FEATURE 5: Failure Detection ─────────────────────────────────────
        failure = detect_insufficient_input(text)
        if failure:
            raise HTTPException(status_code=422, detail=failure)

        # 1. Topic Detection
        topic = raw_topic if raw_topic else detect_topic(text)

        # ── Domain Detection ────────────────────────────────────────────────
        sentences = nltk.sent_tokenize(text)
        user_embs = get_embeddings(sentences)
        text_emb = np.mean(user_embs, axis=0) if len(user_embs) > 0 else np.zeros(384)
        domain = detect_domain(text, text_emb)
        domain_info = get_domain_info(topic) # Existing service
        domain_info["domain"] = domain # Update with detected domain
        domain_info["domain_label"] = domain.title()

        # ── FEATURE 3: Check result cache (skip for logged-in delta requests) ─
        response_data = None
        if not baseline_attempt_id:
            cached = get_cached_result(topic, text)
            if cached:
                logger.info(f"Using cached result for topic: {topic}")
                response_data = cached
                response_data["from_cache"] = True
                # Ensure we have the latest domain info
                response_data["domain"] = domain_info

        if not response_data:
            # 2. Concept Fetching
            concepts = None
            if topic in concepts_db:
                concepts = concepts_db[topic]["concepts"]
            else:
                db = request.app.mongodb
                existing = await db.topics.find_one({"topic": topic})
                if existing:
                    concepts = existing["concepts"]
                    await db.topics.update_one({"topic": topic}, {"$inc": {"usage_count": 1}})
                if not concepts:
                    concepts = generate_concepts(topic)
                    await request.app.mongodb.topics.insert_one({
                        "topic": topic,
                        "concepts": concepts,
                        "created_at": datetime.utcnow().isoformat(),
                        "usage_count": 1
                    })

            # ── NEW: Contextual Transcript Cleaning ──────────────────────────────
            from services.context_cleaner import clean_transcript
            text = clean_transcript(text, topic, concepts)
            logger.info(f"Cleaned Transcript for topic '{topic}': {text[:100]}...")

            # 3. Embeddings
            sentences = nltk.sent_tokenize(text)
            user_embs = get_embeddings(sentences)
            concept_embs = get_concept_embeddings(topic, concepts)
            if not concept_embs:
                raise HTTPException(status_code=400, detail=f"Topic '{topic}' initialization failed")

            # ── FEATURE 3: Async parallel execution of independent analyses ───────
            def _core_analysis():
                is_dynamic = topic not in concepts_db
                return analyze_explanation(text, user_embs, concepts, concept_embs, is_dynamic=is_dynamic)

            # Run core analysis (sync in thread pool for non-blocking)
            loop = asyncio.get_event_loop()
            analysis = await loop.run_in_executor(None, lambda: analyze_explanation(text, user_embs, concepts, concept_embs, topic=topic, is_dynamic=is_dynamic))

            score = analysis["score"]
            understood = analysis["understood"]
            weak = analysis["weak"]
            missing = analysis["missing"]
            depth_score = analysis["depth_score"]
            contradictions = analysis["contradictions"]

            # Run independent analyses concurrently
            def _attribution():
                return calculate_attribution(analysis["results"], text)

            def _agents():
                return generate_agents(understood, weak, missing, score, topic)

            def _probes():
                return generate_probes(understood, weak, missing, topic, concepts)

            def _graph():
                return get_related_concepts(topic, missing, understood)

            def _interview():
                return generate_interview_verdict(score, understood, weak, missing, topic)

            attribution, agents, probes, graph_data, interview = await asyncio.gather(
                loop.run_in_executor(None, _attribution),
                loop.run_in_executor(None, _agents),
                loop.run_in_executor(None, _probes),
                loop.run_in_executor(None, _graph),
                loop.run_in_executor(None, _interview),
            )

            # 9. Calibrated Confidence
            calibrated_confidence = calibrate_confidence(score, understood, weak, missing, analysis.get("confidence", "Medium"))

            # 11. Reasoning Layer (Updated with Matrix Logic)
            reasoning = generate_reasoning(
                topic, understood, weak, missing,
                score, depth_score, contradictions, analysis.get("vocab_data", {})
            )

            # ── FEATURE 4: Explainability Contribution Breakdown ──────────────────
            total_concepts = len(understood) + len(weak) + len(missing)
            safe_attr = attribution or {}
            contribution = {
                "semantic": safe_attr.get("concept", 0),
                "logic": safe_attr.get("logic", 0),
                "completeness": safe_attr.get("completeness", 0),
                "missing_penalty": -round(len(missing) / max(total_concepts, 1) * 15, 1),
                "depth_bonus": round(depth_score * 10, 1),
                "contradiction_penalty": -round(len(contradictions) * 15, 1),
                "breakdown_labels": {
                    "semantic": f"Semantic concept match (+{safe_attr.get('concept', 0)} pts)",
                    "logic": f"Logical coherence (+{safe_attr.get('logic', 0)} pts)",
                    "completeness": f"Topic completeness (+{safe_attr.get('completeness', 0)} pts)",
                    "depth": f"Technical depth bonus (+{round(depth_score * 10, 1)} pts)",
                    "contradiction": f"Contradiction penalty (-{round(len(contradictions) * 15, 1)} pts)"
                },
                "domain_detected": domain
            }

            # 12. Personalization
            personalization = None
            user_mastery = {}
            if current_user:
                try:
                    history_cursor = request.app.mongodb.attempts.find(
                        {"user_email": current_user}
                    ).sort("timestamp", -1).limit(20)
                    history = await history_cursor.to_list(length=20)
                    user_mastery = build_user_mastery(history)
                    personalization = get_personalized_focus(
                        topic, understood, weak, missing,
                        user_mastery, graph_data["next_learning_path"]
                    )
                except Exception as e:
                    logger.error(f"Personalization error: {e}")

            # 13. Update Interview Memory (NEW)
            if session_id := request.query_params.get("session_id"):
                from services.interview_memory import interview_memory
                await interview_memory.update_session(
                    session_id, 
                    understood, 
                    weak, 
                    score,
                    history_msg={"role": "user", "content": text},
                    structural_score=response_data.get("structural_score", 0.0)
                )


            word_count = len(text.split())

            response_data = {
                "topic": topic,
                "difficulty": concepts_db.get(topic, {}).get("difficulty", "medium"),
                "score": score,
                "summary": analysis["smart_summary"],
                "concepts": {"understood": understood, "weak": weak, "missing": missing},
                "confidence": calibrated_confidence["level"],
                "confidence_score": calibrated_confidence["score"],
                "coverage_ratio": calibrated_confidence["coverage_ratio"],
                "vocab_data": analysis["vocab_data"],
                "rewrite_prompt": generate_rewrite_prompt(weak, missing),
                # Feature 1: Agents
                "agents": agents,
                # Feature 2: Probes
                "probes": probes,
                # Feature 3: Attribution
                "attribution": attribution,
                # Feature 4: Contribution breakdown (NEW)
                "contribution": contribution,
                # Feature 4: Graph
                "related_concepts": graph_data["related_concepts"],
                "missing_prerequisites": graph_data["missing_prerequisites"],
                "next_learning_path": graph_data["next_learning_path"],
                # Feature 5: Interview
                "interview": interview,
                # Feature 6: Reasoning
                "reasoning": reasoning,
                # Feature 7: Personalization
                "personalization": personalization,
                # NEW: Domain info
                "domain": domain_info,
                # Metadata
                "depth_score": depth_score,
                "depth_breakdown": analysis["depth_breakdown"],
                "contradictions": contradictions,
                "word_count": word_count,
                "strengths": len(understood),
                "gaps": len(missing),
                "timestamp": datetime.utcnow().isoformat(),
                "from_cache": False,
                "explanation": text,
                # Phase 5: Multi-Agent Intelligence
                "agent_thoughts": await agent_orchestrator.get_multi_agent_feedback(
                    text, user_embs, concepts, concept_embs, topic
                )
            }

            # Phase 5: Knowledge Auto-Expansion (Background)
            from services.concept_learner import concept_learner
            asyncio.create_task(concept_learner.discover_concepts(topic, text, concepts))




            # ── FEATURE 3: Cache the result ────────────────────────────────────────
            if not baseline_attempt_id:
                cache_result(topic, text, response_data)

        # Persist
        inserted_id = None
        if current_user:
            attempt_data = {
                "user_email": current_user,
                "topic": topic,
                "explanation": text,
                "score": score,
                "confidence_score": calibrated_confidence["score"],
                "concepts_raw": analysis["results"],
                "concepts": response_data["concepts"],
                "understood": understood,
                "summary": response_data["summary"],
                "agents": agents,
                "probes": probes,
                "attribution": attribution,
                "contribution": contribution,
                "related_concepts": graph_data["related_concepts"],
                "missing_prerequisites": graph_data["missing_prerequisites"],
                "next_learning_path": graph_data["next_learning_path"],
                "interview": interview,
                "reasoning": reasoning,
                "personalization": personalization,
                "domain": domain_info,
                "word_count": word_count,
                "strengths": len(understood),
                "gaps": len(missing),
                "vocab_data": analysis["vocab_data"],
                "rewrite_prompt": response_data["rewrite_prompt"],
                "timestamp": response_data["timestamp"]
            }
            res = await request.app.mongodb.attempts.insert_one(attempt_data)
            inserted_id = str(res.inserted_id)
            
            # Compute gamification update (XP gain)
            try:
                from services.gamification import XP_PER_ANALYSIS, XP_SCORE_MULTIPLIER, compute_gamification
                xp_gained = XP_PER_ANALYSIS + int(score * XP_SCORE_MULTIPLIER)
                
                # Fetch user for freezes
                user_doc = await request.app.mongodb.users.find_one({"email": current_user})
                streak_freezes = user_doc.get("streak_freezes", 0) if user_doc else 0
                
                # Get all attempts for streak/badge check
                all_attempts = await request.app.mongodb.attempts.find(
                    {"user_email": current_user}
                ).sort("timestamp", 1).to_list(length=1000)
                
                gami = compute_gamification(all_attempts, streak_freezes)
                
                # If a freeze was used (today's gap was bridged), decrement it in DB
                last_date = (datetime.fromisoformat(all_attempts[-1]["timestamp"].replace("Z", "+00:00")).date() 
                            if all_attempts else date.today())
                yesterday = date.today() - timedelta(days=1)
                if last_date < yesterday and streak_freezes > 0:
                    # Logic: if last_date was before yesterday, and compute_streak returned a streak > 0,
                    # it means a freeze was consumed to bridge the gap.
                    await request.app.mongodb.users.update_one(
                        {"email": current_user},
                        {"$inc": {"streak_freezes": -1}}
                    )
                    gami["freezes_available"] -= 1

                response_data["xp_gained"] = xp_gained
                response_data["level"] = gami["level"]
                response_data["total_xp"] = gami["xp"]
                response_data["current_streak"] = gami["current_streak"]
                response_data["freezes_available"] = gami["freezes_available"]
                response_data["new_badges"] = gami["badges"][-1:] if gami["badges"] else []
            except Exception as gami_err:
                logger.error(f"Gamification error: {gami_err}")

            if baseline_attempt_id:
                try:
                    baseline = await request.app.mongodb.attempts.find_one(
                        {"_id": ObjectId(baseline_attempt_id)}
                    )
                    if baseline:
                        response_data["delta"] = compute_delta(baseline, response_data)
                except Exception as e:
                    logger.error(f"Delta calculation error: {e}")

        response_data["attempt_id"] = inserted_id or "demo"
        return response_data
    except Exception as e:
        logger.error(f"Global Analysis Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/live")
async def live_feedback(payload: LiveRequest):
    """
    Lightweight real-time analysis for live suggestions.
    """
    try:
        text = payload.text
        if not text:
            return {"live_score": 0, "suggestions": []}

        # 1. Dynamic Score (Depth-based)
        words = text.split()
        live_score = min(len(words) * 1.5, 100)

        # 2. Heuristic Suggestions
        suggestions = []
        text_lower = text.lower()
        
        if len(words) < 20:
            suggestions.append("Keep going! Add more detail.")
        if "complexity" not in text_lower and "time" not in text_lower:
            suggestions.append("Mention Time Complexity (Big O)")
        if "edge" not in text_lower and "case" not in text_lower:
            suggestions.append("Consider Edge Cases")
        if "example" not in text_lower and "instance" not in text_lower:
            suggestions.append("Provide a real-world example")
        if "logic" not in text_lower and "flow" not in text_lower:
            suggestions.append("Explain the operational logic")

        return {
            "live_score": int(live_score),
            "suggestions": suggestions[:3] # Limit to top 3 for UI clarity
        }
    except Exception as e:
        logger.error(f"Live Feedback Error: {e}")
        return {"live_score": 0, "suggestions": []}
