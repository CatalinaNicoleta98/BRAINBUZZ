import { AppShell } from "../../shared/components/AppShell";
import { GlassPanel } from "../../shared/components/GlassPanel";

export function ResultsPage() {
  return (
    <AppShell>
      <GlassPanel>
        <h1 className="font-display text-3xl font-bold">Results</h1>
        <p className="mt-3 text-slate-300">Leaderboard and final podium will appear here.</p>
      </GlassPanel>
    </AppShell>
  );
}
