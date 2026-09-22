# Ingestion Pipeline & PDF Processing

## Pipeline Lifecycle

The document ingestion pipeline executes as an asynchronous background workflow transitioning through 7 distinct lifecycle stages:

```text
UPLOADED → PARSING → CHUNKING → EXTRACTING → EMBEDDING → INDEXING → COMPLETED (or FAILED)
```

Every stage records execution latency in `stage_metrics`, timestamps, error messages, and retry counters.

### 1. Parsing & Section Detection
- **PDF Extraction**: `pypdf` extracts raw text and metadata across all pages.
- **Section Regex Classifier**: Discovers section boundaries using multi-pattern regex matching:
  - `Abstract`
  - `Introduction`
  - `Related Work`
  - `Methodology / Model Architecture`
  - `Experiments / Evaluation`
  - `Results / Ablation Studies`
  - `Discussion / Limitations`
  - `Conclusion / Future Work`
  - `References / Bibliography`

### 2. Structure-Aware Chunking
Unlike naive sliding-window text splitters, DeepGraph AI preserves semantic cohesion:
- Respects section boundaries and paragraph breaks.
- Enforces a target budget of ~350 tokens (max 500 tokens) with ~50 token overlap.
- Records exact provenance metadata on every chunk:
  ```json
  {
    "document_id": "84d59f3e-...",
    "chunk_index": 4,
    "page_number": 3,
    "section": "Methodology",
    "token_count": 312
  }
  ```

### 3. Entity & Relationship Extraction
- **Entities**: Discovers models (e.g. `ResNet-50`, `Vision Transformer`), datasets (`ImageNet`, `CIFAR-10`), methods (`Self-Attention`, `LayerNorm`), tasks (`Image Classification`), and metrics (`94.2% top-1 accuracy`).
- **Validation**: Strict Pydantic parsing with fallback schema normalization.

### 4. Citation Extraction
- Resolves reference lists into structured bibliography objects (`title`, `authors`, `year`, `DOI`, `arXiv ID`, `confidence`).
- Confidence scores $< 0.70$ are flagged for verification.
