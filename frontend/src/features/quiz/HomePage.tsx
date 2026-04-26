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
            title="A real-time quiz arena built for speed, tension, and big leaderboard moments."
            description="Host live rooms, bring players in with a room PIN, and let the server control every second of the game."
          />
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
            <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
              <p className="text-sm uppercase tracking-[0.3em] text-skyglow">Live features</p>
              <div className="mt-4 grid gap-3 text-sm text-slate-200">
                <div className="rounded-2xl bg-white/5 p-4">Server-authoritative scoring</div>
                <div className="rounded-2xl bg-white/5 p-4">Socket-driven lobbies and question flow</div>
                <div className="rounded-2xl bg-white/5 p-4">Animated leaderboards and podium finish</div>
              </div>
            </div>
          </div>
        </GlassPanel>
      </div>
    </AppShell>
  );
}
