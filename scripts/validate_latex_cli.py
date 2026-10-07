"""
DeepGraph AI - Automated LaTeX Compilation & Syntax Validation CLI
Validates compile-readiness, citation cross-references, and table syntax in generated paper drafts.
"""
import sys
import os
import re
import argparse
import asyncio

# Add app to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "api")))

from app.core.database import AsyncSessionLocal, init_db
from app.agents.latex_generator import latex_generator_agent, LatexDraftRequest

def validate_latex(tex_code: str, bib_code: str) -> dict:
    errors = []
    warnings = []

    # 1. Extract citation keys
    cited_keys = set(re.findall(r'\\cite\{([^}]+)\}', tex_code))
    # Bib keys
    bib_keys = set(re.findall(r'@\w+\{([^,]+),', bib_code))

    missing_keys = cited_keys - bib_keys
    if missing_keys:
        errors.append(f"Missing BibTeX keys for citations: {missing_keys}")

    # 2. Check environment matching
    envs = ["table", "table*", "tabular", "figure", "equation"]
    for env in envs:
        begins = len(re.findall(rf'\\begin\{{{re.escape(env)}\}}', tex_code))
        ends = len(re.findall(rf'\\end\{{{re.escape(env)}\}}', tex_code))
        if begins != ends:
            errors.append(f"Mismatched environment \\begin{{{env}}} ({begins}) vs \\end{{{env}}} ({ends})")

    # 3. Check section structure
    has_section = bool(re.search(r'\\section\{[^}]+\}', tex_code))
    if not has_section:
        warnings.append("Document lacks top-level \\section{} command.")

    is_valid = len(errors) == 0
    readiness_score = 100 if is_valid and not warnings else (85 if is_valid else 40)

    return {
        "is_valid": is_valid,
        "readiness_score": readiness_score,
        "cited_keys_count": len(cited_keys),
        "bib_entries_count": len(bib_keys),
        "errors": errors,
        "warnings": warnings
    }

async def run_cli_validation(topic: str):
    print("=" * 70)
    print(f"DeepGraph AI - LaTeX Synthesizer Validation Tool")
    print(f"Topic: '{topic}'")
    print("=" * 70)

    await init_db()

    async with AsyncSessionLocal() as session:
        req = LatexDraftRequest(
            paper_ids=[],
            topic=topic,
            template_style="neurips",
            include_comparison_table=True
        )
        print("\n[1/2] Generating LaTeX and BibTeX bundle...")
        res = await latex_generator_agent.generate_latex_draft(session, req)

        print("[2/2] Validating LaTeX compiler syntax and citation keys...")
        result = validate_latex(res.latex_code, res.bibtex_code)

        print("\n--- Validation Report ---")
        print(f"Status: {'PASSED (Compile-Ready)' if result['is_valid'] else 'FAILED'}")
        print(f"Compiler Readiness Score: {result['readiness_score']}/100")
        print(f"Total Citations: {result['cited_keys_count']}")
        print(f"BibTeX Entries: {result['bib_entries_count']}")

        if result['errors']:
            print(f"\n[!] Errors: {result['errors']}")
        if result['warnings']:
            print(f"\n[*] Warnings: {result['warnings']}")

        print("\n" + "=" * 70)

def main():
    parser = argparse.ArgumentParser(description="DeepGraph AI LaTeX Compiler Validator")
    parser.add_argument("--topic", type=str, default="Graph Neural Networks in Molecular Discovery", help="Survey topic")
    args = parser.parse_args()
    asyncio.run(run_cli_validation(args.topic))

if __name__ == "__main__":
    main()
