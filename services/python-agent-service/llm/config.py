import os
from dotenv import load_dotenv

load_dotenv()

# Gemini 2.5 Flash Settings
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")

# Preferred Model Configuration
# We prioritize Gemini 2.5 Flash as requested, optimized for low-latency agentic reasoning.
DEFAULT_MODEL = os.getenv("AGENT_REASONING_MODEL", "google/gemini-2.5-flash")
FALLBACK_MODEL = os.getenv("AGENT_FALLBACK_MODEL", "openai/gpt-4o-mini")

OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
