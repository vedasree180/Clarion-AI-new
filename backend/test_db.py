import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import certifi

load_dotenv()

async def test_conn():
    url = os.getenv("MONGO_URL")
    if not url:
        print("ERROR: MONGO_URL not found in .env")
        return
    
    print(f"Testing connection to: {url}")
    try:
        # Try with explicit tls and certifi
        client = AsyncIOMotorClient(
            url, 
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000
        )
        print("Attempting to ping with certifi...")
        await client.admin.command('ping')
        print("SUCCESS: MongoDB Connection Successful!")
    except Exception as e:
        print(f"FAILED: Connection Failed with certifi: {type(e).__name__}: {e}")
        
        print("\nAttempting alternative connection (without tlsCAFile)...")
        try:
            client2 = AsyncIOMotorClient(
                url,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=5000
            )
            await client2.admin.command('ping')
            print("SUCCESS: MongoDB Connection Successful (default SSL)!")
        except Exception as e2:
            print(f"FAILED: Alternative Connection Failed: {type(e2).__name__}: {e2}")
            
            print("\nAttempting alternative connection (tlsAllowInvalidCertificates=True)...")
            try:
                client3 = AsyncIOMotorClient(
                    url,
                    tlsAllowInvalidCertificates=True,
                    serverSelectionTimeoutMS=5000,
                    connectTimeoutMS=5000
                )
                await client3.admin.command('ping')
                print("SUCCESS: MongoDB Connection Successful (tlsAllowInvalidCertificates=True)!")
            except Exception as e3:
                print(f"FAILED: tlsAllowInvalidCertificates Failed: {type(e3).__name__}: {e3}")
                
                print("\nAttempting alternative connection (tls=False)...")
                try:
                    client4 = AsyncIOMotorClient(
                        url,
                        tls=False,
                        serverSelectionTimeoutMS=5000,
                        connectTimeoutMS=5000
                    )
                    await client4.admin.command('ping')
                    print("SUCCESS: MongoDB Connection Successful (tls=False)!")
                except Exception as e4:
                    print(f"FAILED: tls=False Failed: {type(e4).__name__}: {e4}")
                    
                    print("\nAttempting local MongoDB connection (localhost:27017)...")
                    try:
                        client5 = AsyncIOMotorClient(
                            "mongodb://localhost:27017",
                            serverSelectionTimeoutMS=2000,
                            connectTimeoutMS=2000
                        )
                        await client5.admin.command('ping')
                        print("SUCCESS: Local MongoDB Connection Successful!")
                    except Exception as e5:
                        print(f"FAILED: Local MongoDB Failed: {type(e5).__name__}: {e5}")

if __name__ == "__main__":
    asyncio.run(test_conn())
