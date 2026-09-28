# Citation Network & Bibliographic Coupling Analysis

DeepGraph AI includes an automated bibliometric analysis engine that uncovers structural relationships, intellectual lineages, and methodological commonalities across ingested literature.

---

## 📊 Core Analytical Dimensions

### 1. Bibliographic Coupling
Two research papers are **bibliographically coupled** when they share common references, extracted methodological dependencies, or benchmark datasets.

$$\text{Coupling Strength}(P_1, P_2) = \frac{|E(P_1) \cap E(P_2)|}{|E(P_1) \cup E(P_2)|}$$

Where $E(P)$ represents the extracted entity set (methods, models, datasets, tasks) associated with paper $P$.

---

### 2. Co-Citation Clustering
Detects papers frequently cited together by subsequent literature using **Greedy Modularity Community Detection** on the NetworkX graph representation:

- Partitions papers into dense thematic sub-communities.
- Derives automatic cluster descriptors (e.g. *Thematic Cohort: Self-Attention • Vision Transformer • ImageNet*).

---

### 3. Structural Influence & Centrality (HITS & PageRank)

The engine calculates three complementary centrality scores:

| Metric | Algorithm | Meaning in Research Graph |
| :--- | :--- | :--- |
| **PageRank** | Random Surfer Model ($\alpha = 0.85$) | Global citation flow and structural importance. |
| **Authority Score** | Kleinberg HITS | Foundational landmark papers containing core theoretical results. |
| **Hub Score** | Kleinberg HITS | Comprehensive survey or bridging papers linking diverse sub-fields. |

---

## 🏷️ Automatic Paper Classification

- **Landmark Seed**: Highly cited historical breakthroughs ($Year < 2020$ with elevated PageRank).
- **Pivotal Bridge**: High-degree connecting nodes linking multiple methodological clusters.
- **Recent SOTA**: Modern publications ($Year \ge 2023$) introducing frontier benchmark results.
- **Foundational**: Baseline methodology papers providing standard evaluation setups.

---

## 🚀 API Endpoint Reference

### `GET /api/v1/citations/analysis`
Returns full network metrics, pairwise coupling edges, thematic clusters, and influence rankings.

```json
{
  "total_papers": 12,
  "total_couplings": 24,
  "network_density": 0.3636,
  "influential_papers": [
    {
      "paper_id": "8c42b10a-...",
      "title": "Attention Is All You Need",
      "year": 2017,
      "pagerank": 0.142,
      "authority_score": 0.381,
      "influence_rank": 1,
      "classification": "Landmark Seed"
    }
  ],
  "coupling_edges": [
    {
      "source_title": "Attention Is All You Need",
      "target_title": "An Image is Worth 16x16 Words",
      "shared_methods": ["Self-Attention", "LayerNorm"],
      "shared_datasets": ["ImageNet"],
      "coupling_strength": 0.85
    }
  ]
}
```
