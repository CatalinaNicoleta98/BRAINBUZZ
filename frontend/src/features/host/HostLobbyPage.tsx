import { AppShell } from "../../shared/components/AppShell";
import { GlassPanel } from "../../shared/components/GlassPanel";

export function HostLobbyPage() {
  return (
    <AppShell>
      <GlassPanel>
        <h1 className="font-display text-3xl font-bold">Host Lobby</h1>
        <p className="mt-3 text-slate-300">Live player list and room controls will appear here.</p>
      </GlassPanel>
    </AppShell>
  );
}
