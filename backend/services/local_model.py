# backend/services/local_model.py
import requests
import json
import logging

logger = logging.getLogger(__name__)

class LocalModelService:
    """
    Interface for local inference engines (Ollama).
    Enables ChatGPT-grade reasoning without external APIs.
    """
    def __init__(self, base_url="http://localhost:11434/api"):
        self.base_url = base_url
        self.model = "phi3" # Default lightweight model

    def is_available(self):
        """Check if Ollama is running."""
        try:
            response = requests.get(f"{self.base_url}/tags", timeout=1)
            return response.status_code == 200
        except:
            return False

    def generate_response(self, system_prompt, messages):
        """Generate response using local SLM."""
        # Non-streaming implementation (kept for legacy)
        if not self.is_available():
            return None
        
        prompt_messages = [{"role": "system", "content": system_prompt}] + messages
        try:
            payload = {"model": self.model, "messages": prompt_messages, "stream": False}
            response = requests.post(f"{self.base_url}/chat", json=payload, timeout=10)
            return response.json().get("message", {}).get("content")
        except: return None

    def stream_response(self, system_prompt, messages):
        """Yield tokens from local SLM."""
        if not self.is_available():
            yield "Local model unavailable."
            return

        prompt_messages = [{"role": "system", "content": system_prompt}] + messages
        try:
            payload = {
                "model": self.model,
                "messages": prompt_messages,
                "stream": True,
            }
            response = requests.post(f"{self.base_url}/chat", json=payload, stream=True, timeout=30)
            for line in response.iter_lines():
                if line:
                    chunk = json.loads(line)
                    token = chunk.get("message", {}).get("content", "")
                    if token:
                        yield token
        except Exception as e:
            logger.error(f"Local Model Streaming Error: {e}")
            yield "Error in local stream."


# Singleton
local_model = LocalModelService()
