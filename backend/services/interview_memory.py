# backend/services/interview_memory.py
from datetime import datetime, timedelta
import logging
from services.db_manager import db_manager

logger = logging.getLogger(__name__)

class InterviewMemory:
    """
    Hybrid Persistent storage for active interview sessions.
    Uses RAM for fast access and MongoDB/SQLite for durability.
    """
    def __init__(self, expiry_minutes=60):
        self.cache = {}
        self.expiry_minutes = expiry_minutes

    async def get_session(self, session_id):
        """Retrieve session from cache or DB."""
        # 1. Check Cache
        if session_id in self.cache:
            self.cache[session_id]['last_activity'] = datetime.utcnow()
            return self.cache[session_id]

        # 2. Check DB
        try:
            doc = await db_manager.sessions.find_one({"session_id": session_id})
            if doc:
                # Convert list back to set for logic
                doc['covered_concepts'] = set(doc.get('covered_concepts', []))
                doc['weak_areas'] = set(doc.get('weak_areas', []))
                
                # Parse datetime
                if isinstance(doc.get('last_activity'), str):
                    doc['last_activity'] = datetime.fromisoformat(doc['last_activity'])
                else:
                    doc['last_activity'] = datetime.utcnow()
                
                self.cache[session_id] = doc
                return doc

        except Exception as e:
            logger.error(f"Error loading session from DB: {e}")

        # 3. Initialize New Session
        new_session = {
            "session_id": session_id,
            "covered_concepts": set(),
            "weak_areas": set(),
            "history": [],
            "mastery_score": 0,
            "last_activity": datetime.utcnow()
        }
        self.cache[session_id] = new_session
        return new_session

    async def update_session(self, session_id, understood, weak, score, history_msg=None, structural_score=0.0):
        """Update session state in cache and persist to DB."""
        session = await self.get_session(session_id)
        
        session['covered_concepts'].update(understood)
        session['weak_areas'].update(weak)
        session['mastery_score'] = (session['mastery_score'] + score) / 2
        session['structural_score'] = structural_score
        session['last_activity'] = datetime.utcnow()

        
        if history_msg:
            session['history'].append(history_msg)

        # Persist to DB (Convert sets and datetimes to serializable formats)
        try:
            persist_doc = session.copy()
            persist_doc['covered_concepts'] = list(session['covered_concepts'])
            persist_doc['weak_areas'] = list(session['weak_areas'])
            persist_doc['last_activity'] = session['last_activity'].isoformat()
            
            await db_manager.sessions.update_one(
                {"session_id": session_id},
                {"$set": persist_doc},
                upsert=True
            )

        except Exception as e:
            logger.error(f"Error persisting session: {e}")

# Singleton
interview_memory = InterviewMemory()
