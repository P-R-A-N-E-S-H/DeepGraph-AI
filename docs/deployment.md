# Deployment & Production Setup

## Docker Compose Production Deployment

The entire DeepGraph AI platform can be deployed with Docker Compose:

```bash
# 1. Clone repository & configure environment
cp .env.example .env

# 2. Launch all containerized services
docker compose up -d --build
```

### Deployed Services
| Service | Port | Description |
| :--- | :--- | :--- |
| `web` | 3000 | Next.js 14 Production Frontend |
| `api` | 8000 | FastAPI REST & SSE Gateway |
| `worker` | - | Asynchronous PDF Ingestion Worker |
| `postgres` | 5432 | PostgreSQL 16 + pgvector |
| `neo4j` | 7474 / 7687 | Neo4j 5 Graph Database |
| `redis` | 6379 | Redis 7 Task Queue & Cache |

## Native Local Development (No Docker Required)

```bash
# Backend (Terminal 1)
cd apps/api
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (Terminal 2)
cd apps/web
npm install
npm run dev
```
