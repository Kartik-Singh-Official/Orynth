"""Chunker module implementing sliding window chunking with heading preservation."""

import hashlib
from typing import List
from .models import DocumentFile, DocumentChunk
from .document_parser import parse_markdown_document, ParsedSection

DEFAULT_CHUNK_SIZE = 120    # words per chunk (aligns with Theme 2 starter notebook)
DEFAULT_CHUNK_OVERLAP = 30  # words overlap between consecutive chunks


def chunk_document(
    doc: DocumentFile,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    chunk_overlap: int = DEFAULT_CHUNK_OVERLAP
) -> List[DocumentChunk]:
    """
    Splits a DocumentFile into bounded, overlapping chunks with heading and line metadata.
    """
    sections = parse_markdown_document(doc)
    chunks: List[DocumentChunk] = []
    file_slug = hashlib.md5(doc.path.encode("utf-8")).hexdigest()[:8]

    chunk_counter = 0

    for section in sections:
        words = section.content.split()
        if not words:
            continue

        # If section is small enough, make it a single chunk
        if len(words) <= chunk_size:
            chunk_counter += 1
            chunks.append(
                DocumentChunk(
                    chunk_id=f"chk_{file_slug}_{chunk_counter}",
                    file_path=doc.path,
                    file_url=doc.url,
                    heading=section.heading,
                    start_line=section.start_line,
                    end_line=section.end_line,
                    content=section.content,
                    word_count=len(words)
                )
            )
            continue

        # Sliding window over words
        step = max(1, chunk_size - chunk_overlap)
        total_section_lines = max(1, section.end_line - section.start_line + 1)
        total_words = len(words)

        for i in range(0, total_words, step):
            chunk_words = words[i : i + chunk_size]
            if not chunk_words:
                break

            # Calculate estimated line ranges
            start_ratio = i / total_words
            end_ratio = min(1.0, (i + len(chunk_words)) / total_words)
            chunk_start_line = section.start_line + int(start_ratio * total_section_lines)
            chunk_end_line = section.start_line + int(end_ratio * total_section_lines)
            chunk_end_line = max(chunk_start_line, min(section.end_line, chunk_end_line))

            chunk_counter += 1
            chunks.append(
                DocumentChunk(
                    chunk_id=f"chk_{file_slug}_{chunk_counter}",
                    file_path=doc.path,
                    file_url=doc.url,
                    heading=section.heading,
                    start_line=chunk_start_line,
                    end_line=chunk_end_line,
                    content=" ".join(chunk_words),
                    word_count=len(chunk_words)
                )
            )

            # Avoid tiny trailing chunks
            if i + chunk_size >= total_words:
                break

    return chunks


MAX_TOTAL_CHUNKS = 80


def chunk_multiple_documents(
    docs: List[DocumentFile],
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
    max_chunks: int = MAX_TOTAL_CHUNKS
) -> List[DocumentChunk]:
    """
    Chunks a list of DocumentFiles, prioritizing key onboarding documents (CONTRIBUTING, README, SETUP),
    and safely caps total chunks to stay within API rate limits and achieve fast indexing.
    """
    def priority_sort_key(doc: DocumentFile) -> int:
        p = doc.path.lower()
        if "contributing" in p:
            return 0
        if "readme" in p:
            return 1
        if any(k in p for k in ("setup", "install", "develop", "architecture")):
            return 2
        if "code_of_conduct" in p:
            return 3
        return 4

    sorted_docs = sorted(docs, key=priority_sort_key)
    all_chunks: List[DocumentChunk] = []

    for doc in sorted_docs:
        doc_chunks = chunk_document(doc, chunk_size=chunk_size, chunk_overlap=chunk_overlap)
        for chunk in doc_chunks:
            all_chunks.append(chunk)
            if len(all_chunks) >= max_chunks:
                return all_chunks

    return all_chunks
