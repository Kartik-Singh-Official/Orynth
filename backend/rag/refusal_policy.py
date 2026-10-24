"""Safe refusal policy and hallucination guardrails for Orynth."""

from typing import List, Tuple, Optional
from .models import RetrievedPassage, Citation

# Minimum cosine similarity threshold below which questions are declined without calling the LLM
MIN_RELEVANCE_THRESHOLD = 0.32

STANDARD_REFUSAL_MESSAGE = (
    "I could not verify that from this repository's documentation. "
    "The indexed documentation does not contain sufficient evidence to answer this question reliably. "
    "I suggest checking the project's GitHub Issues, Discussions, or contacting a maintainer directly."
)

KNOWN_REFUSAL_PHRASES = [
    "could not be found",
    "cannot be found",
    "not mentioned in",
    "not found in the document",
    "not covered in the documentation",
    "does not provide information",
    "insufficient evidence",
]


def should_refuse_query(passages: List[RetrievedPassage]) -> Tuple[bool, Optional[str]]:
    """
    Evaluates whether retrieval results are too weak or absent to attempt answering.
    Returns (should_refuse, reason).
    """
    if not passages:
        return True, "No relevant documentation passages were retrieved."

    top_score = passages[0].similarity_score
    if top_score < MIN_RELEVANCE_THRESHOLD:
        return (
            True,
            f"Top retrieved passage has low relevance similarity ({top_score:.3f} < {MIN_RELEVANCE_THRESHOLD:.2f})."
        )

    return False, None


def is_llm_refusal(answer_text: str) -> bool:
    """Checks whether the generated text signifies an explicit refusal to answer."""
    lower_text = answer_text.lower()
    return any(phrase in lower_text for phrase in KNOWN_REFUSAL_PHRASES)


def extract_and_validate_citations(
    answer_text: str,
    passages: List[RetrievedPassage]
) -> List[Citation]:
    """
    Maps citations mentioned in the answer to real, retrieved document chunks.
    Ensures that only authentic file paths and known line ranges are returned.
    """
    valid_citations: List[Citation] = []
    seen_files = set()

    # Match which passages were actually relevant to the facts in the answer
    for passage in passages:
        chunk = passage.chunk
        # If the file path is mentioned in the answer, or if this chunk was top rank with strong score
        file_name = chunk.file_path.split("/")[-1]
        if file_name.lower() in answer_text.lower() or chunk.file_path.lower() in answer_text.lower() or passage.rank == 1:
            if chunk.file_path not in seen_files:
                seen_files.add(chunk.file_path)
                valid_citations.append(
                    Citation(
                        file_path=chunk.file_path,
                        start_line=chunk.start_line,
                        end_line=chunk.end_line,
                        heading=chunk.heading,
                        github_url=f"{chunk.file_url}#L{chunk.start_line}-L{chunk.end_line}",
                        snippet=chunk.content[:200] + ("..." if len(chunk.content) > 200 else "")
                    )
                )

    # If no specific file was explicitly named, attach the highest scoring chunk as the primary evidence
    if not valid_citations and passages:
        top_chunk = passages[0].chunk
        valid_citations.append(
            Citation(
                file_path=top_chunk.file_path,
                start_line=top_chunk.start_line,
                end_line=top_chunk.end_line,
                heading=top_chunk.heading,
                github_url=f"{top_chunk.file_url}#L{top_chunk.start_line}-L{top_chunk.end_line}",
                snippet=top_chunk.content[:200] + ("..." if len(top_chunk.content) > 200 else "")
            )
        )

    return valid_citations
