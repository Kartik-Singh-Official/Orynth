"""Generator for the 'Where do I start?' contributor onboarding checklist."""

from typing import List
from .models import OnboardingChecklist, OnboardingStep
from .retriever import VectorIndex

CHECKLIST_DEFINITIONS = [
    {
        "step_number": 1,
        "title": "Review Project Overview & Code of Conduct",
        "category": "overview",
        "query": "project overview mission community standards code of conduct contributor covenant",
    },
    {
        "step_number": 2,
        "title": "Set Up Local Development Environment & Dependencies",
        "category": "setup",
        "query": "local development setup virtual environment install dependencies editable mode requirements",
    },
    {
        "step_number": 3,
        "title": "Run Test Suites & Code Quality Checks",
        "category": "tests",
        "query": "run tests pytest test suite lint linters pre-commit mypy format check",
    },
    {
        "step_number": 4,
        "title": "Find an Issue & Review Contribution Guidelines",
        "category": "workflow",
        "query": "finding good first issue claim issue bug report contribution guidelines branch naming",
    },
    {
        "step_number": 5,
        "title": "Submit Pull Request & Changelog Conventions",
        "category": "workflow",
        "query": "pull request conventions PR title commit message format changelog rebase squash",
    },
]


def generate_onboarding_checklist(repo_key: str, index: VectorIndex) -> OnboardingChecklist:
    """
    Generates a 5-step contributor checklist grounded in the indexed repository documentation.
    For each step, evaluates whether documentation support exists.
    """
    steps: List[OnboardingStep] = []
    covered_count = 0

    for defn in CHECKLIST_DEFINITIONS:
        step_num = defn["step_number"]
        title = defn["title"]
        category = defn["category"]
        query = defn["query"]

        passages = index.retrieve(query, top_k=2)
        if passages and passages[0].similarity_score >= 0.58:
            top_chunk = passages[0].chunk

            covered_count += 1
            
            # Format clean snippet
            snippet = top_chunk.content[:220].strip() + ("..." if len(top_chunk.content) > 220 else "")
            
            steps.append(
                OnboardingStep(
                    step_number=step_num,
                    title=title,
                    description=f"Documented in `{top_chunk.file_path}`: {snippet}",
                    category=category,
                    supporting_file=top_chunk.file_path,
                    supporting_url=f"{top_chunk.file_url}#L{top_chunk.start_line}-L{top_chunk.end_line}",
                    is_covered_in_docs=True,
                    evidence_snippet=snippet
                )
            )
        else:
            steps.append(
                OnboardingStep(
                    step_number=step_num,
                    title=title,
                    description="Not covered in the indexed repository documentation.",
                    category=category,
                    supporting_file=None,
                    supporting_url=None,
                    is_covered_in_docs=False,
                    evidence_snippet=None
                )
            )

    return OnboardingChecklist(
        repository=repo_key,
        steps=steps,
        total_steps=len(steps),
        covered_steps=covered_count
    )
