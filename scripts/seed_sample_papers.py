import asyncio
import os
import sys

# Add apps/api to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "api")))

from app.core.database import AsyncSessionLocal, init_db
from app.services.document_service import document_service
from app.models.document import DocumentSource
from pypdf import PdfWriter, PdfReader
from app.core.logging import logger

SAMPLE_PAPERS = [
    {
        "title": "Deep Residual Learning for Image Recognition",
        "authors": ["Kaiming He", "Xiangyu Zhang", "Shaoqing Ren", "Jian Sun"],
        "abstract": "Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously. We explicitly reformulate the layers as learning residual functions with reference to the layer inputs. We evaluate ResNet-50 and ResNet-152 on ImageNet and CIFAR-10, achieving 94.2% accuracy and 3.57% top-5 error.",
        "content": (
            "1. Introduction\n"
            "Deep convolutional neural networks have led to a series of breakthroughs for image classification. "
            "When deeper networks are able to start converging, a degradation problem has been exposed: with network depth increasing, accuracy gets saturated.\n\n"
            "2. Methodology\n"
            "We address the degradation problem by introducing a deep residual learning framework. Instead of hoping each few stacked layers directly fit a desired underlying mapping, we explicitly let these layers fit a residual mapping F(x) := H(x) - x.\n\n"
            "3. Experiments\n"
            "We evaluate our residual nets on ImageNet 2012 classification benchmark. Our ResNet-50 and ResNet-152 models achieve 94.2% top-1 accuracy on CIFAR-10 and ImageNet.\n\n"
            "4. References\n"
            "[1] Alex Krizhevsky et al. ImageNet Classification with Deep Convolutional Neural Networks. NIPS 2012.\n"
            "[2] Karen Simonyan and Andrew Zisserman. Very Deep Convolutional Networks for Large-Scale Image Recognition. ICLR 2015."
        ),
        "arxiv_id": "1512.03385"
    },
    {
        "title": "An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale",
        "authors": ["Alexey Dosovitskiy", "Lucas Beyer", "Alexander Kolesnikov", "Neil Houlsby"],
        "abstract": "While the Transformer architecture has become the de-facto standard for NLP tasks, its applications to computer vision remain limited. We show that a pure Transformer applied directly to sequences of image patches can perform very well on image classification tasks. When pre-trained on large amounts of data (JFT-300M, ImageNet-21k) and transferred to multiple mid-sized image recognition benchmarks, Vision Transformer (ViT) achieves excellent results.",
        "content": (
            "1. Introduction\n"
            "Self-attention based architectures, in particular Transformers, have become the model of choice in NLP. We show that this reliance on CNNs is not necessary and a pure transformer applied directly to image patches works well.\n\n"
            "2. Methodology\n"
            "To apply standard Transformer to 2D images, we reshape image x into a sequence of flattened 2D patches x_p of size 16x16. We prepend a learnable class token and apply standard multi-head self-attention.\n\n"
            "3. Experiments\n"
            "We evaluate Vision Transformer on ImageNet-1k, CIFAR-10, and CIFAR-100. ViT-H/14 achieves 88.55% accuracy on ImageNet and 94.8% on CIFAR-10 using AdamW optimizer.\n\n"
            "4. Discussion & Limitations\n"
            "Vision Transformers lack inductive biases such as translation equivariance and locality, requiring massive pretraining datasets to avoid overfitting.\n\n"
            "5. References\n"
            "[1] Ashish Vaswani et al. Attention Is All You Need. NeurIPS 2017.\n"
            "[2] Kaiming He et al. Deep Residual Learning for Image Recognition. CVPR 2016."
        ),
        "arxiv_id": "2010.11929"
    }
]

def create_synthetic_pdf(filepath: str, title: str, abstract: str, content: str):
    from pypdf import PdfWriter
    writer = PdfWriter()
    writer.add_blank_page(width=612, height=792)
    with open(filepath, "wb") as f:
        writer.write(f)

    # Also write companion text for rich parsing
    txt_path = os.path.splitext(filepath)[0] + ".txt"
    with open(txt_path, "w", encoding="utf-8") as f:
        full_paper_text = f"{title}\n\nAbstract\n{abstract}\n\n{content}"
        f.write(full_paper_text)

async def seed():
    logger.info("Initializing database schemas for seeding...")
    await init_db()

    os.makedirs("./data/uploads", exist_ok=True)

    async with AsyncSessionLocal() as session:
        for p in SAMPLE_PAPERS:
            safe_name = f"seed_{p['arxiv_id']}.pdf"
            target_path = os.path.join("./data/uploads", safe_name)
            
            create_synthetic_pdf(target_path, p["title"], p["abstract"], p["content"])
            file_size = os.path.getsize(target_path)

            doc = await document_service.create_document_record(
                session=session,
                filename=f"{p['title'][:40]}.pdf",
                file_path=target_path,
                file_size=file_size,
                source=DocumentSource.ARXIV.value,
                arxiv_id=p["arxiv_id"]
            )
            logger.info(f"Created seed document record: {doc.id} ({p['title']})")
            await document_service.process_document_pipeline(session, doc.id)

    logger.info("Database seeding complete!")

if __name__ == "__main__":
    asyncio.run(seed())
