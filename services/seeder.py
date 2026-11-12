"""Synthetic chat seeder demonstrating conflict resolution and RBAC filtering."""

from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from models import Source, SourceType
from services.llm import get_embedding
from services.storage import save_sources

SYNTHETIC_CHAT_MESSAGES: list[dict[str, object]] = [
    {
        "author": "Rahul",
        "content": "Let's use PostgreSQL for the main database.",
        "permissions": ["public"],
        "offset_minutes": -60,
    },
    {
        "author": "Aarav",
        "content": "I think MongoDB might be easier for handling the event metadata.",
        "permissions": ["public"],
        "offset_minutes": -45,
    },
    {
        "author": "Rahul",
        "content": "Let's keep PostgreSQL. We need relational consistency.",
        "permissions": ["public"],
        "offset_minutes": -30,
    },
    {
        "author": "Priya",
        "content": "The AWS deployment credentials are in the .env file I sent to Rahul.",
        "permissions": ["project_head", "board_member"],
        "offset_minutes": -15,
    },
    {
        "author": "Meera",
        "content": (
            "Next action: Aarav will finish the Alembic migration scripts once the "
            "pgvector schema is frozen; risk: staging deploy is blocked until Redis "
            "rate-limiting dependency is configured."
        ),
        "permissions": ["public"],
        "offset_minutes": -5,
    },
]


async def seed_synthetic_chat(
    project_id: int,
    db_session: AsyncSession,
) -> list[Source]:
    """Seed synthetic chat messages with embeddings into the Source table."""
    base_time = datetime.now(timezone.utc)
    sources: list[Source] = []

    for msg in SYNTHETIC_CHAT_MESSAGES:
        content = str(msg["content"])
        author = str(msg["author"])
        permissions = list(msg["permissions"])  # type: ignore[arg-type]
        offset = int(msg["offset_minutes"])  # type: ignore[call-overload]
        embedding = await get_embedding(content)

        sources.append(
            Source(
                project_id=project_id,
                type=SourceType.CHAT,
                content=content,
                author=author,
                timestamp=base_time + timedelta(minutes=offset),
                permissions=permissions,
                embedding=embedding,
            )
        )

    return await save_sources(db_session, sources)

