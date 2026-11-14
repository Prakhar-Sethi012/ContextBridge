import React from 'react';
import { Hexagon, Database, ChevronDown, Sparkles, RefreshCw } from 'lucide-react';

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
  return (
    <header className="w-full bg-forest text-white border-b-2 border-forest-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left Side: Brand & Engine Identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-forest-surface border border-forest-light flex items-center justify-center text-vibrant">
            <Hexagon className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-lg tracking-tight text-white">
                ContextBridge
              </span>
              <span className="hidden sm:inline-block bg-forest-surface border border-forest-light text-vibrant font-mono text-[10px] uppercase px-1.5 py-0.5 tracking-wider">
                v0.1.0 • pgvector
              </span>
            </div>
            <p className="text-[11px] font-mono text-gray-300 tracking-wide uppercase">
              Project State Reconstruction Engine
            </p>
          </div>
        </div>

        {/* Right Side: Role Toggle, Project ID & Actions */}
        <div className="flex items-center gap-3">
          {/* Project ID Tag */}
          <div className="hidden md:flex items-center gap-1.5 bg-forest-dark border border-forest-light px-2.5 py-1 text-xs font-mono">
            <Database className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-400">PROJECT:</span>
            <span className="text-white font-bold">#{projectId}</span>
          </div>

          {/* Role Toggle Dropdown (No browser chrome) */}
          <div className="relative flex items-center">
            <label htmlFor="role-select" className="sr-only">
              RBAC Role
            </label>
            <div className="relative flex items-center bg-forest-surface border border-forest-light hover:border-vibrant transition-fast">
              <span className="pl-3 pr-1 text-[11px] font-mono text-gray-300 uppercase select-none">
                ROLE:
              </span>
              <select
                id="role-select"
                value={currentRole}
                onChange={(e) => onRoleChange(e.target.value)}
                className="appearance-none bg-transparent text-white font-mono text-xs py-2 pl-1 pr-8 cursor-pointer focus:outline-none"
              >
                <option value="project_head" className="bg-[#0B3D30] text-white">
                  Project Head
                </option>
                <option value="junior_dev" className="bg-[#0B3D30] text-white">
                  Junior Contributor
                </option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-vibrant absolute right-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Generate / Reconstruct Handover Button */}
          <button
            type="button"
            onClick={onGenerateBlueprint}
            disabled={isGenerating || isSeeding}
            title="Reconstruct project state via Gemini LLM"
            className="hidden sm:flex items-center gap-1.5 bg-transparent border border-vibrant text-vibrant hover:bg-vibrant/10 active:bg-vibrant/20 disabled:opacity-50 px-3 py-2 font-mono text-xs uppercase tracking-wider font-semibold transition-fast cursor-pointer"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Reconstructing...' : 'Reconstruct'}</span>
          </button>

          {/* Seed Database Button (Flat, solid vibrant green with forest text) */}
          <button
            type="button"
            onClick={onSeedDatabase}
            disabled={isSeeding || isGenerating}
            title="Seed synthetic engineering chat & issue sources"
            className="flex items-center gap-1.5 bg-vibrant text-forest hover:bg-vibrant-hover active:bg-vibrant-dark active:text-white disabled:opacity-50 px-4 py-2 font-mono text-xs uppercase tracking-wider font-bold transition-fast cursor-pointer border border-vibrant"
          >
            <RefreshCw className={`w-3.5 h-3.5 stroke-[2.5] ${isSeeding ? 'animate-spin' : ''}`} />
            <span>{isSeeding ? 'Seeding...' : 'Seed Database'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

