"""GitHub repository issue/PR ingestion service."""

from datetime import datetime, timezone

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from models import Source, SourceType
from services.llm import get_embedding
from services.storage import save_sources

GITHUB_API_BASE = "https://api.github.com"


def _parse_github_timestamp(raw_ts: str | None) -> datetime:
    """Parse an ISO-8601 GitHub timestamp string into a UTC-aware datetime."""
    if not raw_ts:
        return datetime.now(timezone.utc)
    parsed = datetime.fromisoformat(raw_ts)
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed


def _build_issue_content(title: str | None, body: str | None) -> str:
    """Combine a GitHub issue title and body into clean source content."""
    clean_title = (title or "").strip()
    clean_body = (body or "").strip()
    if clean_title and clean_body:
        return f"{clean_title}\n\n{clean_body}"
    return clean_title or clean_body


async def ingest_github_repo(
    repo_name: str,
    project_id: int,
    db_session: AsyncSession,
) -> list[Source]:
    """Fetch the 5 most recent issues/PRs from a GitHub repo and store embeddings."""
    normalized_repo = repo_name.strip().strip("/")
    if "/" not in normalized_repo or len(normalized_repo.split("/")) != 2:
        raise ValueError("repo_name must be in 'owner/repo' format.")

    url = f"{GITHUB_API_BASE}/repos/{normalized_repo}/issues"
    params = {
        "state": "all",
        "sort": "created",
        "direction": "desc",
        "per_page": 5,
    }
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "ContextBridge/0.1.0",
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(url, params=params, headers=headers)
        response.raise_for_status()
        issues = response.json()

    sources: list[Source] = []
    for item in issues[:5]:
        content = _build_issue_content(item.get("title"), item.get("body"))
        if not content:
            continue

        author = (item.get("user") or {}).get("login") or "unknown"
        timestamp = _parse_github_timestamp(item.get("created_at"))
        embedding = await get_embedding(content)

        sources.append(
            Source(
                project_id=project_id,
                type=SourceType.GITHUB_ISSUE,
                content=content,
                author=author,
                timestamp=timestamp,
                permissions=["public"],
                embedding=embedding,
            )
        )

    return await save_sources(db_session, sources)

