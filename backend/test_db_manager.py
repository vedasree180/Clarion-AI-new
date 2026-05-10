import asyncio
import os
import sys

# Add current dir to path to import services
sys.path.append(os.getcwd())

from services.db_manager import db_manager

async def test_sqlite():
    # Force sqlite mode by providing invalid URLs
    await db_manager.connect("mongodb://invalid:27017", "mongodb://invalid:27017")
    print(f"DB Mode: {db_manager.mode}")
    
    users = db_manager.users
    await users.insert_one({"email": "test@example.com", "name": "Test User"})
    user = await users.find_one({"email": "test@example.com"})
    print(f"Found User: {user}")
    
    attempts = db_manager.attempts
    await attempts.insert_one({"user_email": "test@example.com", "topic": "SQLite Test", "score": 95, "timestamp": "2026-05-01T10:00:00"})
    
    history = await attempts.find({"user_email": "test@example.com"}).to_list(10)
    print(f"History count: {len(history)}")
    
    if os.path.exists("clarion_local.db"):
        print("✅ SQLite database file created successfully.")
    else:
        print("❌ SQLite database file NOT created.")

if __name__ == "__main__":
    asyncio.run(test_sqlite())
