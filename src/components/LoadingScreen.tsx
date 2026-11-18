import React from 'react';
import DragonEmblem from './DragonEmblem';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({
  message = 'A carregar arena...',
}: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col items-center justify-center p-6 select-none paint-contain">
      {/* Brilho radial leve sem custo de blur em tempo real */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at center, rgba(245, 158, 11, 0.16) 0%, rgba(9, 9, 11, 0) 60%)',
        }}
      />

      <div className="relative flex flex-col items-center gap-5">
        <div className="relative w-24 h-24 flex items-center justify-center">
          {/* Anel rotativo leve via GPU */}
          <div className="absolute inset-0 rounded-full border-2 border-amber-500/20 border-t-amber-400 animate-spin gpu-layer" />
          <DragonEmblem className="w-16 h-16" />
        </div>

        <p className="text-xs font-extrabold uppercase tracking-widest text-amber-400">
          {message}
        </p>
      </div>
    </div>
  );
}
