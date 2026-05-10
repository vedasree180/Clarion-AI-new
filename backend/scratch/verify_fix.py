import importlib
import sys

modules = [
    "fastapi",
    "fastapi.responses",
    "uvicorn",
    "motor",
    "motor.motor_asyncio",
    "dotenv",
    "certifi",
    "nltk",
    "sentence_transformers"
]

print(f"Python version: {sys.version}")
sys.stdout.flush()

for module in modules:
    print(f"Checking {module}...", end=" ")
    sys.stdout.flush()
    try:
        importlib.import_module(module)
        print("OK")
    except ImportError as e:
        print(f"FAIL: {e}")
    sys.stdout.flush()
