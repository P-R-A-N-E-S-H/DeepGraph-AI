from typing import List, Dict, Any
from app.schemas.graph import EntityExtractionPayload

class ExtractedRelation:
    def __init__(self, source: str, target: str, relation: str, properties: Dict[str, Any] = None):
        self.source = source
        self.target = target
        self.relation = relation
        self.properties = properties or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "source": self.source,
            "target": self.target,
            "relation": self.relation,
            "properties": self.properties
        }

class RelationshipExtractor:
    """Derives validated semantic relationships between research papers and extracted entities."""

    def extract_relations(
        self,
        paper_id: str,
        paper_title: str,
        entities: EntityExtractionPayload,
        resolved_citations: List[str] = []
    ) -> List[ExtractedRelation]:
        relations: List[ExtractedRelation] = []

        # Paper -> AUTHORED_BY -> Author
        for author in entities.authors:
            relations.append(ExtractedRelation(
                source=paper_id,
                target=author,
                relation="AUTHORED_BY"
            ))

        # Paper -> USES_MODEL -> Model
        for model in entities.models:
            relations.append(ExtractedRelation(
                source=paper_id,
                target=model,
                relation="USES_MODEL"
            ))

        # Paper -> USES_DATASET -> Dataset
        for dataset in entities.datasets:
            relations.append(ExtractedRelation(
                source=paper_id,
                target=dataset,
                relation="USES_DATASET"
            ))

        # Paper -> USES_METHOD -> Method
        for method in entities.methods:
            relations.append(ExtractedRelation(
                source=paper_id,
                target=method,
                relation="USES_METHOD"
            ))

        # Paper -> ADDRESSES -> Task
        for task in entities.tasks:
            relations.append(ExtractedRelation(
                source=paper_id,
                target=task,
                relation="ADDRESSES"
            ))

        # Model -> EVALUATED_ON -> Dataset
        for model in entities.models:
            for dataset in entities.datasets:
                relations.append(ExtractedRelation(
                    source=model,
                    target=dataset,
                    relation="EVALUATED_ON"
                ))

        # Paper -> CITES -> Other Papers
        for cited_id in resolved_citations:
            relations.append(ExtractedRelation(
                source=paper_id,
                target=cited_id,
                relation="CITES"
            ))

        # Paper -> ACHIEVES_METRIC -> Metric
        for metric in entities.metrics:
            metric_label = f"{metric.name}_{metric.value}{metric.unit or ''}"
            relations.append(ExtractedRelation(
                source=paper_id,
                target=metric_label,
                relation="ACHIEVES_METRIC",
                properties={"name": metric.name, "value": metric.value, "unit": metric.unit}
            ))

        return relations

relationship_extractor = RelationshipExtractor()
