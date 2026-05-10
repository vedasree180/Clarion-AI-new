from sentence_transformers import SentenceTransformer

model = None

def get_model():
    global model
    if model is None:
        model = SentenceTransformer('all-MiniLM-L6-v2')
    return model

def get_embedding(text: str):
    return get_model().encode(text)

def get_embeddings(texts: list):
    return get_model().encode(texts)
