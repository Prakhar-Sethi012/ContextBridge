import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Layers,
  Sparkles,
  RefreshCw,
  Shield,
  FileCheck2,
} from 'lucide-react';

export default function TransitionBlueprint({
  claims = [],
  currentRole = 'project_head',
  onSelectClaim,
  onGenerateBlueprint,
  onSeedDatabase,
  isGenerating,
  isSeeding,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Filter claims based on search, type, and status
  const filteredClaims = useMemo(() => {
    return claims.filter((claim) => {
      const matchesSearch =
        searchQuery === '' ||
        claim.statement?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        claim.id?.toString().includes(searchQuery);

      const matchesType =
        selectedType === 'all' ||
        claim.claim_type?.toLowerCase() === selectedType.toLowerCase();

      const matchesStatus =
        selectedStatus === 'all' ||
        claim.status?.toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [claims, searchQuery, selectedType, selectedStatus]);

  // Status stats
  const stats = useMemo(() => {
    const verified = claims.filter((c) => c.status?.toLowerCase() === 'verified').length;
    const conflicted = claims.filter((c) => c.status?.toLowerCase() === 'conflicted').length;
    const stale = claims.filter((c) => c.status?.toLowerCase() === 'stale').length;
    const decisions = claims.filter((c) => c.claim_type?.toLowerCase() === 'decision').length;
    return { verified, conflicted, stale, decisions };
  }, [claims]);

  const getStatusBadge = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'verified') {
      return (
        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-300 font-mono text-[11px] font-bold uppercase px-2 py-0.5">
          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
          Verified
        </span>
      );
    }
    if (s === 'conflicted') {
      return (
        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-300 font-mono text-[11px] font-bold uppercase px-2 py-0.5">
          <AlertTriangle className="w-3 h-3 text-amber-700" />
          Conflicted
        </span>
      );
    }
    if (s === 'stale') {
      return (
        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 border border-gray-400 font-mono text-[11px] font-bold uppercase px-2 py-0.5">
          <AlertCircle className="w-3 h-3 text-gray-600" />
          Stale
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-300 font-mono text-[11px] font-bold uppercase px-2 py-0.5">
        <HelpCircle className="w-3 h-3 text-slate-500" />
        Unverified
      </span>
    );
  };

  const getClaimTypeBadge = (type) => {
    const t = String(type || '').toLowerCase();
    const map = {
      decision: { label: 'Decision', bg: 'bg-forest/10', text: 'text-forest', border: 'border-forest/40' },
      risk: { label: 'Risk', bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-300' },
      dependency: { label: 'Dependency', bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-300' },
      next_action: { label: 'Next Action', bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-300' },
    };
    const style = map[t] || { label: t || 'Claim', bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' };
    return (
      <span className={`inline-block font-mono text-[10px] font-bold uppercase px-2 py-0.5 border ${style.bg} ${style.text} ${style.border}`}>
        {style.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Context & Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-beige-border p-3.5 space-y-1">
          <span className="font-mono text-[11px] uppercase tracking-wider text-gray-500 font-semibold block">
            Total Claims ({currentRole === 'project_head' ? 'Full RBAC' : 'Public RBAC'})
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-forest">{claims.length}</span>
            <span className="text-xs font-mono text-gray-500">facts</span>
          </div>
        </div>

        <div className="bg-white border-2 border-beige-border p-3.5 space-y-1">
          <span className="font-mono text-[11px] uppercase tracking-wider text-emerald-800 font-semibold block">
            Verified Consensus
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-700">{stats.verified}</span>
            <span className="text-xs font-mono text-emerald-600">agreed</span>
          </div>
        </div>

        <div className="bg-white border-2 border-beige-border p-3.5 space-y-1">
          <span className="font-mono text-[11px] uppercase tracking-wider text-amber-800 font-semibold block">
            Conflicted Debates
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-700">{stats.conflicted}</span>
            <span className="text-xs font-mono text-amber-600">debated</span>
          </div>
        </div>

        <div className="bg-white border-2 border-beige-border p-3.5 space-y-1">
          <span className="font-mono text-[11px] uppercase tracking-wider text-gray-600 font-semibold block">
            Architectural Decisions
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-charcoal">{stats.decisions}</span>
            <span className="text-xs font-mono text-gray-500">recorded</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border-2 border-beige-border p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reconstructed knowledge claims..."
            className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-beige border border-beige-border focus:outline-none focus:border-forest text-charcoal placeholder-gray-400"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2">
          {/* Claim Type Filter */}
          <div className="flex items-center border border-beige-border bg-beige px-2.5 py-1.5 text-xs font-mono">
            <Filter className="w-3.5 h-3.5 text-gray-500 mr-1.5" />
            <span className="text-gray-500 mr-1.5 uppercase text-[10px]">Type:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-transparent text-charcoal font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="decision">Decisions</option>
              <option value="risk">Risks</option>
              <option value="dependency">Dependencies</option>
              <option value="next_action">Next Actions</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center border border-beige-border bg-beige px-2.5 py-1.5 text-xs font-mono">
            <span className="text-gray-500 mr-1.5 uppercase text-[10px]">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-charcoal font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="verified">Verified</option>
              <option value="conflicted">Conflicted</option>
              <option value="stale">Stale</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Claims List (Data-Dense Rows with Hard Borders) */}
      {filteredClaims.length === 0 ? (
        <div className="bg-white border-2 border-beige-border p-12 text-center space-y-4">
          <div className="w-12 h-12 bg-beige border border-beige-border flex items-center justify-center text-forest mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-mono font-bold text-sm uppercase tracking-wider text-forest">
              {claims.length === 0
                ? 'No Reconstructed Claims Available'
                : 'No Matching Claims Found'}
            </h3>
            <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
              {claims.length === 0
                ? `No knowledge claims have been extracted yet for Project #1 under role "${currentRole}". You can seed synthetic engineering sources and run the reconstruction engine below.`
                : 'Try adjusting your search terms or filters above to reveal matching claims.'}
            </p>
          </div>

          {claims.length === 0 && (
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={onSeedDatabase}
                disabled={isSeeding || isGenerating}
                className="bg-vibrant text-forest hover:bg-vibrant-hover px-4 py-2 font-mono text-xs uppercase font-bold tracking-wider border border-vibrant transition-fast flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
                <span>1. Seed Chat & Issues</span>
              </button>

              <button
                type="button"
                onClick={onGenerateBlueprint}
                disabled={isGenerating || isSeeding}
                className="bg-forest text-white hover:bg-forest-light px-4 py-2 font-mono text-xs uppercase font-bold tracking-wider border border-forest transition-fast flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>2. Run Gemini Extraction</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border-2 border-beige-border overflow-hidden">
          {/* Table Header */}
          <div className="bg-beige border-b-2 border-beige-border px-4 py-3 hidden md:grid md:grid-cols-12 gap-3 text-[11px] font-mono font-bold text-gray-600 uppercase tracking-wider">
            <div className="col-span-2">Type & ID</div>
            <div className="col-span-5">Statement / Reconstructed Fact</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1">Evidence</div>
            <div className="col-span-2 text-right">Verification</div>
          </div>

          {/* Claims Data Rows */}
          <div className="divide-y divide-beige-border">
            {filteredClaims.map((claim) => {
              const evidenceCount = (claim.evidences || []).length;
              return (
                <div
                  key={claim.id}
                  className="p-4 hover:bg-[#FAF8F5] transition-fast grid grid-cols-1 md:grid-cols-12 gap-3 items-start md:items-center"
                >
                  {/* Column 1: Type & Claim ID */}
                  <div className="md:col-span-2 flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-gray-400">
                      #{claim.id}
                    </span>
                    {getClaimTypeBadge(claim.claim_type)}
                  </div>

                  {/* Column 2: Statement */}
                  <div className="md:col-span-5 space-y-1">
                    <p className="text-xs font-semibold text-gray-900 leading-snug">
                      {claim.statement}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500">
                      <span>Clearance: <strong>{claim.required_role || 'Public'}</strong></span>
                      {claim.required_role === 'project_head' && (
                        <span className="inline-flex items-center gap-0.5 text-red-700 font-bold">
                          <Shield className="w-2.5 h-2.5" />
                          CONFIDENTIAL
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Column 3: Status Badge */}
                  <div className="md:col-span-2">
                    {getStatusBadge(claim.status)}
                  </div>

                  {/* Column 4: Evidence Count */}
                  <div className="md:col-span-1">
                    <span className="inline-flex items-center gap-1 font-mono text-xs text-gray-700 bg-beige px-2 py-0.5 border border-beige-border">
                      <FileCheck2 className="w-3 h-3 text-forest" />
                      <strong>{evidenceCount}</strong>
                    </span>
                  </div>

                  {/* Column 5: Action Button */}
                  <div className="md:col-span-2 flex justify-start md:justify-end">
                    <button
                      type="button"
                      onClick={() => onSelectClaim(claim)}
                      className="inline-flex items-center gap-1.5 bg-white hover:bg-forest text-forest hover:text-white border border-forest px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider transition-fast cursor-pointer"
                    >
                      <span>View Evidence</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

