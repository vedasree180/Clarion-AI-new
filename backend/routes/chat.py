# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException, Depends, Request
from services.auth import get_current_user
import os
import json
import logging
from typing import List, Dict

logger = logging.getLogger(__name__)
router = APIRouter()

from services.followup_engine import generate_followup
from services.interview_memory import interview_memory
from services.local_model import local_model

@router.post("/chat")
async def chat(payload: Dict):
    """
    Continuous conversation loop for Voice Tutor.
    Prioritizes: Local SLM (Ollama) -> Neural Pipeline Fallback.
    """
    messages = payload.get("messages", [])
    session_id = payload.get("session_id", "default")
    
    if not messages:
        raise HTTPException(status_code=400, detail="No message history provided")

    # Get or Initialize Session Memory (Async)
    session = await interview_memory.get_session(session_id)

    try:
        # 1. Extract context
        system_msg = next((m["content"] for m in messages if m["role"] == "system"), "")
        topic = "General"
        if "topic is:" in system_msg:
            topic = system_msg.split("topic is:")[1].split(".")[0].strip()
        
        user_messages = [m["content"] for m in messages if m["role"] == "user"]
        last_user_msg = user_messages[-1] if user_messages else ""

        # 2. Level 1: Local SLM (Ollama - Phi3/Llama3)
        if local_model.is_available():
            reply = local_model.generate_response(system_msg, messages)
            if reply:
                await interview_memory.update_session(session_id, [], [], 0, history_msg={"role": "assistant", "content": reply})
                return {"reply": reply, "engine": "local_slm"}

        # 3. Level 2: Local Neural Pipeline Fallback (Always works)
        reply = generate_followup(
            topic, 
            list(session.get('covered_concepts', [])), 
            list(session.get('weak_areas', [])), 
            [topic],
            session_id=session_id,
            structural_score=session.get('structural_score', 0.0)
        )

        
        if not last_user_msg:
             reply = f"Hello! I am your Senior Technical Interviewer. Let's begin the technical assessment on '{topic}'. Can you explain how it works?"
        
        # Persist turn
        await interview_memory.update_session(session_id, [], [], 0, history_msg={"role": "assistant", "content": reply})
        
        return {"reply": reply, "engine": "neural_pipeline"}
    except Exception as e:
        logger.error(f"Chat Error: {e}")
        raise HTTPException(status_code=500, detail="Synthesis failed.")


from starlette.responses import StreamingResponse
import asyncio

@router.post("/stream-chat")
async def stream_chat(request: Request):
    """
    Real-time streaming chat endpoint (SSE).
    """
    body = await request.json()
    session_id = body.get("session_id", "default")
    messages = body.get("messages", [])
    
    session = await interview_memory.get_session(session_id)
    system_msg = next((m["content"] for m in messages if m["role"] == "system"), "")
    topic = "General"
    if "topic is:" in system_msg:
        topic = system_msg.split("topic is:")[1].split(".")[0].strip()

    async def event_generator():
        # 1. Local SLM Streaming
        if local_model.is_available():
            full_reply = ""
            for token in local_model.stream_response(system_msg, messages):
                full_reply += token
                yield f"data: {json.dumps({'token': token, 'engine': 'local_slm'})}\n\n"
                await asyncio.sleep(0.01) # Small throttle
            
            # Final Chunk: Trigger background analysis for Live Agents
            from services.agent_orchestrator import agent_orchestrator
            from services.embedding import get_embeddings
            
            # Simple heuristic analysis for live thoughts
            user_msg = messages[-1]["content"] if messages else ""
            try:
                embs = get_embeddings([user_msg])
                # We reuse the topic-detection logic or pass topic from body
                thoughts = await agent_orchestrator.get_multi_agent_feedback(user_msg, embs, [], {}, topic)
                yield f"data: {json.dumps({'type': 'metadata', 'agent_thoughts': thoughts})}\n\n"
            except: pass

            await interview_memory.update_session(session_id, [], [], 0, history_msg={"role": "assistant", "content": full_reply})
            return


        # 2. Neural Pipeline (Simulated Streaming)
        reply = generate_followup(
            topic, 
            list(session.get('covered_concepts', [])), 
            list(session.get('weak_areas', [])), 
            [topic],
            session_id=session_id,
            structural_score=session.get('structural_score', 0.0)
        )
        
        words = reply.split(" ")
        for word in words:
            yield f"data: {json.dumps({'token': word + ' ', 'engine': 'neural_pipeline'})}\n\n"
            await asyncio.sleep(0.05)
            
        await interview_memory.update_session(session_id, [], [], 0, history_msg={"role": "assistant", "content": reply})

    return StreamingResponse(event_generator(), media_type="text/event-stream")




