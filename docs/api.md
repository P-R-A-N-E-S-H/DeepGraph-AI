# REST API Reference (v1)

Base URL: `/api/v1`

## Authentication
- `POST /api/v1/auth/register` — Register a new user (`email`, `password`, `full_name`, `role`).
- `POST /api/v1/auth/login` — Authenticate and receive JWT access and refresh tokens.
- `POST /api/v1/auth/refresh` — Refresh access token using refresh token.
- `GET /api/v1/auth/me` — Retrieve current authenticated user profile.

## Documents & arXiv
- `POST /api/v1/documents/upload` — Upload PDF research paper and start asynchronous background ingestion.
- `GET /api/v1/documents` — List all ingested documents and paper metadata.
- `GET /api/v1/documents/{id}` — Get detailed document metadata and chunk stats.
- `GET /api/v1/documents/{id}/status` — Poll real-time processing status and stage metrics.
- `POST /api/v1/documents/{id}/process` — Trigger document reprocessing.
- `DELETE /api/v1/documents/{id}` — Delete document and cascade delete chunks and graph entities.
- `GET /api/v1/arxiv/search?query=...` — Search arXiv API for research papers.
- `POST /api/v1/arxiv/import` — Download arXiv paper PDF and enqueue in ingestion pipeline.

## Hybrid Search & Research Chat
- `POST /api/v1/search` — Execute weighted hybrid search across vector and knowledge graph.
- `POST /api/v1/chat` — Send question to LangGraph multi-agent research assistant. Returns synthesis and verified citations.
- `POST /api/v1/chat/stream` — SSE endpoint for real-time token streaming.
- `GET /api/v1/chat/sessions` — List user chat sessions.
- `GET /api/v1/chat/sessions/{id}` — Get message history for session.

## Knowledge Graph & Analytics
- `GET /api/v1/graph` — Retrieve subgraph with optional node type filters.
- `GET /api/v1/graph/entity/{id}` — Retrieve neighborhood subgraph for a given entity.
- `GET /api/v1/graph/analytics` — Summary statistics of nodes, edges, and degree centrality.
- `POST /api/v1/compare` — Generate comparative matrix across 2+ paper IDs.
- `GET /api/v1/gaps` — Discover research gaps, limitations, and potential directions.
- `GET /api/v1/analytics/timeline` — Chronological evolution timeline of methods and papers.
- `GET /api/v1/analytics/summary` — KPI counts and chart distributions.

## Workspaces & Notebooks
- `POST /api/v1/workspaces` — Create research workspace.
- `GET /api/v1/workspaces` — List workspaces.
- `POST /api/v1/workspaces/{id}/notes` — Add note to research notebook.
- `GET /api/v1/workspaces/{id}/notes` — List notes in workspace.
- `GET /api/v1/workspaces/{id}/export` — Export workspace notes to Markdown format.

## Health Checks
- `GET /health` — REST gateway status.
- `GET /api/v1/health/database` — Database connection check.
- `GET /api/v1/health/redis` — Redis cluster / queue check.
- `GET /api/v1/health/neo4j` — Neo4j / Graph engine check.
