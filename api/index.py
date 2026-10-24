import os
import sys
from pathlib import Path

# Add project root directory to sys.path so backend imports work seamlessly in Vercel Serverless
root_dir = str(Path(__file__).resolve().parent.parent)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from backend.app import app
