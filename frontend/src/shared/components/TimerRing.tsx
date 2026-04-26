interface TimerRingProps {
  endsAt: number | null;
}

export function TimerRing({ endsAt }: TimerRingProps) {
  const remaining = endsAt ? Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)) : 0;

  return (
    <div className="flex h-28 w-28 items-center justify-center rounded-full border border-electric/40 bg-slate-950/70 shadow-neon">
      <div className="text-center">
        <div className="font-display text-4xl font-bold text-electric">{remaining}</div>
        <div className="text-xs uppercase tracking-[0.3em] text-slate-400">seconds</div>
      </div>
    </div>
  );
}
