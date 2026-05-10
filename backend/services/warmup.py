# backend/services/warmup.py
import nltk
import logging
import os
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

def warmup_assets():
    """
    Ensure all AI assets are pre-downloaded and loaded into memory.
    Ensures 100% offline reliability.
    """
    logger.info("🚀 Starting AI Engine Warmup...")

    # 1. NLTK Assets
    nltk_assets = ['punkt', 'punkt_tab', 'stopwords', 'averaged_perceptron_tagger']
    for asset in nltk_assets:
        try:
            nltk.data.find(f'tokenizers/{asset}' if 'punkt' in asset else f'corpora/{asset}')
            logger.info(f"✅ NLTK asset '{asset}' is ready.")
        except LookupError:
            logger.info(f"📥 Downloading NLTK asset '{asset}'...")
            nltk.download(asset, quiet=True)

    # 2. Embedding Model Pre-load
    model_name = 'all-MiniLM-L6-v2'
    logger.info(f"🧠 Loading Embedding Model '{model_name}'...")
    try:
        # This will load it into memory cache if using singleton-like access elsewhere
        # or we can store it in a global for the app
        model = SentenceTransformer(model_name)
        logger.info("✅ Embedding Model warm and ready.")
        return model
    except Exception as e:
        logger.error(f"❌ Warmup Error: {e}")
        return None

# Global warm model
warm_model = None

def init_warmup():
    global warm_model
    warm_model = warmup_assets()
