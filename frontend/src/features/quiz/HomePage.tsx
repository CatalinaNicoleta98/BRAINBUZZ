import { Link } from "react-router-dom";
import { AppShell } from "../../shared/components/AppShell";
import { GlassPanel } from "../../shared/components/GlassPanel";
import { SectionHeading } from "../../shared/components/SectionHeading";

export function HomePage() {
  return (
    <AppShell>
      <div className="grid flex-1 items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-8">
          <SectionHeading
            eyebrow="BrainBuzz"
            title="A real-time quiz arena built for speed, drama, and leaderboard chaos."
            description="Run vivid live quiz sessions with server-owned scoring, instant sockets, reconnect-friendly rooms, and a polished game-show feel on desktop or mobile."
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm uppercase tracking-[0.28em] text-slate-400">Multiplayer</div>
              <div className="mt-2 font-display text-3xl">Live</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm uppercase tracking-[0.28em] text-slate-400">Game State</div>
              <div className="mt-2 font-display text-3xl">Server-owned</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm uppercase tracking-[0.28em] text-slate-400">UI</div>
              <div className="mt-2 font-display text-3xl">Mobile-ready</div>
            </div>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              to="/host/create"
              className="rounded-2xl bg-electric px-6 py-4 text-center font-bold text-slate-950 transition hover:scale-[1.01]"
            >
              Host a Game
            </Link>
            <Link
              to="/player/join"
              className="rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-center font-bold transition hover:border-electric/60"
            >
              Join a Room
            </Link>
          </div>
        </div>

        <GlassPanel>
          <div className="space-y-5">
            <div className="rounded-[2rem] border border-white/10 bg-slate-950/55 p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm uppercase tracking-[0.3em] text-skyglow">Live features</p>
                <div className="rounded-full bg-electric/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-electric">
                  Socket ready
                </div>
              </div>
              <div className="mt-5 grid gap-3 text-sm text-slate-200">
                <div className="rounded-2xl bg-white/5 p-4">Server-authoritative scoring and timers</div>
                <div className="rounded-2xl bg-white/5 p-4">Responsive host and player flows</div>
                <div className="rounded-2xl bg-white/5 p-4">Live answer stats, leaderboard, and podium reveal</div>
              </div>
            </div>
          </div>
        </GlassPanel>
      </div>
    </AppShell>
  );
}
