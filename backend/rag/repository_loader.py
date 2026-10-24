"""Safe public GitHub repository loader with SSRF protection and document discovery."""

import os
import re
import asyncio
import urllib.parse
from typing import List, Tuple, Optional, Dict
import httpx
from dotenv import load_dotenv

load_dotenv()

from .models import RepositoryMetadata, DocumentFile


# Regex to safely parse public GitHub repository URLs
GITHUB_URL_PATTERN = re.compile(
    r"^(?:https?://)?(?:www\.)?github\.com/([a-zA-Z0-9_\-\.]+)/([a-zA-Z0-9_\-\.]+?)(?:\.git)?/?$"
)

# Common documentation file paths prioritized for open-source onboarding
PRIORITY_DOC_FILES = [
    "README.md",
    "README.rst",
    "README.txt",
    "CONTRIBUTING.md",
    "CONTRIBUTING.rst",
    ".github/CONTRIBUTING.md",
    "CODE_OF_CONDUCT.md",
    ".github/CODE_OF_CONDUCT.md",
    "DEVELOPMENT.md",
    "SETUP.md",
    "INSTALL.md",
    "TESTING.md",
    "ARCHITECTURE.md",
    "GOVERNANCE.md",
    ".github/PULL_REQUEST_TEMPLATE.md",
]

DOC_EXTENSIONS = (".md", ".markdown", ".txt", ".rst")
EXCLUDED_PATTERNS = (
    "node_modules", "vendor", ".venv", "dist", "build", ".git",
    "package-lock.json", "journals/", "journal/", "archive/", "fixtures/"
)
TRANSLATED_DOC_REGEX = re.compile(r"[_\.](?:zh|ko|ja|es|fr|de|id|vi|az|pt|ru|cn|tw|tr)\.(?:md|markdown|rst)$", re.IGNORECASE)

MAX_FILES_LIMIT = 15
MAX_FILE_SIZE_BYTES = 250_000  # 250 KB


def _get_github_headers() -> Dict[str, str]:
    """Generates GitHub REST API request headers, applying GITHUB_TOKEN if configured."""
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Orynth-RAG-Agent"
    }
    token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    if token and token.strip():
        headers["Authorization"] = f"Bearer {token.strip()}"
    return headers


def parse_and_validate_github_url(url_or_slug: str) -> Tuple[str, str]:
    """
    Safely validates that the input is a valid public GitHub repository.
    Guards against SSRF and local network access.
    Returns (owner, repo).
    """
    clean_input = url_or_slug.strip()
    
    # Handle shorthand owner/repo (e.g. 'pallets/flask')
    if "/" in clean_input and not clean_input.startswith("http") and not clean_input.startswith("//"):
        parts = clean_input.split("/")
        if len(parts) == 2 and all(
            re.match(r"^[a-zA-Z0-9_\-\.]+$", p) and p not in (".", "..") and not p.startswith(".")
            for p in parts
        ):
            owner = parts[0]
            repo = parts[1].removesuffix(".git")
            return owner, repo

    parsed = urllib.parse.urlparse(clean_input)
    if parsed.scheme and parsed.scheme not in ("http", "https"):
        raise ValueError("Invalid protocol. Only standard HTTP/HTTPS GitHub URLs are permitted.")

    # Guard against local/private IPs and non-github domains
    hostname = (parsed.hostname or "").lower()
    if hostname != "github.com" and hostname != "www.github.com":
        raise ValueError(f"Domain '{hostname}' is not supported. Only public GitHub repositories are permitted.")

    if parsed.username or parsed.password:
        raise ValueError("Credentials in repository URLs are strictly disallowed.")

    match = GITHUB_URL_PATTERN.match(clean_input)
    if not match:
        raise ValueError("Invalid GitHub repository URL format. Example: https://github.com/pallets/flask")

    owner, repo = match.groups()
    if owner in (".", "..") or repo in (".", "..") or owner.startswith("."):
        raise ValueError("Invalid repository owner or name.")

    repo = repo.removesuffix(".git")
    return owner, repo


