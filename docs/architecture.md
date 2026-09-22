# DeepGraph AI — System Architecture

DeepGraph AI converts research papers and technical publications into an interconnected, searchable knowledge graph with hybrid vector-graph semantic retrieval and citation-verified multi-agent reasoning.

## Core Architecture Overview

```mermaid
flowchart TB
    subgraph Frontend["Next.js 14 Frontend Layer"]
        Dashboard[Research Dashboard & Analytics]
        Chat[Multi-Agent Research Chat with Citations]
        GraphView[React Flow Knowledge Graph Visualizer]
        Comparison[Multi-Paper Comparative Matrix]
        GapsView[Research Gap Discovery Explorer]
        WorkspacesView[Workspace & Research Notebook]
    end

    subgraph API["FastAPI REST & Streaming Gateway"]
        AuthRoutes[Authentication & JWT/RBAC Middleware]
        DocRoutes[Document & arXiv Ingestion Endpoints]
        SearchRoutes[Hybrid Semantic Search Endpoints]
        AgentRoutes[LangGraph Research Orchestration]
        GraphRoutes[Knowledge Graph & Analytics Endpoints]
    end

    subgraph Ingestion["Ingestion & Extraction Pipeline"]
        PDFParser[PDF Structure & Section Parser]
        Chunker[Structure-Aware Chunking Engine]
        EntityExtractor[LLM + Schema-Validated Entity Extractor]
        RelExtractor[Relationship & Citation Extractor]
        EmbedEngine[Embedding Provider (SentenceTransformers / OpenAI / Mock)]
        SecurityGuard[Prompt-Injection Defense & Boundary Isolation]
    end

    subgraph Storage["Storage & Graph Tier"]
        Postgres[(PostgreSQL + pgvector / Vector Index)]
        Neo4jGraph[(Neo4j Knowledge Graph / NetworkX Engine)]
        RedisCache[(Redis Cluster / In-Memory Task Queue)]
    end

    subgraph Agents["LangGraph Multi-Agent System"]
        QueryPlanner[Query Planner Agent]
        Retriever[Hybrid Retriever (Vector + Graph + Meta)]
        GraphReasoner[Graph Reasoning Agent]
        EvidenceAgent[Evidence Ranking & Filtering Agent]
        Synthesizer[Research Synthesizer Agent]
        Verifier[Citation Verifier Node]
        Formatter[Response Formatter Node]
    end

    Frontend --> API
    API --> Ingestion
    Ingestion --> Storage
    API --> Agents
    Agents --> Storage
```

## System Subsystems

### 1. Ingestion Subsystem
- **PDF Structure & Section Detection**: Intelligently segments PDF into Abstract, Introduction, Related Work, Methodology, Experiments, Results, Discussion, and References.
- **Structure-Aware Chunking**: Maintains `document_id`, `page_number`, `section`, `chunk_index`, and token boundaries for granular citation tracking.
- **Prompt Defense Boundary**: Sanitizes untrusted document text and encapsulates it within non-executable XML delimiters `<UNTRUSTED_RESEARCH_DOCUMENT_EVIDENCE>`.

### 2. Dual-Engine Storage Subsystem
- **Vector Tier**: Stores 384d/1536d embeddings with cosine similarity search using pgvector / numpy vector indexing.
- **Graph Tier**: Stores nodes (`Paper`, `Author`, `Model`, `Dataset`, `Method`, `Metric`, `Task`) and edges (`CITES`, `USES_MODEL`, `USES_DATASET`, `USES_METHOD`, `ACHIEVES_METRIC`, `AUTHORED_BY`, `ADDRESSES`) with Neo4j Bolt and in-memory graph fallback.
- **Async Queue Tier**: Coordinates background ingestion workers via Redis / in-process async worker queues.

### 3. LangGraph Multi-Agent Research Subsystem
- 7-step deterministic reasoning graph executing planning, hybrid retrieval, graph traversal, evidence filtering, synthesis, strict citation validation, and LaTeX/markdown formatting.
