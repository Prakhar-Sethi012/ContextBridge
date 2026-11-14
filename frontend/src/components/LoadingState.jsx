import React from 'react';
import { Hexagon } from 'lucide-react';

export default function LoadingState({ message = 'Reconstructing memory...' }) {
  return (
    <div className="bg-white border-2 border-beige-border p-16 flex flex-col items-center justify-center space-y-4 text-center">
      <div className="relative">
        <Hexagon className="w-10 h-10 text-forest stroke-[1.8] animate-spin" />
        <div className="w-2 h-2 bg-vibrant absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>
      <div className="space-y-1">
        <p className="font-mono font-bold text-sm uppercase tracking-widest text-forest">
          {message}
        </p>
        <p className="font-mono text-xs text-gray-500">
          Enforcing RBAC clearances & vector-backed provenance...
        </p>
      </div>
    </div>
  );
}

