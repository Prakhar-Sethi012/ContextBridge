import React from 'react';
import { Hexagon, Database, ChevronDown, Sparkles, RefreshCw, Shield, Radio } from 'lucide-react';

export default function Header({
  currentRole,
  onRoleChange,
  onSeedDatabase,
  onGenerateBlueprint,
  isSeeding,
  isGenerating,
  projectId = 1,
  onProjectIdChange,
}) {
  const isProjectHead = currentRole === 'project_head';

  return (
    <header className="w-full bg-forest text-white border-b-2 border-forest-dark sticky top-0 z-30 shadow-none">
      <div className="w-full px-6 sm:px-8 py-3.5 min-h-[80px] flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Prominent Engine Brand & Visual Hierarchy */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-forest-surface border-2 border-forest-light flex items-center justify-center text-vibrant shrink-0">
            <Hexagon className="w-6 h-6 stroke-[2.2]" />
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-bold text-xl tracking-tight text-white font-sans">
                ContextBridge
              </span>
              <span className="inline-flex items-center gap-1 bg-forest-surface border border-forest-light text-vibrant text-[10px] font-mono uppercase px-2 py-0.5 tracking-wider font-semibold">
                <Radio className="w-2.5 h-2.5 text-vibrant animate-pulse" />
                Live Engine
              </span>
              <span className="hidden lg:inline-block text-[11px] font-mono text-gray-400">
                pgvector • Gemini RAG
              </span>
            </div>
            <p className="text-xs text-gray-300 font-mono tracking-wider uppercase">
              Project State Reconstruction & Knowledge Continuity Engine
            </p>
          </div>
        </div>

        {/* Right Side: Structured Controls & Actions */}
        <div className="flex items-center flex-wrap gap-3">
          {/* Project Identity Chip */}
          <div className="flex items-center gap-2 bg-forest-dark border border-forest-light px-3 py-2 text-xs font-mono">
            <Database className="w-3.5 h-3.5 text-vibrant" />
            <span className="text-gray-400 text-[11px] uppercase">PROJECT:</span>
            <span className="text-white font-bold tracking-wider">#{projectId}</span>
          </div>

          {/* Role Toggle Dropdown with Clear Visual Hierarchy */}
          <div className="relative flex items-center">
            <label htmlFor="role-select" className="sr-only">
              RBAC Role
            </label>
            <div className="relative flex items-center bg-forest-surface border-2 border-forest-light hover:border-vibrant transition-fast">
              <div className="pl-3 pr-1.5 flex items-center gap-1.5 text-gray-300 select-none">
                <Shield className="w-3.5 h-3.5 text-vibrant" />
                <span className="text-[11px] font-mono uppercase font-bold tracking-wider">
                  ROLE:
                </span>
              </div>
              <select
                id="role-select"
                value={currentRole}
                onChange={(e) => onRoleChange(e.target.value)}
                className="appearance-none bg-transparent text-white font-mono text-xs font-semibold py-2.5 pl-1 pr-9 cursor-pointer focus:outline-none"
              >
                <option value="project_head" className="bg-[#0B3D30] text-white py-1">
                  Project Head (Full RBAC)
                </option>
                <option value="junior_dev" className="bg-[#0B3D30] text-white py-1">
                  Junior Contributor (Public)
                </option>
              </select>
              <ChevronDown className="w-4 h-4 text-vibrant absolute right-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Secondary Action: Reconstruct / Generate Handover Blueprint */}
          <button
            type="button"
            onClick={onGenerateBlueprint}
            disabled={isGenerating || isSeeding}
            title="Reconstruct project state via Gemini RAG pipeline"
            className="flex items-center gap-1.5 bg-transparent border-2 border-vibrant text-vibrant hover:bg-vibrant/10 active:bg-vibrant/20 disabled:opacity-50 px-4 py-2 font-mono text-xs uppercase tracking-wider font-bold transition-fast cursor-pointer"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Reconstructing...' : 'Reconstruct'}</span>
          </button>

          {/* Primary Action: Seed Database Button */}
          <button
            type="button"
            onClick={onSeedDatabase}
            disabled={isSeeding || isGenerating}
            title="Seed synthetic engineering chat & issue sources"
            className="flex items-center gap-2 bg-vibrant text-forest hover:bg-vibrant-hover active:bg-vibrant-dark active:text-white disabled:opacity-50 px-4 py-2 font-mono text-xs uppercase tracking-wider font-extrabold transition-fast cursor-pointer border-2 border-vibrant"
          >
            <RefreshCw className={`w-3.5 h-3.5 stroke-[2.5] ${isSeeding ? 'animate-spin' : ''}`} />
            <span>{isSeeding ? 'Seeding...' : 'Seed Database'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
