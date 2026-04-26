import { useCountdown } from "../hooks/useCountdown";

interface TimerRingProps {
  endsAt: number | null;
  totalSeconds?: number;
}

export function TimerRing({ endsAt, totalSeconds = 15 }: TimerRingProps) {
  const { remainingSeconds, remainingMs } = useCountdown(endsAt);
  const circumference = 2 * Math.PI * 52;
  const progressRatio = totalSeconds > 0 ? remainingMs / (totalSeconds * 1000) : 0;
  const dashOffset = circumference * (1 - Math.max(0, Math.min(progressRatio, 1)));

  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="52" className="fill-none stroke-white/10" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r="52"
          className="fill-none stroke-electric"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="flex h-24 w-24 items-center justify-center rounded-full border border-electric/25 bg-slate-950/80 shadow-neon">
        <div className="text-center">
          <div className="font-display text-4xl font-bold text-electric">{remainingSeconds}</div>
          <div className="text-xs uppercase tracking-[0.3em] text-slate-400">seconds</div>
        </div>
      </div>
    </div>
  );
}
