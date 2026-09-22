# Evaluation & Benchmarks

## Automated Evaluation Suite

DeepGraph AI includes an automated benchmarking script in `scripts/evaluate_retrieval.py` evaluating:
1. **Retrieval Precision & Recall@K**: Measures whether landmark passages and matching entities are accurately retrieved.
2. **Citation Grounding Accuracy**: Percentage of claims in generated syntheses directly linked to verifiable document chunks (Target: $100\%$).
3. **Retrieval Latency**: Hybrid search response time (Target: $< 50\text{ ms}$ on local cache/in-memory index; $< 200\text{ ms}$ on cold pgvector/Neo4j).
4. **End-to-End Latency**: Time to complete full LangGraph multi-agent execution pipeline.

## Running Benchmarks

```bash
# Run backend pytest suite
pytest apps/api/tests -v

# Run quantitative benchmark script
python scripts/evaluate_retrieval.py
```
