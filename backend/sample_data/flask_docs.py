"""Pre-packaged documentation dataset from pallets/flask for offline demo and benchmarking."""

from typing import List
from backend.rag.models import DocumentFile, RepositoryMetadata


SAMPLE_REPO_METADATA = RepositoryMetadata(
    owner="pallets",
    repo="flask",
    url="https://github.com/pallets/flask",
    default_branch="main",
    description="The Python micro framework for building web applications.",
    language="Python",
    stars=68000,
    discovered_files_count=6
)

FLASK_README = """# Flask

Flask is a lightweight WSGI web application framework. It is designed to make getting started quick and easy, with the ability to scale up to complex applications.

## A Minimal Application

```python
from flask import Flask

app = Flask(__name__)

@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"
```

## Installing

Install and update using [pip](https://pip.pypa.io/en/stable/getting-started/):

```bash
$ pip install -U Flask
```

Flask requires Python 3.8 or newer.

## Contributing

For guidance on setting up a development environment and how to make a contribution to Flask, see the [CONTRIBUTING.md](CONTRIBUTING.md) guidelines.
"""

FLASK_CONTRIBUTING = """# How to Contribute to Flask

Thank you for considering contributing to Flask!

## Code of Conduct

Everyone interacting in the Flask project's codebases, issue trackers, chat rooms, and mailing lists is expected to follow the Pallets Code of Conduct. We follow the Contributor Covenant standards.

## Setting Up a Development Sandbox

1. Fork the repository on GitHub and clone your fork locally:
   ```bash
   $ git clone https://github.com/your-username/flask.git
   $ cd flask
   ```
2. Create a virtual environment using python3 -m venv:
   ```bash
   $ python3 -m venv .venv
   $ source .venv/bin/activate  # On Windows: .venv\\Scripts\\activate
   ```
3. Install Flask in editable mode with development dependencies:
   ```bash
   $ pip install -e ".[dev]"
   ```
4. Install pre-commit hooks to automatically check linting and code formatting:
   ```bash
   $ pre-commit install
   ```

## Running the Automated Test Suite

Run the basic test suite using pytest:
```bash
$ pytest
```
To run tests across multiple Python versions, use tox:
```bash
$ tox
```

## Creating Pull Requests

1. Always create a new branch from `main` for your changes:
   ```bash
   $ git checkout -b my-feature-branch
   ```
2. Make your changes and write unit tests in the `tests/` directory covering new behavior.
3. Verify that tests pass (`pytest`) and code passes style checks (`pre-commit run --all-files`).
4. Update the changelog in `CHANGES.rst` for notable changes or bug fixes.
5. Push to your fork and submit a pull request against the `main` branch.
"""

FLASK_CODE_OF_CONDUCT = """# Contributor Covenant Code of Conduct

## Our Pledge

We as members, contributors, and leaders pledge to make participation in our community a harassment-free experience for everyone, regardless of age, body size, visible or invisible disability, ethnicity, sex characteristics, gender identity and expression, level of experience, education, socio-economic status, nationality, personal appearance, race, religion, or sexual identity and orientation.

## Our Standards

Examples of behavior that contributes to a positive environment include:
- Demonstrating empathy and kindness toward other people
- Being respectful of differing opinions, viewpoints, and experiences
- Giving and gracefully accepting constructive feedback
- Accepting responsibility and apologizing to those affected by our mistakes

Examples of unacceptable behavior include:
- The use of sexualized language or imagery, and sexual attention or advances of any kind
- Trolling, insulting or derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information, such as a physical or email address, without their explicit permission
"""

FLASK_TESTING = """# Testing Flask

Flask uses `pytest` for all unit testing.

## Running Tests

To run the test suite:
```bash
$ pytest
```

To run a specific test file:
```bash
$ pytest tests/test_basic.py
```

To check code coverage:
```bash
$ pytest --cov=flask
```

All pull requests are tested against Python 3.8 through 3.12 via GitHub Actions CI.
"""

FLASK_INSTALLATION = """# Installation Guide

## Python Version Support

Flask supports Python 3.8 and newer.

## Virtual Environments

Always use a virtual environment to manage dependencies for your projects, both in training and in production.

```bash
$ python3 -m venv .venv
$ source .venv/bin/activate
$ pip install Flask
```
"""

FLASK_LICENSE = """# License

Flask is licensed under the BSD 3-Clause License.

Copyright 2010 Pallets

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
"""


def get_sample_flask_documents() -> List[DocumentFile]:
    """Returns the bundled sample documentation files for pallets/flask."""
    base_url = "https://github.com/pallets/flask/blob/main"
    return [
        DocumentFile(
            path="README.md",
            url=f"{base_url}/README.md",
            size_bytes=len(FLASK_README.encode("utf-8")),
            raw_content=FLASK_README,
            file_type="markdown"
        ),
        DocumentFile(
            path="CONTRIBUTING.md",
            url=f"{base_url}/CONTRIBUTING.md",
            size_bytes=len(FLASK_CONTRIBUTING.encode("utf-8")),
            raw_content=FLASK_CONTRIBUTING,
            file_type="markdown"
        ),
        DocumentFile(
            path="CODE_OF_CONDUCT.md",
            url=f"{base_url}/CODE_OF_CONDUCT.md",
            size_bytes=len(FLASK_CODE_OF_CONDUCT.encode("utf-8")),
            raw_content=FLASK_CODE_OF_CONDUCT,
            file_type="markdown"
        ),
        DocumentFile(
            path="docs/testing.md",
            url=f"{base_url}/docs/testing.md",
            size_bytes=len(FLASK_TESTING.encode("utf-8")),
            raw_content=FLASK_TESTING,
            file_type="markdown"
        ),
        DocumentFile(
            path="docs/installation.md",
            url=f"{base_url}/docs/installation.md",
            size_bytes=len(FLASK_INSTALLATION.encode("utf-8")),
            raw_content=FLASK_INSTALLATION,
            file_type="markdown"
        ),
        DocumentFile(
            path="LICENSE.md",
            url=f"{base_url}/LICENSE.md",
            size_bytes=len(FLASK_LICENSE.encode("utf-8")),
            raw_content=FLASK_LICENSE,
            file_type="markdown"
        ),
    ]
