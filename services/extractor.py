"""Groq-powered knowledge extraction and verification engine."""

import json
import re
from enum import Enum
from typing import Any, TypeVar

import httpx
from sqlalchemy import ColumnElement, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models import ClaimEvidence, ClaimStatus, ClaimType, KnowledgeClaim, Source
from services.retrieval import retrieve_context

ROLE_PERMISSIONS: dict[str, list[str]] = {
    "project_head": ["public", "project_head", "board_member"],
    "junior_dev": ["public"],
}

DEFAULT_EXTRACTION_QUERY = (
    "Project architecture decisions, unresolved issues, dependencies, "
    "AWS credentials, and risks."
)


def get_permissions_for_role(role: str) -> list[str]:
    """Resolve allowed source permissions for a given role."""
    if role not in ROLE_PERMISSIONS:
        allowed = ", ".join(sorted(ROLE_PERMISSIONS))
        raise ValueError(f"Unsupported role '{role}'. Expected one of: {allowed}.")
    return ROLE_PERMISSIONS[role]


def _format_sources_block(sources: list[Source]) -> str:
    """Format retrieved sources into a structured prompt block with IDs and timestamps."""
    formatted_items: list[str] = []
    for src in sources:
        src_type = src.type.value if hasattr(src.type, "value") else str(src.type)
        ts = src.timestamp.isoformat() if src.timestamp else "unknown"
        formatted_items.append(
            f"[Source ID: {src.id}] | Type: {src_type} | Author: {src.author} | Timestamp: {ts}\n"
            f"Content: {src.content}"
        )
    return "\n\n---\n\n".join(formatted_items)


_EnumT = TypeVar("_EnumT", bound=Enum)


def _coerce_enum(
    raw_value: Any,
    enum_cls: type[_EnumT],
    default: _EnumT | None = None,
) -> _EnumT | None:
    """Parse a raw string into an enum value, returning default when invalid."""
    if not isinstance(raw_value, str):
        return default
    try:
        return enum_cls(raw_value.strip().lower())
    except ValueError:
        return default


def _extract_valid_source_ids(raw_ids: Any, allowed_ids: set[int]) -> list[int]:
    """Deduplicate and filter source_ids to those actually retrieved."""
    if not isinstance(raw_ids, list):
        return []
    seen: set[int] = set()
    valid: list[int] = []
    for raw_id in raw_ids:
        try:
            sid = int(raw_id)
        except (TypeError, ValueError):
            continue
        if sid in allowed_ids and sid not in seen:
            seen.add(sid)
            valid.append(sid)
    return valid


async def _fetch_claims_with_evidence(
    db_session: AsyncSession,
    *filters: ColumnElement[bool],
) -> list[KnowledgeClaim]:
    """Fetch KnowledgeClaim records matching filters with nested evidence sources."""
    stmt = (
        select(KnowledgeClaim)
        .where(*filters)
        .options(
            selectinload(KnowledgeClaim.evidences).selectinload(ClaimEvidence.source)
        )
        .order_by(KnowledgeClaim.id.asc())
    )
    result = await db_session.execute(stmt)
    return list(result.scalars().all())


async def get_handover_claims(
    project_id: int,
    role: str,
    db_session: AsyncSession,
) -> list[KnowledgeClaim]:
    """Fetch persisted knowledge claims with eagerly loaded evidence and sources."""
    return await _fetch_claims_with_evidence(
        db_session,
        KnowledgeClaim.project_id == project_id,
        KnowledgeClaim.required_role == role,
    )
import os
async def generate_handover(
    project_id: int,
    role: str,
    db_session: AsyncSession,
    custom_text: str = None  # NEW: Allows live frontend text injection!
) -> list[KnowledgeClaim]:
    """Retrieve context (or use custom text), extract claims via Groq API, and persist."""
    import os
    
    # 1. BULLETPROOF API KEY LOADING (Reads .env directly if os.environ misses it)
    groq_key = os.environ.get("GROQ_API_KEY")
    if not groq_key:
        try:
            with open(".env", "r") as f:
                for line in f:
                    if line.startswith("GROQ_API_KEY="):
                        groq_key = line.split("=", 1)[1].strip().strip('"').strip("'")
        except Exception:
            pass
            
    if not groq_key:
        print("\n[ERROR] GROQ_API_KEY not found! Please add it to your .env file.\n")
        return []

    # 2. INTERACTIVE SANDBOX LOGIC
    if custom_text:
        context_block = custom_text
        sources = []
        valid_source_ids = set()
    else:
        user_permissions = get_permissions_for_role(role)
        sources = await retrieve_context(
            query=DEFAULT_EXTRACTION_QUERY,
            project_id=project_id,
            user_permissions=user_permissions,
            db_session=db_session,
        )
        if not sources:
            return []
        context_block = _format_sources_block(sources)
        valid_source_ids = {s.id for s in sources if s.id is not None}

    system_prompt = (
        "You are ContextBridge, a project state reconstruction and verification engine.\n"
        "Analyze the project sources carefully.\n\n"
        "Extract structured knowledge claims. You MUST respond in JSON format, providing a single "
        "JSON object with a key 'claims' containing an array of objects. Each object must have these keys:\n"
        '- "claim_type": "decision", "risk", "dependency", or "next_action"\n'
        '- "statement": concise factual summary of the claim\n'
        '- "status": "verified", "conflicted", or "stale"\n'
        '- "source_ids": array of integer Source IDs from the provided sources that support this claim'
    )
    
    user_prompt = f"Sources:\n{context_block}"

    api_url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {groq_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "openai/gpt-oss-20b",  # <-- Update to the active developer tier model
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.1
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.post(api_url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            raw_text = data["choices"][0]["message"]["content"].strip()
            
            # 3. BULLETPROOF JSON STRIPPING
            if raw_text.startswith("```json"):
                raw_text = raw_text.split("```json")[1].split("```")[0].strip()
            elif raw_text.startswith("```"):
                raw_text = raw_text.split("```")[1].strip()
                
            claims_data = json.loads(raw_text).get("claims", [])
            
        except Exception as e:
            print(f"\n[GROQ API OR PARSE ERROR] {e}")
            claims_data = []
    
    created_claim_ids: list[int] = []
    created_claims: list[KnowledgeClaim] = []
    
    for item in claims_data:
        claim_type = _coerce_enum(item.get("claim_type"), ClaimType)
        statement = str(item.get("statement") or "").strip()
        if claim_type is None or not statement:
            continue

        claim_status = (
            _coerce_enum(item.get("status"), ClaimStatus, ClaimStatus.UNVERIFIED)
            or ClaimStatus.UNVERIFIED
        )
        
        claim = KnowledgeClaim(
            project_id=project_id,
            claim_type=claim_type,
            statement=statement,
            status=claim_status,
            required_role=role
        )
        db_session.add(claim)
        await db_session.flush()
        
        s_ids = _extract_valid_source_ids(item.get("source_ids", []), valid_source_ids)
        for sid in s_ids:
            evidence = ClaimEvidence(claim_id=claim.id, source_id=sid)
            db_session.add(evidence)
            
        if claim.id is not None:
            created_claim_ids.append(claim.id)
        created_claims.append(claim)
        
    await db_session.commit()
    
    if not created_claim_ids:
        return created_claims
        
    return await _fetch_claims_with_evidence(
        db_session,
        KnowledgeClaim.id.in_(created_claim_ids),
    )