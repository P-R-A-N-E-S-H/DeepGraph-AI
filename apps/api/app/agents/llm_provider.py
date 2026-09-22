import abc
from typing import List, Dict, Any, Optional, AsyncGenerator
import httpx
from app.core.config import settings
from app.core.logging import logger

class LLMProvider(abc.ABC):
    @abc.abstractmethod
    async def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        pass

    @abc.abstractmethod
    async def stream_generate(self, prompt: str, system_prompt: Optional[str] = None) -> AsyncGenerator[str, None]:
        pass

class MockLLMProvider(LLMProvider):
    """Deterministic, high-quality Mock LLM provider for instant local development and test suites."""

    async def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        prompt_lower = prompt.lower()
        
        if "compare" in prompt_lower or "comparison" in prompt_lower:
            return (
                "### Comparative Research Synthesis\n\n"
                "1. **Core Problem & Architecture**: CNN architectures rely on local convolutional inductive biases with translation invariance, "
                "whereas Vision Transformers (ViT) discard spatial inductive bias in favor of global multi-head self-attention across non-overlapping image patches.\n\n"
                "2. **Data & Scaling Regimes**: CNNs train efficiently on standard datasets (e.g. ImageNet-1k), while Vision Transformers require large-scale pretraining (e.g. JFT-300M or ImageNet-21k) "
                "to surpass CNN accuracy.\n\n"
                "3. **Computational Efficiency**: Self-attention exhibits quadratic complexity $\\mathcal{O}(N^2)$ with respect to sequence length, whereas standard CNN convolutions are linear with image area.\n\n"
                "**Conclusion**: Hybrid architectures combining local convolutional inductive priors with global attention representations often yield the optimal empirical trade-off."
            )
        elif "limitations" in prompt_lower or "gap" in prompt_lower:
            return (
                "### Identified Limitations & Potential Research Directions\n\n"
                "- **Spatial Invariance & Inductive Bias**: Standard convolutional networks struggle with scale variation without multi-scale feature pyramids.\n"
                "- **High Computational Complexity**: Vision Transformers require substantial compute and memory during training and inference on high-resolution inputs.\n"
                "- **Data Efficiency**: Extreme reliance on massive pretraining datasets limits transferability to low-resource scientific domains.\n\n"
                "*Note: These items represent observed empirical limitations across surveyed papers and suggest promising directions for efficiency and sample complexity research.*"
            )
        else:
            return (
                "Based on the retrieved research evidence from the ingested documents:\n\n"
                "1. **Architectural Foundations**: The investigated methodologies demonstrate strong empirical performance on standard benchmark datasets.\n"
                "2. **Key Findings**: Residual learning enables training of significantly deeper networks without vanishing gradients, while self-attention mechanisms capture long-range contextual relationships.\n"
                "3. **Empirical Benchmarks**: Extracted evaluations highlight state-of-the-art accuracy across ImageNet and domain-specific benchmarks.\n\n"
                "Direct citations have been verified against the extracted document chunks."
            )

    async def stream_generate(self, prompt: str, system_prompt: Optional[str] = None) -> AsyncGenerator[str, None]:
        full_text = await self.generate(prompt, system_prompt)
        words = full_text.split(" ")
        for w in words:
            yield w + " "

class OpenAILLMProvider(LLMProvider):
    def __init__(self, api_key: str, model: str = "gpt-4o-mini"):
        self.api_key = api_key
        self.model = model

    async def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        url = "https://api.openai.com/v1/chat/completions"
        headers = {"Authorization": f"Bearer {self.api_key}"}
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, headers=headers, json={"model": self.model, "messages": messages, "temperature": 0.2})
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]

    async def stream_generate(self, prompt: str, system_prompt: Optional[str] = None) -> AsyncGenerator[str, None]:
        # Fallback to single yield if streaming not configured
        text = await self.generate(prompt, system_prompt)
        for chunk in text.split(" "):
            yield chunk + " "

class AnthropicLLMProvider(LLMProvider):
    def __init__(self, api_key: str, model: str = "claude-3-5-sonnet-20241022"):
        self.api_key = api_key
        self.model = model

    async def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        url = "https://api.anthropic.com/v1/messages"
        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }
        payload = {
            "model": self.model,
            "max_tokens": 2048,
            "messages": [{"role": "user", "content": prompt}]
        }
        if system_prompt:
            payload["system"] = system_prompt

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["content"][0]["text"]

    async def stream_generate(self, prompt: str, system_prompt: Optional[str] = None) -> AsyncGenerator[str, None]:
        text = await self.generate(prompt, system_prompt)
        for chunk in text.split(" "):
            yield chunk + " "

def get_llm_provider() -> LLMProvider:
    provider = settings.LLM_PROVIDER.lower()
    if provider == "openai" and settings.OPENAI_API_KEY:
        return OpenAILLMProvider(settings.OPENAI_API_KEY)
    elif provider == "anthropic" and settings.ANTHROPIC_API_KEY:
        return AnthropicLLMProvider(settings.ANTHROPIC_API_KEY)
    return MockLLMProvider()

llm_service = get_llm_provider()
