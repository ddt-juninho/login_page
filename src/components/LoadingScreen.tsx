import React from 'react';
import DragonEmblem from './DragonEmblem';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({
  message = 'A carregar...',
}: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 text-white">
      <div className="relative flex items-center justify-center">
        <div className="absolute h-44 w-44 rounded-full border-4 border-zinc-800 border-t-amber-400 border-r-red-600 animate-spin" />
        <div className="h-36 w-36 rounded-full overflow-hidden shadow-2xl shadow-red-950/60 animate-pulse flex items-center justify-center">
          <DragonEmblem className="h-full w-full" />
        </div>
      </div>

      <div className="mt-8 text-center space-y-1.5">
        <p className="text-sm font-extrabold tracking-widest uppercase text-amber-500">
          Mortal Kombat
        </p>
        <p className="text-xs text-zinc-400 animate-pulse">{message}</p>
      </div>
    </div>
  );
}