import time
import statistics
import asyncio
import sys
import os

# Add api to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "api")))

from app.core.database import AsyncSessionLocal
from app.retrieval.hybrid_retriever import hybrid_retriever
from app.retrieval.reranker import cross_encoder_reranker

BENCHMARK_QUERIES = [
    "What are residual connections in convolutional networks?",
    "How does vision transformer patch tokenization work?",
    "What is the quadratic computational complexity of self-attention?",
    "How do Graph-RAG systems resolve hallucination?",
    "Compare ImageNet top-1 accuracy between ResNet-50 and ViT-B/16",
    "What are the scaling limitations of mixture of experts models?",
    "Explain direct preference optimization in reinforcement learning",
    "How does knowledge graph entity extraction improve semantic retrieval?",
    "What benchmark datasets evaluate out-of-distribution transfer?",
    "Explain cross-encoder reranking algorithms with MMR diversity"
]

async def benchmark_hybrid_retriever(num_iterations: int = 20):
    print("==================================================")
    print("   DeepGraph AI - Retrieval Latency & SOTA Benchmark")
    print("==================================================")
    print(f"Executing {num_iterations} queries across benchmark dataset...\n")

    latencies = []

    async with AsyncSessionLocal() as session:
        for idx in range(num_iterations):
            q = BENCHMARK_QUERIES[idx % len(BENCHMARK_QUERIES)]
            t0 = time.perf_counter()
            res = await hybrid_retriever.retrieve(session=session, query=q, top_k=5)
            t1 = time.perf_counter()
            elapsed_ms = (t1 - t0) * 1000.0
            latencies.append(elapsed_ms)
            print(f"[{idx+1:02d}/{num_iterations}] Query: '{q[:38]}...' -> Latency: {elapsed_ms:.2f}ms | Found: {res.total_found}")

    p50 = statistics.median(latencies)
    p95 = sorted(latencies)[int(len(latencies) * 0.95)] if len(latencies) >= 20 else max(latencies)
    p99 = sorted(latencies)[int(len(latencies) * 0.99)] if len(latencies) >= 20 else max(latencies)
    mean_lat = statistics.mean(latencies)
    rps = 1000.0 / mean_lat if mean_lat > 0 else 0

    print("\n---------------- Benchmark Summary ----------------")
    print(f"Total Queries Tested: {len(latencies)}")
    print(f"Mean Latency:         {mean_lat:.2f} ms")
    print(f"P50 (Median):         {p50:.2f} ms")
    print(f"P95:                  {p95:.2f} ms")
    print(f"P99:                  {p99:.2f} ms")
    print(f"Throughput (RPS):     {rps:.1f} req/sec")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(benchmark_hybrid_retriever())
