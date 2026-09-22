import abc
import hashlib
import numpy as np
from typing import List
from app.core.config import settings
from app.core.logging import logger

class EmbeddingProvider(abc.ABC):
    @abc.abstractmethod
    async def embed_documents(self, texts: List[str]) -> List[List[float]]:
        pass

    @abc.abstractmethod
    async def embed_query(self, text: str) -> List[float]:
        pass

class MockEmbeddingProvider(EmbeddingProvider):
    """Deterministic, zero-dependency embedding provider generating unit-normalized vectors."""
    def __init__(self, dimension: int = 384):
        self.dimension = dimension

    def _generate_vector(self, text: str) -> List[float]:
        # Hash text to generate seed
        h = hashlib.sha256(text.encode('utf-8')).hexdigest()
        seed = int(h[:8], 16)
        rng = np.random.RandomState(seed)
        
        # Word frequency influence to preserve semantic overlap
        vec = rng.randn(self.dimension)
        words = text.lower().split()
        for w in words:
            w_h = int(hashlib.md5(w.encode('utf-8')).hexdigest()[:4], 16) % self.dimension
            vec[w_h] += 1.5

        # Normalize to unit sphere (L2 norm)
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()

    async def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [self._generate_vector(t) for t in texts]

    async def embed_query(self, text: str) -> List[float]:
        return self._generate_vector(text)

class SentenceTransformersEmbeddingProvider(EmbeddingProvider):
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model_name = model_name
        self.model = None
        self._load_model()

    def _load_model(self):
        try:
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer(self.model_name)
            logger.info(f"Loaded SentenceTransformer model: {self.model_name}")
        except Exception as e:
            logger.warning(f"Could not load local SentenceTransformer ({e}). Falling back to MockEmbeddingProvider.")
            self.model = None

    async def embed_documents(self, texts: List[str]) -> List[List[float]]:
        if self.model:
            embeddings = self.model.encode(texts, normalize_embeddings=True)
            return embeddings.tolist()
        mock = MockEmbeddingProvider()
        return await mock.embed_documents(texts)

    async def embed_query(self, text: str) -> List[float]:
        if self.model:
            embedding = self.model.encode([text], normalize_embeddings=True)[0]
            return embedding.tolist()
        mock = MockEmbeddingProvider()
        return await mock.embed_query(text)

class OpenAIEmbeddingProvider(EmbeddingProvider):
    def __init__(self, api_key: str, model: str = "text-embedding-3-small"):
        self.api_key = api_key
        self.model = model

    async def embed_documents(self, texts: List[str]) -> List[List[float]]:
        import httpx
        url = "https://api.openai.com/v1/embeddings"
        headers = {"Authorization": f"Bearer {self.api_key}"}
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, headers=headers, json={"input": texts, "model": self.model})
            resp.raise_for_status()
            data = resp.json()
            return [d["embedding"] for d in data["data"]]

    async def embed_query(self, text: str) -> List[float]:
        res = await self.embed_documents([text])
        return res[0]

def get_embedding_provider() -> EmbeddingProvider:
    provider = settings.EMBEDDING_PROVIDER.lower()
    if provider == "sentence_transformers":
        return SentenceTransformersEmbeddingProvider(settings.EMBEDDING_MODEL_NAME)
    elif provider == "openai" and settings.OPENAI_API_KEY:
        return OpenAIEmbeddingProvider(settings.OPENAI_API_KEY)
    return MockEmbeddingProvider(settings.EMBEDDING_DIMENSION)

embedding_service = get_embedding_provider()
