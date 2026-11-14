import React, { useEffect } from 'react';
import { X, FileText, User, Clock, Shield, MessageSquare, AlertCircle, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';
import { formatTimestamp } from '../utils';

export default function EvidenceDrawer({ claim, isOpen, onClose }) {
  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !claim) return null;

  const evidences = claim.evidences || [];

  const getStatusBadge = (status) => {
    const s = String(status).toLowerCase();
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
    const t = String(type).toLowerCase();
    const map = {
      decision: { label: 'Decision', bg: 'bg-forest/10', text: 'text-forest', border: 'border-forest/40' },
      risk: { label: 'Risk', bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-300' },
      dependency: { label: 'Dependency', bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-300' },
      next_action: { label: 'Next Action', bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-300' },
    };
    const style = map[t] || { label: t, bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' };
    return (
      <span className={`inline-block font-mono text-[11px] font-bold uppercase px-2 py-0.5 border ${style.bg} ${style.text} ${style.border}`}>
        {style.label}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Flat backdrop (no blur, sharp linear fade) */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity duration-150 ease-linear cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sliding Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-2xl bg-white border-l-2 border-forest flex flex-col shadow-none transform transition-transform duration-150 ease-linear">
          {/* Drawer Header */}
          <div className="bg-forest text-white px-6 py-4 flex items-center justify-between border-b-2 border-forest-dark">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-forest-surface border border-forest-light flex items-center justify-center text-vibrant">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-mono font-bold text-sm uppercase tracking-wider text-white">
                  Evidence Verification
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-xs text-gray-300">
                    CLAIM #{claim.id}
                  </span>
                  <span className="text-gray-400">•</span>
                  {getClaimTypeBadge(claim.claim_type)}
                </div>
              </div>
            </div>

            {/* Flat Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-300 hover:text-white hover:bg-forest-light border border-transparent hover:border-forest-light transition-fast cursor-pointer"
              title="Close evidence drawer (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-beige/40">
            {/* Reconstructed Fact Summary */}
            <div className="bg-white border-2 border-beige-border p-4 space-y-2.5">
              <div className="flex items-center justify-between border-b border-beige-border pb-2">
                <span className="font-mono text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Reconstructed Fact / Statement
                </span>
                {getStatusBadge(claim.status)}
              </div>
              <p className="text-sm font-semibold text-gray-900 leading-relaxed">
                {claim.statement}
              </p>
              <div className="pt-2 border-t border-beige-border flex items-center justify-between text-xs font-mono text-gray-600">
                <span>Role Clearance: <strong className="text-forest uppercase">{claim.required_role || 'Public'}</strong></span>
                <span>Linked Sources: <strong>{evidences.length}</strong></span>
              </div>
            </div>

            {/* Supporting Sources Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-xs font-bold text-forest uppercase tracking-wider flex items-center gap-2">
                  <span>Raw Ingested Evidence Sources</span>
                  <span className="bg-forest text-vibrant text-[11px] px-1.5 py-0.2 border border-forest">
                    {evidences.length}
                  </span>
                </h3>
                <span className="text-[11px] font-mono text-gray-500">
                  Strictly Verified via RBAC
                </span>
              </div>

              {evidences.length === 0 ? (
                <div className="bg-white border border-beige-border p-6 text-center space-y-2">
                  <AlertCircle className="w-6 h-6 text-gray-400 mx-auto" />
                  <p className="font-mono text-xs text-gray-600">
                    No source records were linked to this claim in the database.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {evidences.map((ev, index) => {
                    const src = ev.source || {};
                    return (
                      <div
                        key={ev.id || index}
                        className="bg-white border-2 border-beige-border hover:border-forest transition-fast"
                      >
                        {/* Source Metadata Header */}
                        <div className="bg-beige border-b border-beige-border px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                          <div className="flex items-center gap-2">
                            <span className="bg-forest text-white font-bold px-1.5 py-0.5 text-[10px]">
                              SRC #{src.id || ev.source_id}
                            </span>
                            <span className="inline-flex items-center gap-1 text-gray-700 font-semibold">
                              <User className="w-3.5 h-3.5 text-forest" />
                              {src.author || 'Unknown'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-gray-600">
                            <span className="inline-flex items-center gap-1">
                              <MessageSquare className="w-3 h-3 text-gray-500" />
                              <span className="uppercase text-[10px]">{src.type || 'Chat'}</span>
                            </span>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3 h-3 text-gray-500" />
                              <span>{formatTimestamp(src.timestamp)}</span>
                            </span>
                          </div>
                        </div>

                        {/* Raw Content Block */}
                        <div className="p-4 space-y-2">
                          <div className="bg-[#FAF8F5] border-l-4 border-forest p-3.5 font-mono text-xs text-gray-900 whitespace-pre-wrap leading-relaxed">
                            {src.content}
                          </div>

                          {/* Permissions & Security Clearance */}
                          {src.permissions && src.permissions.length > 0 && (
                            <div className="flex items-center gap-1.5 pt-1 text-[11px] font-mono text-gray-600">
                              <Shield className="w-3 h-3 text-gray-500" />
                              <span>Permissions:</span>
                              <div className="flex gap-1 flex-wrap">
                                {src.permissions.map((perm) => (
                                  <span
                                    key={perm}
                                    className={`px-1.5 py-0.2 text-[10px] uppercase font-bold border ${
                                      perm === 'public'
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                        : 'bg-red-50 text-red-800 border-red-300'
                                    }`}
                                  >
                                    {perm}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="bg-beige border-t border-beige-border px-6 py-3 flex items-center justify-between text-xs font-mono text-gray-600">
            <span>ContextBridge RAG Provenance Engine</span>
            <button
              type="button"
              onClick={onClose}
              className="bg-white border border-beige-border hover:border-forest text-gray-800 px-3 py-1 font-mono uppercase font-semibold transition-fast cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

