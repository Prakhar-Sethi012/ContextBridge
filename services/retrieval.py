"""RBAC-enforced vector retrieval engine using pgvector."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import Source
from services.llm import get_embedding


async def retrieve_context(
    query: str,
    project_id: int,
    user_permissions: list[str],
    db_session: AsyncSession,
    limit: int = 15,
) -> list[Source]:
    """Retrieve the top matching sources filtered by project and RBAC permissions."""
    if not user_permissions:
        return []

    query_embedding = await get_embedding(query)

    stmt = (
        select(Source)
        .where(
            Source.project_id == project_id,
            Source.permissions.overlap(user_permissions),
            Source.embedding.is_not(None),
        )
        .order_by(Source.embedding.cosine_distance(query_embedding))
        .limit(limit)
    )
    result = await db_session.execute(stmt)
    return list(result.scalars().all())

