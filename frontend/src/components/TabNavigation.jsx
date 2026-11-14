import React from 'react';
import { FileText, Activity, ShieldCheck, Lock } from 'lucide-react';

export default function TabNavigation({
  activeTab,
  onTabChange,
  claimsCount = 0,
  domainsCount = 0,
  currentRole = 'project_head',
}) {
  const isProjectHead = currentRole === 'project_head';

  return (
    <div className="w-full bg-beige border-b border-beige-border">
      <div className="w-full px-6 sm:px-8 flex flex-col sm:flex-row sm:items-center justify-between">
        {/* Flat Bottom-Border Tabs */}
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            type="button"
            onClick={() => onTabChange('blueprint')}
            className={`py-4 px-1 inline-flex items-center gap-2 font-mono text-sm uppercase tracking-wider transition-fast border-b-4 -mb-[1px] cursor-pointer ${
              activeTab === 'blueprint'
                ? 'border-vibrant text-forest font-bold'
                : 'border-transparent text-gray-500 hover:text-forest hover:border-gray-300 font-medium'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Transition Blueprint</span>
            {claimsCount > 0 && (
              <span
                className={`ml-1 text-[11px] font-mono px-1.5 py-0.2 border ${
                  activeTab === 'blueprint'
                    ? 'bg-forest text-vibrant border-forest'
                    : 'bg-beige-dark text-gray-700 border-beige-border'
                }`}
              >
                {claimsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onTabChange('busfactor')}
            className={`py-4 px-1 inline-flex items-center gap-2 font-mono text-sm uppercase tracking-wider transition-fast border-b-4 -mb-[1px] cursor-pointer ${
              activeTab === 'busfactor'
                ? 'border-vibrant text-forest font-bold'
                : 'border-transparent text-gray-500 hover:text-forest hover:border-gray-300 font-medium'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Bus-Factor Map</span>
            {domainsCount > 0 && (
              <span
                className={`ml-1 text-[11px] font-mono px-1.5 py-0.2 border ${
                  activeTab === 'busfactor'
                    ? 'bg-forest text-vibrant border-forest'
                    : 'bg-beige-dark text-gray-700 border-beige-border'
                }`}
              >
                {domainsCount}
              </span>
            )}
          </button>
        </nav>

        {/* Current RBAC Status Banner */}
        <div className="py-2.5 sm:py-0 flex items-center gap-2 text-xs font-mono">
          {isProjectHead ? (
            <div className="flex items-center gap-1.5 text-forest font-medium bg-beige-dark border border-beige-border px-2.5 py-1">
              <ShieldCheck className="w-3.5 h-3.5 text-forest" />
              <span>RBAC Clearance:</span>
              <span className="font-bold uppercase text-forest">Full (Public + Internal + Board)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-amber-900 font-medium bg-amber-50 border border-amber-200 px-2.5 py-1">
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span>RBAC Clearance:</span>
              <span className="font-bold uppercase text-amber-800">Restricted (Public Only)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