async def fetch_repository_metadata(owner: str, repo: str) -> RepositoryMetadata:
    """Fetches repository metadata from GitHub REST API with safe fallback."""
    api_url = f"https://api.github.com/repos/{owner}/{repo}"
    headers = _get_github_headers()

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(api_url, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                return RepositoryMetadata(
                    owner=owner,
                    repo=repo,
                    url=f"https://github.com/{owner}/{repo}",
                    default_branch=data.get("default_branch", "main"),
                    description=data.get("description"),
                    language=data.get("language"),
                    stars=data.get("stargazers_count", 0),
                    discovered_files_count=0
                )
            elif resp.status_code == 404:
                raise ValueError(f"Repository '{owner}/{repo}' not found on GitHub or is private.")
            elif resp.status_code == 403:
                # Rate limit encountered - fallback gracefully with defaults
                return RepositoryMetadata(
                    owner=owner,
                    repo=repo,
                    url=f"https://github.com/{owner}/{repo}",
                    default_branch="main",
                    description=f"{owner}/{repo} (Rate-limited public repository)",
                    stars=0,
                    discovered_files_count=0
                )
        except httpx.RequestError as e:
            return RepositoryMetadata(
                owner=owner,
                repo=repo,
                url=f"https://github.com/{owner}/{repo}",
                default_branch="main",
                description=f"{owner}/{repo} (Offline cache mode)",
                stars=0,
                discovered_files_count=0
            )

    return RepositoryMetadata(
        owner=owner,
        repo=repo,
        url=f"https://github.com/{owner}/{repo}",
        default_branch="main",
        stars=0,
        discovered_files_count=0
    )


async def discover_documentation_files(owner: str, repo: str, default_branch: str = "main") -> List[DocumentFile]:
    """
    Discovers and fetches documentation files from the public repository.
    Uses GitHub Git Trees API when available, and falls back to checking known priority paths.
    Fetches raw documentation content concurrently for optimal performance.
    """
    discovered_files: List[DocumentFile] = []
    seen_paths = set()
    headers = _get_github_headers()

    async with httpx.AsyncClient(timeout=15.0) as client:
        # Step 1: Try Git Tree API to discover docs in one request
        tree_url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/{default_branch}?recursive=1"
        try:
            tree_resp = await client.get(tree_url, headers=headers)
            if tree_resp.status_code == 200:
                tree_data = tree_resp.json()
                for item in tree_data.get("tree", []):
                    if item.get("type") == "blob":
                        path = item.get("path", "")
                        lower_path = path.lower()
                        # Match markdown or documentation files
                        if any(lower_path.endswith(ext) for ext in DOC_EXTENSIONS):
                            if not any(excl in lower_path for excl in EXCLUDED_PATTERNS) and not TRANSLATED_DOC_REGEX.search(lower_path):
                                if lower_path.startswith("docs/") or any(p.lower() in lower_path for p in PRIORITY_DOC_FILES) or "/" not in path:
                                    if path not in seen_paths and len(seen_paths) < MAX_FILES_LIMIT:
                                        seen_paths.add(path)
        except Exception:
            pass

        # Step 2: Ensure priority doc files are included even if tree was truncated or rate-limited
        for p in PRIORITY_DOC_FILES:
            if p not in seen_paths and len(seen_paths) < MAX_FILES_LIMIT:
                seen_paths.add(p)

        # Step 3: Fetch file content concurrently from raw.githubusercontent.com
        sem = asyncio.Semaphore(8)

        async def fetch_file(path: str) -> Optional[DocumentFile]:
            raw_url = f"https://raw.githubusercontent.com/{owner}/{repo}/{default_branch}/{path}"
            try:
                async with sem:
                    content_resp = await client.get(raw_url)
                    if content_resp.status_code == 200:
                        text = content_resp.text
                        if len(text.encode("utf-8")) <= MAX_FILE_SIZE_BYTES and text.strip():
                            file_type = "markdown" if path.endswith((".md", ".markdown")) else "text"
                            return DocumentFile(
                                path=path,
                                url=f"https://github.com/{owner}/{repo}/blob/{default_branch}/{path}",
                                size_bytes=len(text.encode("utf-8")),
                                raw_content=text,
                                file_type=file_type
                            )
            except Exception:
                pass
            return None

        tasks = [fetch_file(p) for p in seen_paths]
        fetched_results = await asyncio.gather(*tasks)
        discovered_files = [f for f in fetched_results if f is not None]

    return discovered_files

