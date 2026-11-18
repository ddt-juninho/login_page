import DragonEmblem from './DragonEmblem';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({
  message = 'A carregar arena...',
}: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col items-center justify-center p-6 select-none">
      <div className="flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-full border-2 border-amber-500/40 bg-zinc-900 flex items-center justify-center">
          <DragonEmblem className="w-12 h-12" />
        </div>

        <p className="text-xs font-extrabold uppercase tracking-widest text-amber-400">
          {message}
        </p>
      </div>
    </div>
  );
}