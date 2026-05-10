import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Add parent dir to path
sys.path.append(os.getcwd())

from services.db_manager import db_manager
from services.auth import get_password_hash, verify_password

async def diagnostic():
    load_dotenv()
    MONGO_URL = os.getenv("MONGO_URL", "")
    LOCAL_MONGO = os.getenv("LOCAL_MONGO_URL", "mongodb://127.0.0.1:27017")
    
    print(f"--- Auth Diagnostic ---")
    print(f"Connecting to DB...")
    await db_manager.connect(MONGO_URL, LOCAL_MONGO)
    print(f"Mode: {db_manager.mode}")
    print(f"Status: {db_manager.status}")
    
    db = db_manager
    test_email = "diag_test@example.com"
    test_user = "diag_user"
    test_pass = "diag_password"
    
    # Clean up existing test user
    if db_manager.mode != "sqlite":
        await db.users.delete_one({"email": test_email})
    else:
        # SQLite fallback delete not implemented in SQLiteCollection yet, but find/insert OR REPLACE is.
        pass

    print(f"Testing Registration...")
    hashed = get_password_hash(test_pass)
    user_doc = {
        "email": test_email,
        "username": test_user,
        "password": hashed,
        "name": "Diag Test"
    }
    
    try:
        await db.users.insert_one(user_doc)
        print("[SUCCESS] Registration (Insert) Success")
    except Exception as e:
        print(f"[ERROR] Registration (Insert) Failed: {e}")
        return

    print("Testing Login (Find + Verify)...")
    try:
        found_user = await db.users.find_one({"email": test_email})
        if not found_user:
            print("[ERROR] Login Failed: User not found in DB after insert")
        else:
            print(f"[SUCCESS] User found in DB: {found_user['email']}")
            if verify_password(test_pass, found_user["password"]):
                print("[SUCCESS] Password verification Success")
            else:
                print("[ERROR] Password verification Failed")
    except Exception as e:
        print(f"[ERROR] Login (Find) Failed: {e}")

if __name__ == "__main__":
    asyncio.run(diagnostic())
