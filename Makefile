.PHONY: install test test-cov seed benchmark dev-api dev-web docker-up docker-down

install:
	pip install -r apps/api/requirements.txt
	cd apps/web && npm install

test:
	pytest apps/api/tests -v

seed:
	python scripts/seed_sample_papers.py

benchmark:
	python scripts/evaluate_retrieval.py

dev-api:
	cd apps/api && uvicorn app.main:app --reload --port 8000

dev-web:
	cd apps/web && npm run dev

docker-up:
	docker compose up -d --build

docker-down:
	docker compose down
