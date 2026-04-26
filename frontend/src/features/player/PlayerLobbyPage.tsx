import { AppShell } from "../../shared/components/AppShell";
import { GlassPanel } from "../../shared/components/GlassPanel";

export function PlayerLobbyPage() {
  return (
    <AppShell>
      <GlassPanel>
        <h1 className="font-display text-3xl font-bold">Player Lobby</h1>
        <p className="mt-3 text-slate-300">Waiting room updates will appear here.</p>
      </GlassPanel>
    </AppShell>
  );
}
