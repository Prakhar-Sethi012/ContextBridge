import React, { useState } from 'react';
import {
  FlaskConical,
  Play,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  Layers,
  Copy,
  Check,
  Code2,
  Cpu,
  FileCode2,
} from 'lucide-react';
import { runSandboxExtraction } from '../api';

const MOCK_SCRIPTS = [
  {
    id: 'db-migration',
    name: 'Database Migration Dispute',
    domain: 'Database & Infrastructure',
    description: 'PostgreSQL vs DynamoDB dispute, PgBouncer sidecar requirement, and pgvector HNSW index incompatibility.',
    text: `[2026-10-14 09:15:22] Vikram (Tech Lead): Team, we need to finalize the database migration plan from DynamoDB to PostgreSQL with pgvector before Sprint 24.
[2026-10-14 09:18:04] Rahul (Senior Backend): I've prepared the schema. We're migrating the user session store and vector embeddings to PostgreSQL. However, Priya raised concerns about connection pooling bottlenecks under 50k concurrent writes.
[2026-10-14 09:22:15] Priya (DevOps): Exactly. PgBouncer is mandatory in transaction pooling mode. If we migrate without connection pooling, the DB cluster will crash on peak traffic.
[2026-10-14 09:30:40] Vikram (Tech Lead): Decision: We will migrate to PostgreSQL 16 on AWS RDS with pgvector, but PgBouncer must be deployed and load-tested first. Target migration cutoff is Friday midnight.
[2026-10-14 09:32:10] Rahul (Senior Backend): Dependency: Priya needs to provision the PgBouncer Kubernetes sidecars by Wednesday before we begin migration staging.
[2026-10-14 09:35:50] Priya (DevOps): Conflicted: AWS RDS PostgreSQL 16 does not support the pgvector 0.7 HNSW index configuration we wanted. Vikram says proceed with RDS, but Rahul's benchmark shows index builds will time out without HNSW.`,
  },
  {
    id: 'security-risk',
    name: 'Unresolved Security Risk',
    domain: 'Authentication & Security',
    description: 'Gateway JWT expiration bypass, Auth0 rate limiting fallout, mTLS mandate, and mobile session invalidation risk.',
    text: `[2026-10-18 14:02:11] Sarah (Security Lead): Urgent: I just audited the internal API gateway. The JWT verification middleware is currently skipping token expiration checks on \`/api/internal/*\` routes!
[2026-10-18 14:05:30] Alex (Backend Dev): That was temporarily added during last week's staging outage because Auth0 rate-limited our background worker tokens.
[2026-10-18 14:08:45] Sarah (Security Lead): Risk: This is a critical security vulnerability. If any internal endpoint is exposed via ingress misconfiguration, arbitrary expired tokens will be accepted indefinitely.
[2026-10-18 14:12:00] Elena (Engineering Manager): Decision: Re-enable strict token expiration checks immediately and deploy an mTLS layer between internal microservices.
[2026-10-18 14:15:20] Alex (Backend Dev): Next Action: I will rotate all signing keys and push hotfix PR #142 to staging within 2 hours.
[2026-10-18 14:18:10] Sarah (Security Lead): Conflicted: Rotating signing keys immediately will invalidate active mobile client sessions unless we support dual-key verification during a 24-hour rollover grace period.`,
  },
  {
    id: 'frontend-arch',
    name: 'Frontend Architecture Shift',
    domain: 'Frontend & Build System',
    description: 'CRA to Vite + Tailwind migration, Rollup bundling, Webpack polyfill deprecation, and CSS Modules breakage.',
    text: `[2026-10-22 11:00:35] Dave (Frontend Lead): We're seeing 4.2MB client bundle sizes because of legacy Create React App and heavy charting dependencies. We need to migrate to Vite + Tailwind v3.
[2026-10-22 11:04:12] Maya (UI Engineer): Agreed. I've benchmarked Vite with Rollup code-splitting. Cold builds drop from 45s to 1.8s. But what about our custom Webpack polyfills for Buffer and crypto?
[2026-10-22 11:07:55] Dave (Frontend Lead): Decision: We are deprecating client-side crypto operations and offloading all cryptographic verification to the \`/api/verify\` backend endpoint. Vite migration is approved.
[2026-10-22 11:11:30] Maya (UI Engineer): Next Action: I will install \`vite-plugin-node-polyfills\` for backward compatibility during the 2-week transition window.
[2026-10-22 11:15:00] Dave (Frontend Lead): Risk: Any legacy classnames relying on CSS Modules will silently break once we adopt pure Tailwind utility classes. All PRs must verify zero CSS module regressions.`,
  },
];

