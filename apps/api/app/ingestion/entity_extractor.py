import re
from typing import Dict, List, Any
from app.schemas.graph import EntityExtractionPayload, MetricValue
from app.core.logging import logger

class EntityExtractor:
    """Extracts entities (models, datasets, methods, metrics, tasks, concepts) with deterministic validation."""

    # Curated NLP / Vision / ML dictionaries for high-precision deterministic matching
    KNOWN_MODELS = [
        "ResNet-50", "ResNet-101", "ResNet-152", "ResNet", "Vision Transformer", "ViT", "ViT-B/16", "ViT-L/16",
        "BERT", "RoBERTa", "GPT-3", "GPT-4", "LLaMA", "LLaMA-2", "LLaMA-3", "Mistral", "Mixtral", "CLIP",
        "DALL-E", "Stable Diffusion", "U-Net", "YOLO", "YOLOv8", "VGG-16", "AlexNet", "DenseNet", "Transformer",
        "Convolutional Neural Network", "CNN", "RNN", "LSTM", "Graph Neural Network", "GNN"
    ]

    KNOWN_DATASETS = [
        "ImageNet", "CIFAR-10", "CIFAR-100", "MNIST", "COCO", "MS-COCO", "SQuAD", "SQuAD 2.0", "GLUE", "SuperGLUE",
        "Cityscapes", "PASCAL VOC", "WikiText", "Common Crawl", "BooksCorpus", "MMLU", "HumanEval", "GSM8k"
    ]

    KNOWN_METHODS = [
        "Self-Attention", "Multi-Head Attention", "FlashAttention", "Residual Connections", "Batch Normalization",
        "Layer Normalization", "Dropout", "AdamW", "Adam", "SGD", "Cosine Annealing", "Reinforcement Learning from Human Feedback",
        "RLHF", "DPO", "LoRA", "QLoRA", "Prefix Tuning", "Contrastive Learning", "SimCLR", "Masked Autoencoding", "MAE"
    ]

    KNOWN_TASKS = [
        "Image Classification", "Object Detection", "Semantic Segmentation", "Question Answering",
        "Machine Translation", "Language Modeling", "Text Generation", "Named Entity Recognition",
        "Document Summarization", "Information Retrieval", "Graph Representation Learning"
    ]

    def extract_deterministic(self, text: str) -> EntityExtractionPayload:
        payload = EntityExtractionPayload()
        
        # Match Models
        for model in self.KNOWN_MODELS:
            pattern = r'\b' + re.escape(model) + r'\b'
            if re.search(pattern, text, re.IGNORECASE):
                if model not in payload.models:
                    payload.models.append(model)

        # Match Datasets
        for dataset in self.KNOWN_DATASETS:
            pattern = r'\b' + re.escape(dataset) + r'\b'
            if re.search(pattern, text, re.IGNORECASE):
                if dataset not in payload.datasets:
                    payload.datasets.append(dataset)

        # Match Methods
        for method in self.KNOWN_METHODS:
            pattern = r'\b' + re.escape(method) + r'\b'
            if re.search(pattern, text, re.IGNORECASE):
                if method not in payload.methods:
                    payload.methods.append(method)

        # Match Tasks
        for task in self.KNOWN_TASKS:
            pattern = r'\b' + re.escape(task) + r'\b'
            if re.search(pattern, text, re.IGNORECASE):
                if task not in payload.tasks:
                    payload.tasks.append(task)

        # Extract Metrics (e.g. "achieves 94.2% top-1 accuracy", "BLEU score of 42.5", "mAP of 56.4")
        metric_patterns = [
            (r'(\d+(?:\.\d+)?)\s*%\s*(?:top-1\s+|top-5\s+)?(accuracy|acc)', '%', 'Accuracy'),
            (r'(accuracy|acc)\s*(?:of|is|reaches|achieves)?\s*(\d+(?:\.\d+)?)\s*%', '%', 'Accuracy'),
            (r'(?:BLEU|bleu)(?:\s*score)?\s*(?:of|is)?\s*(\d+(?:\.\d+)?)', 'score', 'BLEU'),
            (r'(?:mAP|map)(?:\s*score)?\s*(?:of|is)?\s*(\d+(?:\.\d+)?)', 'mAP', 'mAP'),
            (r'(?:F1|f1)(?:\s*score)?\s*(?:of|is)?\s*(\d+(?:\.\d+)?)', 'F1', 'F1-Score'),
            (r'(?:perplexity|PPL)\s*(?:of|is)?\s*(\d+(?:\.\d+)?)', 'ppl', 'Perplexity')
        ]

        for pattern, unit, metric_name in metric_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for m in matches:
                try:
                    # Find numerical group
                    val_str = m.group(1) if re.match(r'^\d', m.group(1)) else m.group(2)
                    val = float(val_str)
                    if 0 <= val <= 1000:
                        payload.metrics.append(MetricValue(
                            name=metric_name,
                            value=val,
                            unit=unit
                        ))
                except Exception:
                    continue

        return payload

    def extract_from_document(self, text: str, title: str = "", authors: List[str] = []) -> EntityExtractionPayload:
        payload = self.extract_deterministic(text)
        
        if title and title not in payload.papers:
            payload.papers.append(title)
            
        for auth in authors:
            if auth not in payload.authors:
                payload.authors.append(auth)

        return payload

entity_extractor = EntityExtractor()
