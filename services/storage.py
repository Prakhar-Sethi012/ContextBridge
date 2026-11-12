"""Shared database persistence helpers for ingestion services."""

from sqlalchemy.ext.asyncio import AsyncSession

from models import Source


async def save_sources(db_session: AsyncSession, sources: list[Source]) -> list[Source]:
    """Persist Source rows, commit the transaction, and refresh generated fields."""
    if not sources:
        return []

    db_session.add_all(sources)
    await db_session.commit()
    for source in sources:
        await db_session.refresh(source)
    return sources

