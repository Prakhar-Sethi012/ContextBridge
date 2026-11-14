"""FastAPI application entry point for ContextBridge."""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional

import httpx
from fastapi import Body, Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

import models  # noqa: F401 - register ORM models with Base.metadata
from database import Base, engine, get_db
from models import ClaimStatus, ClaimType, SourceType
from services.analytics import calculate_bus_factor
from services.extractor import generate_handover, get_handover_claims
from services.github import ingest_github_repo
from services.seeder import seed_synthetic_chat


class GitHubIngestRequest(BaseModel):
    """Payload for ingesting issues/PRs from a GitHub repository."""

    repo_name: str = Field(..., min_length=3, examples=["tiangolo/fastapi"])
    project_id: int = Field(..., gt=0)


class SeedChatRequest(BaseModel):
    """Payload for seeding synthetic chat sources into a project."""

    project_id: int = Field(..., gt=0)


class IngestionResponse(BaseModel):
    """Summary returned after an ingestion or seeding operation."""

    status: str
    project_id: int
    ingested_count: int
    source_ids: list[int]


class HandoverGenerateRequest(BaseModel):
    """Payload for generating RBAC-scoped handover claims."""

    project_id: int = Field(..., gt=0)
    role: str = Field(..., min_length=1, examples=["project_head", "junior_dev"])


class EvidenceSourceOut(BaseModel):
    """Supporting source snippet linked to a knowledge claim."""

    id: int
    type: SourceType
    content: str
    author: str
    timestamp: datetime
    permissions: list[str]

    model_config = ConfigDict(from_attributes=True)


class ClaimEvidenceOut(BaseModel):
    """Evidence link pairing a knowledge claim with its source record."""

    id: int
    source_id: int
    source: EvidenceSourceOut

    model_config = ConfigDict(from_attributes=True)


class KnowledgeClaimOut(BaseModel):
    """Extracted knowledge claim with nested supporting evidence."""

    id: int
    project_id: int
    claim_type: ClaimType
    statement: str
    status: ClaimStatus
    required_role: Optional[str] = None
    evidences: list[ClaimEvidenceOut] = []

    model_config = ConfigDict(from_attributes=True)


class HandoverResponse(BaseModel):
    """Handover state payload containing extracted claims and evidence."""

    project_id: int
    role: str
    count: int
    claims: list[KnowledgeClaimOut]


class BusFactorDomainOut(BaseModel):
    """Knowledge continuity risk summary for a single domain."""

    domain: str
    primary_holder: str
    risk_level: str
    unique_contributors: int


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None, None]:
    """Ensure pgvector extension exists and create database tables on startup."""
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        await conn.run_sync(Base.metadata.create_all)
        res = await conn.execute(text("SELECT id FROM projects WHERE id = 1;"))
        if not res.scalar():
            await conn.execute(
                text("INSERT INTO projects (id, name) VALUES (1, 'ContextBridge Demo') ON CONFLICT (id) DO NOTHING;")
            )
    try:
        yield
    finally:
        await engine.dispose()


app = FastAPI(
    title="ContextBridge",
    description="Project state reconstruction engine",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["Health"])
async def health_check() -> dict[str, str]:
    """Return service health status."""
    return {"status": "ok", "service": "ContextBridge"}


@app.post(
    "/api/ingest/github",
    response_model=IngestionResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Ingestion"],
)
async def ingest_github_endpoint(
    payload: GitHubIngestRequest,
    db: AsyncSession = Depends(get_db),
) -> IngestionResponse:
    """Fetch recent GitHub issues/PRs, embed them, and save them as Sources."""
    try:
        sources = await ingest_github_repo(
            repo_name=payload.repo_name,
            project_id=payload.project_id,
            db_session=db,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except httpx.HTTPStatusError as exc:
        upstream_status = exc.response.status_code
        http_status = (
            status.HTTP_404_NOT_FOUND
            if upstream_status == status.HTTP_404_NOT_FOUND
            else status.HTTP_502_BAD_GATEWAY
        )
        raise HTTPException(
            status_code=http_status,
            detail=f"GitHub API returned status {upstream_status}.",
        ) from exc
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to connect to GitHub API: {exc}",
        ) from exc
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {payload.project_id} not found.",
        ) from exc

    return IngestionResponse(
        status="ingested",
        project_id=payload.project_id,
        ingested_count=len(sources),
        source_ids=[source.id for source in sources if source.id is not None],
    )


@app.post(
    "/api/seed/chat",
    response_model=IngestionResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Ingestion"],
)
async def seed_chat_endpoint(
    payload: SeedChatRequest | None = Body(default=None),
    project_id: int | None = Query(default=None, gt=0),
    db: AsyncSession = Depends(get_db),
) -> IngestionResponse:
    """Seed synthetic chat messages with embeddings into a project."""
    resolved_project_id = payload.project_id if payload is not None else project_id
    if resolved_project_id is None:
        raise HTTPException(
            status_code=422,
            detail="project_id is required either in the JSON body or as a query parameter.",
        )

    try:
        sources = await seed_synthetic_chat(
            project_id=resolved_project_id,
            db_session=db,
        )
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {resolved_project_id} not found.",
        ) from exc

    return IngestionResponse(
        status="seeded",
        project_id=resolved_project_id,
        ingested_count=len(sources),
        source_ids=[source.id for source in sources if source.id is not None],
    )


@app.post(
    "/api/handover/generate",
    response_model=HandoverResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Handover"],
)
async def generate_handover_endpoint(
    payload: HandoverGenerateRequest,
    db: AsyncSession = Depends(get_db),
) -> HandoverResponse:
    """Generate and persist RBAC-filtered handover claims using Gemini."""
    try:
        claims = await generate_handover(
            project_id=payload.project_id,
            role=payload.role,
            db_session=db,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {payload.project_id} not found.",
        ) from exc

    return HandoverResponse(
        project_id=payload.project_id,
        role=payload.role,
        count=len(claims),
        claims=[KnowledgeClaimOut.model_validate(claim) for claim in claims],
    )


@app.get(
    "/api/handover/{project_id}",
    response_model=list[KnowledgeClaimOut],
    tags=["Handover"],
)
async def get_handover_endpoint(
    project_id: int,
    role: str = Query(..., min_length=1, examples=["project_head", "junior_dev"]),
    db: AsyncSession = Depends(get_db),
) -> list[KnowledgeClaimOut]:
    """Return persisted handover claims and nested source evidence for a role."""
    claims = await get_handover_claims(
        project_id=project_id,
        role=role,
        db_session=db,
    )
    return [KnowledgeClaimOut.model_validate(claim) for claim in claims]


@app.get(
    "/api/analytics/bus-factor/{project_id}",
    response_model=list[BusFactorDomainOut],
    tags=["Analytics"],
)
async def get_bus_factor_endpoint(
    project_id: int,
    db: AsyncSession = Depends(get_db),
) -> list[BusFactorDomainOut]:
    """Compute and return bus-factor risk metrics across project domains."""
    results = await calculate_bus_factor(
        project_id=project_id,
        db_session=db,
    )
    return [BusFactorDomainOut(**item) for item in results]
