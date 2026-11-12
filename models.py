"""SQLAlchemy ORM models for ContextBridge."""

from datetime import datetime
from enum import Enum as PyEnum
from typing import Optional

from pgvector.sqlalchemy import Vector
from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class SourceType(str, PyEnum):
    """Supported ingestion source types."""

    GITHUB_PR = "github_pr"
    GITHUB_ISSUE = "github_issue"
    CHAT = "chat"


class ClaimType(str, PyEnum):
    """Categories of extracted knowledge claims."""

    DECISION = "decision"
    RISK = "risk"
    DEPENDENCY = "dependency"
    NEXT_ACTION = "next_action"


class ClaimStatus(str, PyEnum):
    """Verification lifecycle states for a knowledge claim."""

    VERIFIED = "verified"
    CONFLICTED = "conflicted"
    STALE = "stale"
    UNVERIFIED = "unverified"


class DecisionStatus(str, PyEnum):
    """Lifecycle states for a project decision."""

    PROPOSED = "proposed"
    APPROVED = "approved"
    REJECTED = "rejected"
    SUPERSEDED = "superseded"


def _str_enum(enum_cls: type[PyEnum], name: str) -> SAEnum:
    """Build a non-native string Enum column storing lowercase enum values."""
    return SAEnum(
        enum_cls,
        name=name,
        native_enum=False,
        create_constraint=True,
        values_callable=lambda obj: [member.value for member in obj],
        length=50,
    )


class Project(Base):
    """Represents a tracked project whose state is reconstructed."""

    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    sources: Mapped[list["Source"]] = relationship(
        back_populates="project",
        cascade="all, delete-orphan",
    )
    knowledge_claims: Mapped[list["KnowledgeClaim"]] = relationship(
        back_populates="project",
        cascade="all, delete-orphan",
    )
    decisions: Mapped[list["Decision"]] = relationship(
        back_populates="project",
        cascade="all, delete-orphan",
    )


class Source(Base):
    """Raw communication or artifact ingested into a project."""

    __tablename__ = "sources"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    type: Mapped[SourceType] = mapped_column(
        _str_enum(SourceType, "source_type"),
        nullable=False,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    author: Mapped[str] = mapped_column(String(255), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    permissions: Mapped[list[str]] = mapped_column(
        ARRAY(String),
        nullable=False,
        default=list,
    )
    embedding: Mapped[Optional[list[float]]] = mapped_column(
        Vector(768),
        nullable=True,
    )

    project: Mapped["Project"] = relationship(back_populates="sources")
    claim_evidences: Mapped[list["ClaimEvidence"]] = relationship(
        back_populates="source",
        cascade="all, delete-orphan",
    )


class KnowledgeClaim(Base):
    """Structured claim extracted from one or more project sources."""

    __tablename__ = "knowledge_claims"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    claim_type: Mapped[ClaimType] = mapped_column(
        _str_enum(ClaimType, "claim_type"),
        nullable=False,
    )
    statement: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[ClaimStatus] = mapped_column(
        _str_enum(ClaimStatus, "claim_status"),
        nullable=False,
        default=ClaimStatus.UNVERIFIED,
    )
    required_role: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    project: Mapped["Project"] = relationship(back_populates="knowledge_claims")
    evidences: Mapped[list["ClaimEvidence"]] = relationship(
        back_populates="claim",
        cascade="all, delete-orphan",
    )


class ClaimEvidence(Base):
    """Mapping table linking knowledge claims to supporting sources."""

    __tablename__ = "claim_evidences"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    claim_id: Mapped[int] = mapped_column(
        ForeignKey("knowledge_claims.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    source_id: Mapped[int] = mapped_column(
        ForeignKey("sources.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    claim: Mapped["KnowledgeClaim"] = relationship(back_populates="evidences")
    source: Mapped["Source"] = relationship(back_populates="claim_evidences")


class Decision(Base):
    """Formal or inferred architectural/project decision record."""

    __tablename__ = "decisions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[DecisionStatus] = mapped_column(
        _str_enum(DecisionStatus, "decision_status"),
        nullable=False,
        default=DecisionStatus.PROPOSED,
    )
    rationale: Mapped[str] = mapped_column(Text, nullable=False, default="")

    project: Mapped["Project"] = relationship(back_populates="decisions")

