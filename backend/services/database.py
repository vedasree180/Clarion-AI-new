from pymongo import MongoClient
import os
from datetime import datetime

import certifi

# Use the same env var/key as main.py
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
LOCAL_MONGO = os.getenv("LOCAL_MONGO_URL", "mongodb://localhost:27017")
# Default DB name to match main application
DB_NAME = os.getenv("DB_NAME", "clarion_db")

def _create_client_with_fallback():
    try:
        c = MongoClient(
            MONGO_URL,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
        )
        c.admin.command('ping')
        print(f"Connected to MongoDB (primary): {MONGO_URL}")
        return c
    except Exception as e:
        print(f"Primary MongoDB connection failed: {e}")
        print(f"Attempting fallback to local MongoDB: {LOCAL_MONGO}")
        try:
            c2 = MongoClient(
                LOCAL_MONGO,
                serverSelectionTimeoutMS=2000,
                connectTimeoutMS=2000,
            )
            c2.admin.command('ping')
            print("Connected to local MongoDB successfully.")
            return c2
        except Exception as e2:
            print(f"Fallback MongoDB connection failed: {e2}")
            raise


client = _create_client_with_fallback()
db = client[DB_NAME]

# Collections
users_col = db["users"]
attempts_col = db["attempts"]

def get_db():
    # Return the db object for use in routes or scripts
    return db

def init_db():
    try:
        # Check connection
        client.admin.command('ping')
        print("Connected to MongoDB successfully.")
        
        # Create indexes
        users_col.create_index("email", unique=True)
        attempts_col.create_index("user_id")
        
    except Exception as e:
        print(f"MongoDB Connection Error: {e}")
        print("⚠️ ACTION REQUIRED: Ensure MongoDB is running or set a valid MONGO_URL in your environment.")
        print("⚠️ FALLBACK: The app may fail on DB-dependent routes until MongoDB is active.")

if __name__ == "__main__":
    init_db()
