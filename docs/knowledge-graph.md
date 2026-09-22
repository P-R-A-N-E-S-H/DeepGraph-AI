# Knowledge Graph & Graph Reasoning

## Graph Schema

The DeepGraph Knowledge Graph model models research concepts across 12 node classes and 15 typed relationships:

### Node Types
- `Paper`: Technical publication metadata (title, abstract, year, venue, DOI, arXiv ID).
- `Author`: Researcher identity and affiliations.
- `Organization`: Research institutions, corporate AI labs, and universities.
- `Dataset`: Benchmark datasets and evaluation splits (e.g. ImageNet, CIFAR-10).
- `Method`: Technical algorithms and mechanisms (e.g. Self-Attention, LayerNorm).
- `Model`: Concrete neural network architectures (e.g. ResNet-50, ViT-B/16, LLaMA-3).
- `Metric`: Quantitative evaluation results (e.g. Top-1 Accuracy: 94.2%).
- `Task`: Formal research objective (e.g. Image Classification, Object Detection).
- `Problem`: Open scientific challenges and failure modes.
- `Technology`: Underlying toolkits and compute platforms.
- `Concept`: Fundamental theoretical notions (e.g. Inductive Bias, Vanishing Gradients).
- `Venue`: Conferences and journals (e.g. CVPR, NeurIPS, ICLR, ICML).

### Relationship Taxonomy
- `AUTHORED_BY`: (Paper) → (Author)
- `CITES`: (Paper) → (Paper)
- `USES_MODEL`: (Paper) → (Model)
- `USES_DATASET`: (Paper) → (Dataset)
- `USES_METHOD`: (Paper) → (Method)
- `EVALUATED_ON`: (Model) → (Dataset)
- `ACHIEVES_METRIC`: (Paper) → (Metric)
- `ADDRESSES`: (Paper) → (Task)
- `SOLVES`: (Method) → (Problem)
- `EXTENDS`: (Model) → (Model)
- `COMPARES_WITH`: (Paper) → (Paper)
- `RELATED_TO`: (Concept) → (Concept)

## Example Cypher Queries

### Find All Models Evaluated on ImageNet with Metric Results
```cypher
MATCH (p:Paper)-[:USES_MODEL]->(m:Model)-[:EVALUATED_ON]->(d:Dataset {name: "ImageNet"})
OPTIONAL MATCH (p)-[:ACHIEVES_METRIC]->(metric:Metric)
RETURN p.title, m.name, metric.name, metric.value
```

### 2-Hop Citation Neighborhood Expansion
```cypher
MATCH (p:Paper {id: $paper_id})-[r:CITES*1..2]-(cited:Paper)
RETURN p, r, cited
```
