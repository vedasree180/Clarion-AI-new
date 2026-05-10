import requests
import json

API_URL = "http://127.0.0.1:8000"

def test_auth_flow():
    print("--- Simulating Frontend Auth Flow ---")
    
    # 1. Test Registration
    print("\n1. Testing POST /api/auth/signup...")
    reg_data = {
        "username": "tester123",
        "email": "tester@example.com",
        "password": "testpassword123",
        "name": "Tester User"
    }
    try:
        res = requests.post(f"{API_URL}/api/auth/signup", json=reg_data)
        print(f"Status: {res.status_code}")
        print(f"Response: {res.text}")
        
        if res.status_code == 400 and "already registered" in res.text:
            print("(!) User already exists, proceeding to login test.")
        elif res.status_code != 200:
            print("FAIL: Registration failed.")
            return
    except Exception as e:
        print(f"FAIL: Could not reach backend: {e}")
        return

    # 2. Test Login
    print("\n2. Testing POST /api/auth/login...")
    login_data = {
        "username": "tester@example.com",
        "password": "testpassword123"
    }
    try:
        # FastAPI OAuth2PasswordRequestForm expects form data
        res = requests.post(f"{API_URL}/api/auth/login", data=login_data)
        print(f"Status: {res.status_code}")
        print(f"Response: {res.text}")
        
        if res.status_code == 200:
            token_data = res.json()
            token = token_data.get("access_token")
            print(f"SUCCESS: Received token: {token[:20]}...")
            
            # 3. Test Profile Fetch (to ensure token works)
            print("\n3. Testing GET /api/profile...")
            res = requests.get(f"{API_URL}/api/profile", headers={"Authorization": f"Bearer {token}"})
            print(f"Status: {res.status_code}")
            print(f"Response: {res.text}")
            if res.status_code == 200:
                print("SUCCESS: Full Auth Flow verified.")
            else:
                print("FAIL: Profile fetch failed with token.")
        else:
            print("FAIL: Login failed.")
    except Exception as e:
        print(f"FAIL: Login request error: {e}")

if __name__ == "__main__":
    test_auth_flow()
