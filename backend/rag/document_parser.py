"""Document parser for Markdown and plain-text documentation files."""

import re
from typing import List, Dict, Any, Tuple
from .models import DocumentFile


class ParsedSection:
    """A section of a document under a specific heading."""
    def __init__(self, heading: str, content: str, start_line: int, end_line: int):
        self.heading = heading
        self.content = content
        self.start_line = start_line
        self.end_line = end_line


HEADING_PATTERN = re.compile(r"^(#{1,6})\s+(.+)$")


def parse_markdown_document(doc: DocumentFile) -> List[ParsedSection]:
    """
    Parses a markdown or plain-text document into structured sections,
    retaining heading hierarchy and exact 1-indexed line numbers.
    """
    lines = doc.raw_content.splitlines()
    if not lines:
        return []

    sections: List[ParsedSection] = []
    current_heading = doc.path
    current_lines: List[str] = []
    start_line = 1

    for idx, line in enumerate(lines, start=1):
        match = HEADING_PATTERN.match(line.strip())
        if match:
            # We encountered a new heading. Save previous section if non-empty
            if current_lines:
                content = "\n".join(current_lines).strip()
                if content:
                    sections.append(
                        ParsedSection(
                            heading=current_heading,
                            content=content,
                            start_line=start_line,
                            end_line=idx - 1
                        )
                    )
                current_lines = []

            level = len(match.group(1))
            heading_title = match.group(2).strip()
            current_heading = f"{doc.path} > {heading_title}"
            start_line = idx
            current_lines.append(line)
        else:
            current_lines.append(line)

    # Save remaining content
    if current_lines:
        content = "\n".join(current_lines).strip()
        if content:
            sections.append(
                ParsedSection(
                    heading=current_heading,
                    content=content,
                    start_line=start_line,
                    end_line=len(lines)
                )
            )

    return sections
