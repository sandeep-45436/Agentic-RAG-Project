import os
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
DATABASE_URL = os.getenv("DATABASE_URL", "")
PORT = int(os.getenv("PYTHON_AGENT_PORT", "8000"))
HOST = os.getenv("PYTHON_AGENT_HOST", "0.0.0.0")
