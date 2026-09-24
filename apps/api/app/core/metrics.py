import time
from typing import Dict, Any
from app.core.neo4j import in_memory_graph

class MetricsCollector:
    """Collects system, API, retrieval and ingestion operational metrics for Prometheus scraping."""

    def __init__(self):
        self.request_count = 0
        self.total_latency_ms = 0.0
        self.ingested_docs_count = 0
        self.search_queries_count = 0
        self.llm_tokens_generated = 0
        self.start_time = time.time()

    def record_request(self, latency_ms: float):
        self.request_count += 1
        self.total_latency_ms += latency_ms

    def record_ingestion(self, doc_count: int = 1):
        self.ingested_docs_count += doc_count

    def record_search(self):
        self.search_queries_count += 1

    def record_tokens(self, count: int):
        self.llm_tokens_generated += count

    def generate_prometheus_output(self) -> str:
        uptime = time.time() - self.start_time
        graph_nodes = in_memory_graph.graph.number_of_nodes()
        graph_edges = in_memory_graph.graph.number_of_edges()
        avg_latency = self.total_latency_ms / max(1, self.request_count)

        lines = [
            "# HELP deepgraph_uptime_seconds Total runtime uptime of DeepGraph AI service.",
            "# TYPE deepgraph_uptime_seconds gauge",
            f"deepgraph_uptime_seconds {uptime:.2f}",
            "",
            "# HELP deepgraph_http_requests_total Total number of HTTP requests processed.",
            "# TYPE deepgraph_http_requests_total counter",
            f"deepgraph_http_requests_total {self.request_count}",
            "",
            "# HELP deepgraph_http_avg_latency_ms Average HTTP request latency in milliseconds.",
            "# TYPE deepgraph_http_avg_latency_ms gauge",
            f"deepgraph_http_avg_latency_ms {avg_latency:.2f}",
            "",
            "# HELP deepgraph_search_queries_total Total hybrid search queries executed.",
            "# TYPE deepgraph_search_queries_total counter",
            f"deepgraph_search_queries_total {self.search_queries_count}",
            "",
            "# HELP deepgraph_ingested_documents_total Total research documents processed.",
            "# TYPE deepgraph_ingested_documents_total counter",
            f"deepgraph_ingested_documents_total {self.ingested_docs_count}",
            "",
            "# HELP deepgraph_knowledge_graph_nodes Number of nodes in the knowledge graph.",
            "# TYPE deepgraph_knowledge_graph_nodes gauge",
            f"deepgraph_knowledge_graph_nodes {graph_nodes}",
            "",
            "# HELP deepgraph_knowledge_graph_edges Number of relations in the knowledge graph.",
            "# TYPE deepgraph_knowledge_graph_edges gauge",
            f"deepgraph_knowledge_graph_edges {graph_edges}",
            "",
            "# HELP deepgraph_llm_tokens_total Total LLM tokens generated across agents.",
            "# TYPE deepgraph_llm_tokens_total counter",
            f"deepgraph_llm_tokens_total {self.llm_tokens_generated}",
            ""
        ]
        return "\n".join(lines)

metrics_collector = MetricsCollector()
