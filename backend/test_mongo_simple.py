import os
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
from dotenv import load_dotenv

load_dotenv()

async def test_conn():
    url = os.getenv("MONGO_URL")
    print(f"Testing connection to: {url}")
    client = AsyncIOMotorClient(
        url,
        tlsCAFile=certifi.where(),
        tls=True,
        tlsAllowInvalidCertificates=True,
        serverSelectionTimeoutMS=5000
    )
    try:
        await client.admin.command('ping')
        print("✅ Connection successful!")
    except Exception as e:
        print(f"❌ Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_conn())
