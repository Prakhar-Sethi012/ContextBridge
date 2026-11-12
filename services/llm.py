"""Google Gemini client configuration and embedding service."""

import asyncio

import google.generativeai as genai

from config import settings

EMBEDDING_MODEL = "models/text-embedding-004"

genai.configure(api_key=settings.GEMINI_API_KEY)


async def get_embedding(text: str) -> list[float]:
    """Generate a 768-dimensional embedding vector for the given text."""
    cleaned = text.strip()
    if not cleaned:
        raise ValueError("Cannot generate embedding for empty text.")

    response = await asyncio.to_thread(
        genai.embed_content,
        model=EMBEDDING_MODEL,
        content=cleaned,
    )
    return [float(value) for value in response["embedding"]]

