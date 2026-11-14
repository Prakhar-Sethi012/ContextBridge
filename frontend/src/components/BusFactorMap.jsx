import React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Database,
  Cloud,
  KeyRound,
  User,
  Users,
  ShieldAlert,
  Info,
  RefreshCw,
} from 'lucide-react';

export default function BusFactorMap({
  data = [],
  projectId = 1,
  onRefresh,
  isRefreshing,
}) {
  const getDomainIcon = (domain) => {
    const d = String(domain || '').toLowerCase();
    if (d.includes('data') || d.includes('postg') || d.includes('mongo')) {
      return <Database className="w-5 h-5 text-forest" />;
    }
    if (d.includes('deploy') || d.includes('aws') || d.includes('cloud')) {
      return <Cloud className="w-5 h-5 text-forest" />;
    }
    if (d.includes('auth') || d.includes('login') || d.includes('token')) {
      return <KeyRound className="w-5 h-5 text-forest" />;
    }
    return <Users className="w-5 h-5 text-forest" />;
  };

  const highRiskCount = data.filter((d) => d.risk_level === 'High Risk').length;
  const mediumRiskCount = data.filter((d) => d.risk_level === 'Medium Risk').length;
  const lowRiskCount = data.filter((d) => d.risk_level === 'Low Risk').length;

  return (
    <div className="space-y-6">
      {/* Top Banner: Continuity Overview & Key Metrics */}
      <div className="bg-white border-2 border-beige-border p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-beige-border pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-forest" />
              <h2 className="font-mono font-bold text-base text-forest uppercase tracking-wider">
                Bus-Factor Analytics & Knowledge Continuity Map
              </h2>
            </div>
            <p className="text-xs text-gray-600 max-w-2xl leading-relaxed">
              Analyzes engineering communication artifacts (GitHub issues & chat logs) to map operational knowledge concentration. High-risk domains indicate single-engineer dependencies.
            </p>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="self-start md:self-auto inline-flex items-center gap-1.5 bg-beige hover:bg-beige-dark text-forest border border-beige-border px-3 py-1.5 font-mono text-xs uppercase font-semibold transition-fast cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Analytics</span>
          </button>
        </div>

        {/* Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
          <div className="space-y-0.5">
            <span className="font-mono text-[11px] uppercase tracking-wider text-gray-500 font-semibold block">
              Tracked Domains
            </span>
            <span className="text-2xl font-bold font-mono text-charcoal">{data.length}</span>
          </div>

          <div className="space-y-0.5">
            <span className="font-mono text-[11px] uppercase tracking-wider text-red-700 font-semibold block">
              High Risk Silos
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-red-700">{highRiskCount}</span>
              <span className="text-xs font-mono text-red-600">critical</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="font-mono text-[11px] uppercase tracking-wider text-amber-700 font-semibold block">
              Medium Risk Domains
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-amber-700">{mediumRiskCount}</span>
              <span className="text-xs font-mono text-amber-600">vulnerable</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="font-mono text-[11px] uppercase tracking-wider text-forest font-semibold block">
              Resilient Domains
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-forest">{lowRiskCount}</span>
              <span className="text-xs font-mono text-emerald-600">distributed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Heatmap Cards (Design 2.B) */}
      {data.length === 0 ? (
        <div className="bg-white border-2 border-beige-border p-12 text-center space-y-3">
          <Info className="w-8 h-8 text-gray-400 mx-auto" />
          <h3 className="font-mono font-bold text-sm uppercase tracking-wider text-forest">
            No Analytics Available for Project #{projectId}
          </h3>
          <p className="text-xs text-gray-600 max-w-md mx-auto">
            Seed the database with chat and issue sources to generate knowledge continuity metrics.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.map((item) => {
            const isHighRisk = item.risk_level === 'High Risk';
            const isMediumRisk = item.risk_level === 'Medium Risk';
            const isLowRisk = item.risk_level === 'Low Risk';

            // Card border & accent configuration strictly following prompt constraints:
            // "If risk_level is 'High Risk', apply a stark, flat red border/accent (avoid bright neon). If 'Low Risk', use a flat text-forest or border-vibrant accent."
            let borderStyle = 'border-2 border-forest';
            let badgeBg = 'bg-forest text-vibrant border border-forest';
            let meterColor = 'bg-forest';

            if (isHighRisk) {
              borderStyle = 'border-2 border-red-700';
              badgeBg = 'bg-red-700 text-white';
              meterColor = 'bg-red-700';
            } else if (isMediumRisk) {
              borderStyle = 'border-2 border-amber-600';
              badgeBg = 'bg-amber-600 text-white';
              meterColor = 'bg-amber-600';
            } else {
              borderStyle = 'border-2 border-forest';
              badgeBg = 'bg-forest text-vibrant border border-forest';
              meterColor = 'bg-forest';
            }

            return (
              <div
                key={item.domain}
                className={`bg-white ${borderStyle} flex flex-col justify-between p-5 space-y-5 shadow-none transition-fast hover:translate-y-[-2px]`}
              >
                {/* Card Top: Domain Icon & Risk Badge */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 bg-beige border border-beige-border flex items-center justify-center">
                      {getDomainIcon(item.domain)}
                    </div>
                    <span
                      className={`font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-1 ${badgeBg}`}
                    >
                      {item.risk_level}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-mono font-bold text-base text-gray-900 tracking-tight">
                      {item.domain}
                    </h3>
                    <p className="text-[11px] font-mono text-gray-500 mt-0.5">
                      Architecture & Operational Domain
                    </p>
                  </div>
                </div>

                {/* Primary Holder Info Box */}
                <div className="bg-beige/60 border border-beige-border p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-gray-500 uppercase text-[10px] font-bold">
                      Primary Knowledge Holder:
                    </span>
                    <span className="text-[10px] text-gray-400">Top Mentions</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-white border border-beige-border flex items-center justify-center text-forest">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-mono font-bold text-sm text-gray-900">
                        {item.primary_holder !== 'None' ? `@${item.primary_holder}` : 'No contributor recorded'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contributors Count & Discrete Discrete Meter */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-gray-600">Unique Contributors:</span>
                    <strong className="text-charcoal text-sm">{item.unique_contributors}</strong>
                  </div>

                  {/* Discrete block meter */}
                  <div className="grid grid-cols-3 gap-1.5 h-2">
                    <div
                      className={`${
                        item.unique_contributors >= 1 ? meterColor : 'bg-gray-200'
                      }`}
                    />
                    <div
                      className={`${
                        item.unique_contributors >= 2 ? meterColor : 'bg-gray-200'
                      }`}
                    />
                    <div
                      className={`${
                        item.unique_contributors >= 3 ? meterColor : 'bg-gray-200'
                      }`}
                    />
                  </div>
                </div>

                {/* Plain-English Continuity Diagnostic */}
                <div className="pt-3 border-t border-beige-border text-xs leading-relaxed text-gray-700">
                  {isHighRisk && (
                    <div className="flex items-start gap-1.5 text-red-800 font-mono text-[11px]">
                      <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5 text-red-700" />
                      <span>
                        <strong>Knowledge Silo:</strong> If {item.primary_holder} is unavailable, domain operations face immediate deadlock.
                      </span>
                    </div>
                  )}
                  {isMediumRisk && (
                    <div className="flex items-start gap-1.5 text-amber-800 font-mono text-[11px]">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
                      <span>
                        <strong>Fragile Resilience:</strong> Knowledge is shared between only 2 engineers. Consider cross-training.
                      </span>
                    </div>
                  )}
                  {isLowRisk && (
                    <div className="flex items-start gap-1.5 text-forest font-mono text-[11px]">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-forest" />
                      <span>
                        <strong>Resilient Continuity:</strong> Multi-engineer coverage across 3+ team members.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

