import asyncio
import os
import sys

# Add current dir to path to import services
sys.path.append(os.getcwd())

from services.db_manager import db_manager

async def check_health():
    from dotenv import load_dotenv
    load_dotenv()
    
    MONGO_URL = os.getenv("MONGO_URL", "")
    LOCAL_MONGO = os.getenv("LOCAL_MONGO_URL", "mongodb://127.0.0.1:27017")
    
    print(f"Connecting to: {MONGO_URL}")
    await db_manager.connect(MONGO_URL, LOCAL_MONGO)
    print(f"Final DB Mode: {db_manager.mode}")
    print(f"DB Status: {db_manager.status}")
    
    if db_manager.mode == "production":
        print("✅ SUCCESS: Connected to MongoDB Atlas.")
    elif db_manager.mode == "sqlite":
        print("⚠️ WARNING: MongoDB Atlas failed (Bad Auth). Running in SQLite Fallback mode.")
    
    # Test a simple query
    try:
        await db_manager.users.find_one({})
        print("✅ Database queries are working.")
    except Exception as e:
        print(f"❌ Database query failed: {e}")

if __name__ == "__main__":
    asyncio.run(check_health())