export default function InteractiveSandbox({
  currentRole = 'project_head',
  projectId = 1,
  onApplyToBlueprint,
}) {
  const [selectedScriptId, setSelectedScriptId] = useState(MOCK_SCRIPTS[0].id);
  const [scriptContent, setScriptContent] = useState(MOCK_SCRIPTS[0].text);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedClaims, setExtractedClaims] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [hasCopied, setHasCopied] = useState(false);

  // Handle switching mock scripts
  const handleSelectScript = (scriptId) => {
    setSelectedScriptId(scriptId);
    const found = MOCK_SCRIPTS.find((s) => s.id === scriptId);
    if (found) {
      setScriptContent(found.text);
      setErrorMessage(null);
    }
  };

  // Reset current script to its original content
  const handleResetToTemplate = () => {
    const found = MOCK_SCRIPTS.find((s) => s.id === selectedScriptId);
    if (found) {
      setScriptContent(found.text);
    }
  };

  // Run Extraction via API call
  const handleRunExtraction = async () => {
    if (!scriptContent.trim()) {
      setErrorMessage('Please enter or select a chat script before running extraction.');
      return;
    }

    setIsExtracting(true);
    setErrorMessage(null);

    try {
      // POST to /api/handover/generate with { role: "project_head", custom_text: <textarea_state> }
      const res = await runSandboxExtraction(scriptContent, currentRole, projectId);
      const claimsList = Array.isArray(res) ? res : (res.claims || []);
      setExtractedClaims(claimsList);

      if (onApplyToBlueprint && typeof onApplyToBlueprint === 'function') {
        onApplyToBlueprint(claimsList);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Extraction failed. Ensure the backend server is running.');
    } finally {
      setIsExtracting(false);
    }
  };

  // Copy raw output
  const handleCopyJson = () => {
    if (!extractedClaims) return;
    navigator.clipboard.writeText(JSON.stringify(extractedClaims, null, 2));
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  // Badges styling (matching TransitionBlueprint design constraints)
  const getClaimTypeBadge = (type) => {
    const t = String(type || '').toLowerCase();
    const map = {
      decision: { label: 'Decision', bg: 'bg-forest/10', text: 'text-forest', border: 'border-forest/40' },
      risk: { label: 'Risk', bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-300' },
      dependency: { label: 'Dependency', bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-300' },
      next_action: { label: 'Next Action', bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-300' },
    };
    const badge = map[t] || { label: type || 'Claim', bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' };

    return (
      <span className={`inline-block font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border ${badge.bg} ${badge.text} ${badge.border}`}>
        {badge.label}
      </span>
    );
  };

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

  const selectedPreset = MOCK_SCRIPTS.find((s) => s.id === selectedScriptId);
  const lineCount = scriptContent.split('\n').length;
  const charCount = scriptContent.length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Context */}
      <div className="bg-white border-2 border-beige-border p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-forest text-vibrant font-mono text-[10px] font-bold uppercase px-2 py-0.5 tracking-wider border border-forest">
                Interactive Sandbox
              </span>
              <span className="text-gray-400 font-mono text-xs">•</span>
              <span className="text-xs font-mono text-gray-600">
                Live State Reconstruction Playground
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 font-sans tracking-tight">
              Real-Time Knowledge Extraction Sandbox
            </h2>
            <p className="text-xs font-mono text-gray-600 leading-relaxed max-w-4xl">
              Simulate uncommitted engineering chats, PR disputes, and architecture decisions. Select a pre-written developer script below or edit it live, then click <strong className="text-forest">Run Extraction</strong> to see structured decisions, conflicts, and risks parsed in real-time.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right font-mono text-xs">
              <div className="text-gray-500 text-[10px] uppercase tracking-wider">Target Role</div>
              <div className="font-bold text-forest uppercase">{currentRole}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div className="bg-red-50 border-2 border-red-700 p-4 flex items-start gap-3 text-red-900 font-mono text-xs">
          <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold uppercase tracking-wider block">Extraction Error:</span>
            <p className="leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Split-Pane Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANE: Input (7 cols on desktop) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white border-2 border-beige-border flex flex-col h-full">
            {/* Left Pane Header with Dropdown */}
            <div className="p-4 bg-beige-dark border-b-2 border-beige-border space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-forest" />
                  <span className="font-mono text-xs font-bold text-forest uppercase tracking-wider">
                    Raw Chat Input Script
                  </span>
                </div>
                <div className="font-mono text-[11px] text-gray-500">
                  {lineCount} lines • {charCount} chars
                </div>
              </div>

              {/* Script Selector Dropdown */}
              <div className="relative">
                <label htmlFor="script-select" className="sr-only">Select Mock Script</label>
                <select
                  id="script-select"
                  value={selectedScriptId}
                  onChange={(e) => handleSelectScript(e.target.value)}
                  className="w-full bg-white border-2 border-forest text-forest font-mono text-xs py-2 px-3 pr-8 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-vibrant font-medium"
                >
                  {MOCK_SCRIPTS.map((script) => (
                    <option key={script.id} value={script.id} className="py-1">
                      {script.name} ({script.domain})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-forest absolute right-2.5 top-2.5 pointer-events-none" />
              </div>

              {selectedPreset && (
                <div className="text-[11px] font-mono text-gray-600 bg-white border border-beige-border px-2.5 py-1.5 flex items-center justify-between gap-2">
                  <span className="truncate">{selectedPreset.description}</span>
                  <button
                    type="button"
                    onClick={handleResetToTemplate}
                    title="Reset to script template"
                    className="inline-flex items-center gap-1 text-forest hover:text-black shrink-0 font-bold uppercase text-[10px] cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                </div>
              )}
            </div>

            {/* Large Editable Textarea */}
            <div className="p-4 flex-1 flex flex-col">
              <textarea
                value={scriptContent}
                onChange={(e) => setScriptContent(e.target.value)}
                placeholder="Type or paste engineering chat logs, PR reviews, or Slack threads here..."
                rows={18}
                className="w-full flex-1 bg-white border-2 border-beige-border focus:border-forest text-gray-900 font-mono text-xs leading-relaxed p-3.5 focus:outline-none transition-fast resize-y min-h-[380px]"
                spellCheck={false}
              />

              <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-beige-border">
                <span className="text-[11px] font-mono text-gray-500">
                  Direct live edit enabled. Changes will be reflected in LLM extraction.
                </span>

                {/* Primary Action Button */}
                <button
                  type="button"
                  onClick={handleRunExtraction}
                  disabled={isExtracting}
                  className={`cursor-pointer inline-flex items-center justify-center gap-2 px-5 py-2.5 border-2 border-forest font-mono text-xs font-bold uppercase tracking-wider transition-fast ${
                    isExtracting
                      ? 'bg-beige-dark text-gray-500 border-gray-400 cursor-not-allowed'
                      : 'bg-vibrant text-forest hover:bg-[#00c967] active:translate-y-0.5'
                  }`}
                >
                  {isExtracting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-forest border-t-transparent animate-spin" />
                      <span>Extracting Claims...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Run Extraction</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANE: Output (6 cols on desktop) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white border-2 border-beige-border flex flex-col h-full min-h-[520px]">
            {/* Right Pane Header */}
            <div className="p-4 bg-beige-dark border-b-2 border-beige-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-forest" />
                <span className="font-mono text-xs font-bold text-forest uppercase tracking-wider">
                  Extracted Knowledge Claims
                </span>
                {extractedClaims && (
                  <span className="bg-forest text-vibrant font-mono text-[10px] font-bold px-2 py-0.2 border border-forest">
                    {extractedClaims.length}
                  </span>
                )}
              </div>

              {extractedClaims && extractedClaims.length > 0 && (
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-gray-600 hover:text-forest uppercase bg-white border border-beige-border px-2 py-1 cursor-pointer transition-fast"
                >
                  {hasCopied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-700" />
                      <span>Copied JSON</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Right Pane Body: Loading vs Empty vs Claims List */}
            <div className="p-4 flex-1 overflow-y-auto">
              {isExtracting ? (
                /* Visual Loading State */
                <div className="h-full min-h-[380px] flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-forest text-vibrant border-2 border-forest flex items-center justify-center animate-pulse">
                      <Sparkles className="w-6 h-6 stroke-[2]" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-vibrant border border-forest animate-ping" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-mono font-bold text-forest text-sm uppercase tracking-wider">
                      Reconstructing Conversation Memory...
                    </h3>
                    <p className="text-xs font-mono text-gray-500 max-w-sm">
                      Executing LLM knowledge extraction prompt. Identifying architecture decisions, risks, dependencies, and conflicts from raw input.
                    </p>
                  </div>
                </div>
              ) : extractedClaims === null ? (
                /* Awaiting Run State */
                <div className="h-full min-h-[380px] flex flex-col items-center justify-center p-8 text-center space-y-4 text-gray-500">
                  <div className="w-12 h-12 bg-beige border-2 border-beige-border flex items-center justify-center text-forest">
                    <FlaskConical className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5 max-w-md">
                    <h3 className="font-mono font-bold text-forest text-sm uppercase tracking-wider">
                      Sandbox Ready For Extraction
                    </h3>
                    <p className="text-xs font-mono text-gray-600 leading-relaxed">
                      Select a script on the left (or type your own custom conversation) and click <strong className="text-forest uppercase">"Run Extraction"</strong>. Structured decisions, risks, and conflicted statements will populate here.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center gap-2 text-[10px] font-mono text-gray-500 bg-beige-dark border border-beige-border px-3 py-1.5">
                    <Cpu className="w-3.5 h-3.5 text-forest" />
                    <span>Uses Groq / Gemini LLM schema extraction</span>
                  </div>
                </div>
              ) : extractedClaims.length === 0 ? (
                /* Zero Claims Found */
                <div className="h-full min-h-[380px] flex flex-col items-center justify-center p-8 text-center space-y-3 text-gray-500">
                  <AlertCircle className="w-8 h-8 text-amber-700" />
                  <h3 className="font-mono font-bold text-gray-800 text-sm uppercase">
                    No Knowledge Claims Extracted
                  </h3>
                  <p className="text-xs font-mono text-gray-600 max-w-sm">
                    The model did not find any architecture decisions, risks, or next actions in the provided script. Try selecting one of the preset scripts or adding explicit decision statements.
                  </p>
                </div>
              ) : (
                /* Clean Claims List */
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-gray-600 pb-2 border-b border-beige-border">
                    <span>Extracted {extractedClaims.length} structured items</span>
                    <span className="text-emerald-800 font-bold">✓ Parsed Successfully</span>
                  </div>

                  {extractedClaims.map((claim, index) => {
                    const isConflicted = String(claim.status || '').toLowerCase() === 'conflicted';

                    return (
                      <div
                        key={claim.id || index}
                        className={`bg-white border-2 p-4 space-y-2.5 transition-fast ${
                          isConflicted
                            ? 'border-amber-400 bg-amber-50/20'
                            : 'border-beige-border hover:border-forest/50'
                        }`}
                      >
                        {/* Claim Card Top Meta */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            {getClaimTypeBadge(claim.claim_type)}
                            {getStatusBadge(claim.status)}
                          </div>
                          <span className="font-mono text-[11px] text-gray-400">
                            #{String(index + 1).padStart(2, '0')}
                          </span>
                        </div>

                        {/* Claim Statement */}
                        <p className="text-sm font-sans font-medium text-gray-900 leading-relaxed">
                          {claim.statement}
                        </p>

                        {/* Extra metadata if present */}
                        {(claim.required_role || claim.source_ids?.length > 0 || claim.evidences?.length > 0) && (
                          <div className="pt-2 border-t border-beige-border flex items-center justify-between text-[11px] font-mono text-gray-500">
                            {claim.required_role && (
                              <span>Role: <strong className="text-forest uppercase">{claim.required_role}</strong></span>
                            )}
                            {(claim.source_ids?.length > 0 || claim.evidences?.length > 0) && (
                              <span>Sources: {claim.source_ids?.length || claim.evidences?.length}</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
