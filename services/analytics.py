"""Knowledge continuity and bus-factor analytics service."""

from collections import Counter

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import Source

DOMAIN_KEYWORDS: dict[str, tuple[str, ...]] = {
    "Database": ("postgres", "mongo", "database"),
    "Deployment": ("aws", "deploy", ".env", "credentials"),
    "Authentication": ("auth", "login", "token"),
}


def _classify_risk(unique_contributors: int) -> str:
    """Map contributor count to a bus-factor risk level."""
    if unique_contributors <= 1:
        return "High Risk"
    if unique_contributors == 2:
        return "Medium Risk"
    return "Low Risk"


async def calculate_bus_factor(
    project_id: int,
    db_session: AsyncSession,
) -> list[dict[str, object]]:
    """Compute domain-level bus-factor risk metrics from project sources."""
    stmt = select(Source).where(Source.project_id == project_id)
    result = await db_session.execute(stmt)
    sources = list(result.scalars().all())

    domain_counts: dict[str, Counter[str]] = {
        domain: Counter() for domain in DOMAIN_KEYWORDS
    }

    for source in sources:
        content = (source.content or "").lower()
        author = (source.author or "").strip() or "unknown"
        for domain, keywords in DOMAIN_KEYWORDS.items():
            if any(keyword in content for keyword in keywords):
                domain_counts[domain][author] += 1

    summary: list[dict[str, object]] = []
    for domain, counts in domain_counts.items():
        unique_contributors = len(counts)
        primary_holder = counts.most_common(1)[0][0] if counts else "None"
        summary.append(
            {
                "domain": domain,
                "primary_holder": primary_holder,
                "risk_level": _classify_risk(unique_contributors),
                "unique_contributors": unique_contributors,
            }
        )

    return summary

